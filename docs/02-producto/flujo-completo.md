# El recorrido completo, con todos los caminos

Este documento describe **lo que la plataforma hace de verdad**, no lo que
querríamos que hiciera. Si algo de aquí no coincide con el código, gana el
código y hay que corregir este fichero.

Está escrito para poder responder a la pregunta que aparece siempre a las nueve
de la noche: *¿y si pasa tal cosa, qué ocurre?*

---

## 1. El profesor se da de alta

Entra en `/registro` y rellena una ficha. Tarda unos cinco minutos.

**Qué se le pide:** nombre y apellidos, correo, teléfono, colegio donde estudió,
carrera y universidad, asignaturas, cursos, idiomas acreditados, modalidad,
zona si da clase presencial, horario orientativo y un texto libre sobre algo que
le distinga al dar clase.

**Qué NO se le pide:** foto, nota de la EvAU, justificantes, ni ningún
documento. Es deliberado: cada requisito es gente que abandona a mitad, y
ninguno de esos datos se comprueba de todas formas.

### Si algo va mal al rellenar

| Situación | Qué pasa |
|---|---|
| Deja un campo obligatorio vacío | Sale un resumen de errores arriba y **no se pierde nada de lo escrito**, ni siquiera las casillas marcadas |
| El correo ya está registrado | Se le dice que ya hay una ficha con ese correo y que escriba a `info@academiavanza.es` |
| El teléfono no tiene formato español | Se rechaza, admitiendo espacios, guiones y el prefijo `+34` |
| Ese día ya se han dado de alta 20 profesores | Se le pide que vuelva mañana. Es el tope contra guiones automáticos |
| Su colegio no está en la lista | Escribe el nombre a mano y llega marcado en ámbar al panel |

### Al terminar

La ficha nace **pendiente**. No se publica sola.

En la misma pantalla se le ofrece activar los avisos al móvil, y se le explica
que su navegador le va a preguntar y que tiene que darle a «Permitir». También
se le avisa de que **le escribiremos por WhatsApp** desde el número de
AcademiAvanza cuando una familia le quiera, para que ese mensaje no le llegue
por sorpresa.

---

## 2. Administración revisa la ficha

En `/admin` aparecen las fichas pendientes, pensadas para leerse en un móvil y
decidir en dos minutos.

**Publicar.** La ficha pasa a activa, entra en el directorio, se le crea su
enlace permanente de acceso y **se le manda el correo de «tu ficha está
publicada»** con ese enlace dentro.

**Rechazar,** escribiendo un motivo. Se le manda un correo con ese motivo tal
cual, y puede corregir la ficha desde su enlace y volver a intentarlo.

**Borrar,** que se lleva por delante la ficha y todo lo que cuelga de ella.

### El caso raro que ya ha pasado

Si la ficha **no tiene teléfono** —son fichas de antes de que se pidiera—, la
base de datos impide publicarla y el panel lo avisa en ámbar antes de que se
intente. Sin teléfono el recorrido no puede terminar, porque es lo que recibe la
familia al final.

---

## 3. La familia busca

Entra en `/profesores`. Ve las fichas publicadas **en orden aleatorio, distinto
en cada visita**: cualquier orden fijo reparte visibilidad, y repartir
visibilidad es tomar partido.

Filtra por asignatura, curso, modalidad, colegio del profesor e idioma
acreditado. Todos empiezan en «Me es indiferente», y **solo se ofrecen opciones
que devuelven a alguien**: si nadie da Química, «Química» no está en la lista.

Si una combinación no devuelve a nadie, se le sugiere aflojar el filtro de
colegio, que es el que más recorta.

---

## 4. La familia escribe a un profesor

Desde la ficha del profesor. Se le piden **cinco cosas**: su nombre, su
teléfono, su correo, el curso del alumno y, opcionalmente, un mensaje.

**El correo es nuestro, no del profesor.** Sirve para avisarla de lo que va
pasando sin que tenga que acordarse de volver a una página. Al profesor sólo se
le da el nombre y el teléfono, y sólo al final.

**No se pide nada del alumno.** Ni nombre, ni edad, ni colegio.

### El filtro de datos sensibles

El campo de texto libre rechaza los mensajes que mencionan salud, diagnósticos,
medicación, religión u origen. Salta mientras se escribe, el botón se apaga, y
el texto no llega a salir del navegador. La comprobación se repite en el
servidor, que es la que manda.

Detecta un diagnóstico escrito con su nombre; no detecta a quien lo cuente con
rodeos. Lo que de verdad protege es no pedir datos del alumno y borrar los
mensajes a los noventa días.

### Los frenos contra el abuso

| Regla | Qué pasa si se cruza |
|---|---|
| Máximo 5 solicitudes al día por teléfono | «Has escrito a varios profesores hoy, espera a ver qué te contestan» |
| No repetir al mismo profesor en 7 días | «Ya has escrito a este profesor hace poco» |

Se cuenta por teléfono, no por dirección de internet. Esto no para a alguien
decidido —quien quiera se inventa teléfonos— pero corta lo que de verdad pasa.

### Qué ocurre al enviar

Se crea la solicitud en estado **esperando al profesor**, con tres
identificadores distintos:

- **Código corto** (`27XJS`): va en el concepto del Bizum y se teclea en el
  panel. Al ser corto es adivinable, así que **no abre nada por sí solo**.
- **Enlace de la familia**: largo. Es su página de seguimiento y, como no
  tenemos su correo, **es lo único que tiene**.
- **Enlace del profesor**: largo. Es donde acepta o rechaza.

La familia va directa a su página de seguimiento, que le insiste en guardarla.

**El teléfono de la familia no se le pasa a nadie todavía.**

---

## 5. Se avisa al profesor

Por **dos canales a la vez**, siempre:

1. **Notificación al móvil**, si dio permiso. Llega en el momento y se contesta
   desde el autobús.
2. **Correo**, siempre, aunque la notificación haya llegado. Una notificación se
   descarta de un manotazo; un correo se queda ahí.

En la solicitud queda apuntado por dónde salió cada aviso. Cuando una solicitud
lleve tres días parada, la pregunta será «¿se enteró?», y esto la responde.

**Si no salió por ninguno**, el panel lo dice y ofrece un botón de WhatsApp con
el mensaje ya escrito. Es el único paso manual que queda, y solo aparece cuando
los automáticos han fallado.

> **Hoy el correo no sale**, porque el dominio no está verificado en Resend.
> Mientras eso siga así, el único aviso automático es la notificación al móvil,
> y solo para quien haya dado permiso.

---

## 6. El profesor decide

Abre su enlace y ve el curso, la fecha y el mensaje. **No ve el teléfono.**

**Si acepta:** la familia lo ve en su página y aparece el Bizum a pagar. Al
profesor se le ofrece activar los avisos al móvil si no lo había hecho.

**Si rechaza,** con un motivo opcional: la familia lo ve, **no paga nada**, y se
le ofrece buscar otro profesor.

**Si no hace nada:** se le recuerda dos veces, por correo y al móvil, y al
cumplirse el plazo la solicitud caduca sola. **El plazo lo elige la familia al
escribir**: cinco días si lo necesita ya, quince si es para las próximas
semanas, treinta si es para más adelante. A ella se le avisa por correo de que
nadie ha contestado y se le ofrece el directorio, en vez de dejarla mirando una
página que dice «esperando».

No se cierra ninguna solicitud si al profesor no le llegó ni el correo ni el
aviso al móvil: ese silencio no es suyo.

**Si pulsa el enlace dos veces** o lo reenvía, la segunda decisión no hace nada:
solo se puede decidir sobre lo que sigue esperando.

---

## 7. La familia paga

En su página ve el importe, el teléfono del Bizum y **el código para el
concepto**. El código no lleva ceros ni oes, ni unos ni íes ni eles, porque se
lee dos veces en pantallas pequeñas.

La página avisa de que los pagos se comprueban a mano y puede pasar un rato,
más si es de noche o fin de semana. Es preferible decirlo a que lo descubra
esperando.

### La confirmación, en dos pasos

En `/admin/cobros` se teclea el código y **primero se enseña de quién es**:
familia, profesor, curso e importe. El botón de confirmar aparece después.

Es deliberado. El código se lee de una notificación del móvil; si un carácter
mal escrito confirmara a la primera, se le habría dado el teléfono de una
familia a un profesor equivocado, y eso no se deshace.

| Situación | Qué dice el panel |
|---|---|
| El código no existe | «Revisa el concepto: no hay ni ceros ni oes» |
| Ya estaba cobrado | «Ya estaba cobrado. No se ha vuelto a cobrar nada» |
| El profesor aún no ha aceptado | «No deberías haber recibido este Bizum: devuélvelo» |
| Llega un Bizum sin concepto | No hay forma de saber de quién es. Hay que esperar a que la familia escriba |
| Pagan de menos o de más | El panel enseña el importe esperado antes de confirmar. La diferencia se arregla fuera de la plataforma |

---

## 8. Se abren los teléfonos

Al confirmar, y solo entonces:

- La familia ve el teléfono del profesor en su página, pinchable para llamar.
- Al profesor le llega un aviso con el nombre y el teléfono de la familia.

A partir de aquí **la plataforma no interviene**. El precio de las clases, los
horarios y la forma de pago los acuerdan ellos.

---

## 9. Si no sale bien

En la página de la familia aparecen dos botones. No hay que escribir a nadie ni
esperar a que nadie conteste.

**«No he conseguido hablar con él».** Disponible **a partir del tercer día**
desde el pago, porque muchos profesores tardan un día o dos en llamar y darle
por perdido antes sería injusto.

**«Hablamos pero no ha funcionado».** Disponible desde el primer momento. Cubre
que no se pusieran de acuerdo, que no se presentara o que las clases no
cuajaran.

En los dos casos **el contacto gratis se concede al instante**. La familia ve su
código y puede escribir a otro profesor: al meter ese código, la nueva solicitud
sale a 0 €.

**No hay límite de cuántos puede encadenar.** Sí hay dos frenos que no molestan
a nadie honesto: solo un vale activo a la vez, y los tres días de espera.

### La consecuencia para el profesor

Si **dos familias distintas** dicen que no consiguieron hablar con él, su ficha
**se pausa sola** y se le manda un correo.

Escrito sin acusarle de nada: lo más probable es que haya cambiado de número,
esté de exámenes o se olvidara de que se dio de alta. Volver al directorio es un
botón desde su enlace.

Solo cuentan los vales por «no conseguí hablar». Que dos familias hayan dado
clases y no hayan encajado no dice nada malo de nadie.

### La devolución

Si prueba con varios y ninguno le encaja, se le dice que escriba a
`info@academiavanza.es` y **se le devuelve el dinero**. Eso sí es manual: un
Bizum no se devuelve solo.

---

## 10. El panel del profesor

Su enlace permanente, sin contraseña. Desde ahí puede:

- Ver si su ficha está publicada, pausada o pendiente de revisión.
- **Pausarla y reactivarla.** Pausada no aparece en el directorio y no recibe
  solicitudes. No se borra nada.
- Ver las solicitudes que tiene sin contestar.
- Cambiar asignaturas, cursos, idiomas, modalidad, zona, horario, teléfono y su
  presentación.
- Confirmar que sigue disponible cuando toque.

**No puede cambiar su nombre ni su colegio.** El colegio es lo único que
administración revisa antes de publicar; dejarlo editable después convertiría
esa revisión en un trámite vacío.

---

## 11. Lo que corre solo, todos los días

Vercel llama a `/api/mantenimiento` cada mañana:

| Tarea | Cuándo |
|---|---|
| Caducar solicitudes que nadie ha contestado | Al plazo que eligió la familia: 5, 15 o 30 días |
| Borrar los mensajes de familias | A los 90 días, la fila entera |
| Mandar «¿sigues dando clase?» | A los 3 meses sin confirmar |
| Pausar a quien no conteste al recordatorio | 14 días después |

Y dos veces por semana, un ping a la base de datos: el plan gratuito de Supabase
duerme el proyecto tras siete días sin actividad.

**El recordatorio solo cuenta como enviado si el correo sale de verdad.** Si no
sale, se queda pendiente y no se pausa a nadie. Sin esa cautela, con el correo
apagado el directorio se habría vaciado solo en dos semanas.

---

## 12. Los estados de una solicitud

```
                    ┌── rechazada ──────────────► fin, nadie paga
                    │
esperando ──────────┼── aceptada ── pagada ──┬── todo bien
al profesor         │                        │
                    │                        └── vale ──► nueva solicitud a 0 €
                    │
                    └── caducada (sin respuesta en el plazo elegido)
```

Una vez pagada no vuelve atrás. El vale no cancela la solicitud pagada: crea
otra nueva y deja la primera como está, para que quede el rastro.

---

## 13. Preguntas que van a surgir

**¿Y si el profesor pausa su ficha teniendo solicitudes sin contestar?**
Las solicitudes siguen vivas y puede contestarlas desde sus enlaces. Lo que deja
de pasar es que le lleguen nuevas.

**¿Y si retiras una ficha entre que el profesor acepta y la familia paga?**
El pago sigue funcionando y los teléfonos se abren. La familia ya tenía un
acuerdo y no se le puede dejar colgada por una decisión posterior.

**¿Y si la familia pierde su enlace?**
Lo recupera en `/solicitud` con su código y su teléfono. Hacen falta los dos: el
código solo es corto y detrás hay el teléfono de una persona.

**¿Y si vuelve a los tres meses?**
Su solicitud ya se ha borrado y verá la página de «aquí no hay nada», que se lo
explica y le ofrece el directorio. **Un vale sin usar se pierde con ella**, y
eso hoy no se avisa en ninguna parte.

**¿Y si dos familias escriben al mismo profesor a la vez?**
Son dos solicitudes independientes, con códigos y enlaces distintos. Puede
aceptar las dos.

**¿Y si un profesor cambia de número?**
Lo cambia desde su panel. Las solicitudes ya pagadas mantienen el teléfono que
se enseñó en su momento.

**¿Y si alguien entra en `/admin` sin contraseña?**
Le redirige a la pantalla de entrada. Todas las acciones comprueban la sesión
por separado: no basta con esconder los botones.
