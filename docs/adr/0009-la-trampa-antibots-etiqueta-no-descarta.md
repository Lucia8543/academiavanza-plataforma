# ADR 0009 — La trampa antibots etiqueta, no descarta

**Fecha:** Agosto 2026
**Estado:** Aceptada

---

## Contexto

Los tres formularios abiertos al público (el alta de profesor, el contacto de una
familia y el buzón de fallos) llevaban desde el principio la misma defensa contra
guiones automáticos. Son dos señales: un campo señuelo invisible en la página
pero presente en el HTML, y un tiempo mínimo de relleno de tres segundos. Ninguna
de las dos guarda datos de nadie, que es por lo que se eligieron frente a contar
envíos por dirección IP.

Cuando alguna de las dos saltaba, el envío **se descartaba y a quien lo había
mandado se le contestaba que todo había ido bien**. La lógica era razonable
mirando sólo al atacante: decirle a un guion «te he pillado» es decirle qué tiene
que cambiar para colarse a la siguiente.

En agosto de 2026, ya con la plataforma lanzada, varias profesoras avisaron de
que habían rellenado su ficha y no habían recibido ningún correo. No había fila
en la base de datos, no había registro de error y no había forma de saber cuántas
eran.

La causa era el nombre del campo señuelo. Se llamaba `apellido2`, un nombre
elegido para despistar a quien mirara el código de la página. Lo que no se
previó es que el autorrelleno de Chrome y los gestores de contraseñas también
leen esos nombres, y «segundo apellido» es uno de los que reconocen y completan
solos, especialmente en el móvil. A cualquier persona con el autorrelleno puesto
se le llenaba el señuelo sin verlo.

El nombre del campo se cambió el mismo día. Pero eso arreglaba el síntoma.

## El fallo de fondo

Lo que falló no fue la elección del nombre sino la forma de la decisión. Era una
decisión **automática, irreversible e invisible sobre algo que no se puede
recuperar**.

Los tres adjetivos importan por separado, y juntos son lo que hace que el error
no se detecte:

- Automática, así que nadie la revisa.
- Irreversible, porque el texto que la persona escribió sólo existía en la
  memoria del servidor durante la petición.
- Invisible, porque el mensaje de éxito era idéntico al de un envío correcto, de
  modo que ni quien lo enviaba ni nosotros teníamos manera de enterarnos.

Cualquier detector se equivoca alguna vez. Un detector que se equivoca en voz
alta cuesta un rato de trabajo. Uno que se equivoca en silencio y borra la
prueba de su error puede estar funcionando mal durante meses.

## Decisión

**El detector antibots deja de decidir. Sólo etiqueta.**

En concreto:

1. Los tres formularios **guardan siempre**. No hay ningún camino en el que un
   envío del público se pierda por una sospecha nuestra.
2. Lo que el detector ve se guarda con el envío, en una columna `sospecha_bot`
   que admite `trampa`, `demasiado-rapido` o nada.
3. Esa etiqueta **sale en el panel**, en la propia tarjeta de la ficha, con la
   explicación de por qué se puso y de qué fiabilidad tiene cada motivo. Hay
   además un filtro para verlas juntas cuando llegan varias de golpe.
4. Quien revisa decide. En el caso de los profesores esto no añade trabajo,
   porque todas las fichas nacen `pendiente` y ya pasaban por una revisión
   humana; lo único que cambia es que ahora esa decisión se toma con un dato
   más delante.
5. La función se llama `etiquetaDeSospecha` y ya no `oler`. Un verbo como aquél
   invitaba a escribir `if (oler(x)) return`, que es literalmente la línea que
   costó las fichas.
6. Una prueba lee los tres ficheros de entrada como texto y falla si la sospecha
   vuelve a aparecer dentro de un `if` que corta el recorrido.

El señuelo relleno **por sí solo tampoco marca nada**. Casi siempre es el
autorrelleno de una persona real, y marcarla haría desconfiar de ella al revisar
su ficha. Hacen falta las dos señales a la vez, o el envío instantáneo por su
cuenta.

## Consecuencias

**Se pierde defensa.** Un guion que envíe despacio entra y se publica como
pendiente. Con el volumen de esta plataforma eso son unas pocas fichas basura
que se borran de un vistazo, y ese coste está medido: un minuto de trabajo
contra una profesora que se cree apuntada y no lo está, que no se recupera.

**Las solicitudes de familia marcadas se tramitan con normalidad.** Aquí hay una
diferencia importante con las fichas de profesor, y es deliberada: en el
recorrido de una familia no hay nadie revisando antes de que las cosas ocurran, y
frenar una solicitud marcada exigiría que alguien la desbloqueara. Eso rompería
la regla de que nada requiere intervención diaria, y dejaría a una familia
esperando sin saber por qué. La etiqueta queda guardada sólo para poder mirar
atrás.

**El buzón de fallos es el caso más claro de todos.** Quien escribe ahí es
alguien a quien la web le acaba de fallar. Perder su aviso significa que el fallo
sigue vivo y que además ya nadie lo va a contar dos veces.

**La pantalla de «he perdido mi enlace» se queda sin detector.** No crea nada:
manda a una dirección ya registrada un enlace que esa misma dirección recibió en
su día, como mucho una vez cada diez minutos. Un guion que la aporree no
consigue nada que no tuviera, y en cambio una profesora bloqueada ahí se queda
fuera de su ficha sin nadie a quien preguntar.

**No se sabe a cuánta gente afectó el fallo original.** No quedó rastro, que es
justamente el problema. Los datos no se pueden recuperar y a las afectadas hay
que pedirles que vuelvan a rellenar el formulario.

## Alternativas descartadas

**Un captcha.** Resuelve el problema de verdad y tiene un coste que aquí no
compensa: es una barrera más en un formulario que ya pide veinte campos a
estudiantes de dieciocho años que lo rellenan desde el móvil.

**Guardar los descartados en una tabla aparte.** Era la idea inicial y añade una
tabla, un borrado automático por retención y un párrafo en la política de
privacidad, todo para acabar en el mismo sitio. Si el envío se guarda igual, la
tabla sobra.

**Bloquear las marcadas hasta que alguien las apruebe.** Para los profesores es
exactamente lo que ya pasa. Para las familias sería un flujo nuevo que exige
presencia diaria, y eso contradice el criterio que gobierna todo el proyecto.

---

## Referencias

- `src/shared/schemas/trampa-bots.ts`, con el detector y el motivo escrito al
  lado de cada decisión.
- `database/v1/25_sospecha_en_vez_de_descarte.sql`
- `tests/unit/nada-se-descarta-en-silencio.test.ts`, la prueba que impide la
  recaída.
- [ADR 0005](0005-entrada-sin-contrasena-con-enlace-propio.md), que comparte el
  criterio de fondo: entre proteger un poco más y dejar fuera a una persona
  real, esta plataforma elige no dejarla fuera.
