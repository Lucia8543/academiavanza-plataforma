# PRD 00 — Directorio mínimo

**La primera versión que se va a construir.** Sustituye temporalmente a los PRD 01
a 09, que describen el producto completo con cobro. Ver
[ADR 0004](../adr/0004-lanzar-un-directorio-gratuito.md).

---

## 1. Qué es

Una web pública donde una familia encuentra profesor particular sabiendo de qué
colegio viene cada uno, y le escribe. Nada más.

Cuatro pantallas y cuatro correos. Sin pagos, sin cuentas de familia, sin
mensajería, sin reseñas.

**La regla que resuelve las dudas:** si algo obliga a Lucía a intervenir más de una
vez al mes, no entra en esta versión.

---

## 2. Quién usa qué

| Quién | Se registra | Qué hace |
|---|---|---|
| **Familia** | No | Busca, filtra y envía un formulario de contacto |
| **Profesor** | Sí, con enlace al correo | Publica y mantiene su ficha |
| **Lucía** | Sí, es la única administradora | Aprueba fichas y poco más |

---

## 3. Las pantallas

### 3.1 Directorio · pública

La portada. Una rejilla de tarjetas de profesor con los filtros arriba.

Cada tarjeta muestra: **nombre de pila y primera inicial**, el **badge del
colegio**, la **carrera y universidad**, las **asignaturas**, los **niveles**, si
es **online, presencial o ambas**, y el **certificado de idiomas** si lo tiene.

**Filtros:** colegio, asignatura, nivel, modalidad, idioma y disponibilidad. Se
combinan entre sí y se reflejan en la dirección de la página, para que un filtro
concreto se pueda compartir por WhatsApp tal cual.

**Todos los filtros arrancan en «Me es indiferente»**, y esa opción está escrita
así, visible, no como una casilla vacía. Es especialmente importante en dos:

- **Colegio.** Una familia que no busca el Montpellier tiene que ver desde el
  primer momento que puede no elegir ninguno. Si el filtro parece obligatorio, el
  directorio se percibe como cerrado a un solo colegio.
- **Modalidad.** A muchas familias les da igual con tal de que el profesor encaje.

| Filtro | Opciones |
|---|---|
| Colegio | Me es indiferente · Montpellier · el resto del catálogo |
| Asignatura | Me es indiferente · las del catálogo |
| Nivel | Me es indiferente · Primaria, ESO, Bachillerato y sus cursos |
| Modalidad | Me es indiferente · Online · Presencial |
| Idioma | Me es indiferente · Inglés B2 o superior · C1 o superior · Francés · Alemán |
| Disponibilidad | Me es indiferente · un día y una franja concretos |

**El orden es aleatorio y cambia en cada visita.** En un directorio pequeño y
gratuito, cualquier orden fijo condena a los últimos de la lista a no recibir nunca
un mensaje. El orden se fija durante la sesión para que la lista no baile al
filtrar.

**Solo aparecen las fichas publicadas y disponibles.** Las ocultas no salen ni por
dirección directa.

### 3.2 Ficha del profesor · pública

Lo mismo que la tarjeta, más:

- **Sus puntos fuertes al enseñar**, escritos por él
- **Su disponibilidad**, en una rejilla de días y franjas
- **Certificados de idiomas**, si tiene alguno
- **Zona**, solo si ofrece presencial, y a nivel de barrio o municipio
- Un botón de **contactar**, que abre el formulario

**Los puntos fuertes no son una biografía.** La pregunta que se le hace al profesor
es concreta, porque una pregunta abierta produce tres frases genéricas que no
distinguen a nadie:

> Algo que te distinga al dar clase. Por ejemplo: que tienes mucha paciencia, que
> se te da bien explicar, que te manejas bien con adolescentes, que sabes preparar
> un examen concreto.

Máximo 300 caracteres. Es el único campo que de verdad distingue una ficha de otra,
porque todo lo demás son datos que comparten decenas de personas.

**La disponibilidad se muestra como rejilla**, no como texto: siete días por tres
franjas —mañana, tarde y noche—, con las casillas marcadas en color. Se lee de un
vistazo y evita la conversación de «¿y los martes puedes?».

Debajo, una línea que no se puede omitir:

> Horario orientativo, actualizado por el profesor. Confirmadlo al hablar.

**Los certificados son declarados.** El profesor elige idioma y nivel de una lista;
no se le pide ninguna foto ni ningún justificante, y la plataforma no comprueba
nada. En la ficha aparecen como «Inglés C1 (declarado)».

Un aviso permanente y visible, no escondido en el pie:

> El colegio que figura en el perfil lo declara el profesor. AcademiAvanza revisa
> que la declaración sea coherente, pero no la contrasta con el centro.
> AcademiAvanza no comprueba antecedentes penales ni ninguna otra idoneidad más
> allá de los datos académicos declarados.

**Estas fichas no se indexan en buscadores.** El directorio sí; las personas
concretas, no.

### 3.3 Formulario de contacto · pública

Se abre desde una ficha. Pide:

| Campo | Obligatorio | Nota |
|---|---|---|
| Nombre de pila | Sí | De quien escribe, no del alumno |
| Correo **o** teléfono | Sí, uno de los dos | Lo elige la familia |
| Curso | Sí | Del catálogo de niveles |
| Asignaturas | Sí | Del catálogo |
| Online o presencial | Sí | Con «me es indiferente» como tercera opción |
| Zona | Si es presencial | Barrio o municipio, nunca la calle |
| Cuándo le vendría bien | No | La misma rejilla de días y franjas |
| Mensaje | No | Máximo 500 caracteres |
| «Soy madre, padre o tutor legal» | Sí | Casilla |
| Acepto la política de privacidad | Sí | Casilla con enlace |

Bajo el campo de mensaje, en pequeño y siempre visible:

> Cuéntanos qué necesitáis, no qué le pasa a tu hijo. No escribas datos de salud ni
> información personal del menor.

**No se pide el nombre del alumno.** No hace falta para que el profesor decida, y
sin él la plataforma no trata ningún dato de un menor.

**Antirrobots:** un campo invisible que solo rellenan los programas automáticos, y
un límite de tres envíos por hora desde la misma dirección. Sin esto, el buzón de
los profesores se llena de basura y se van del directorio.

### 3.4 Panel del profesor · privada

Se entra con un enlace de un solo uso enviado al correo. Sin contraseñas: es el
motivo número uno de soporte y no queremos soporte.

Contiene su ficha en modo edición, el **interruptor de disponibilidad**, y un botón
de **darse de baja** que borra sus datos de verdad.

### 3.5 Panel de administración · privada

Deliberadamente pobre. Una lista de fichas pendientes; cada una se abre, se lee y
se aprueba o se rechaza con un motivo. Y un listado de todas las fichas por si hay
que ocultar alguna.

Tiene que funcionar bien en un móvil, porque es donde se va a usar.

---

## 4. Qué se guarda

Todo lo demás se queda fuera. La lista es corta a propósito.

### Profesor

| Dato | Público | Nota |
|---|---|---|
| Nombre y apellidos | **No** | En la ficha solo sale «Lucía C.» |
| Correo | **No** | Para entrar y para recibir los contactos |
| Colegio declarado | Sí | Del catálogo de 82 centros |
| Carrera y universidad | Sí | Dos campos separados |
| Asignaturas y niveles | Sí | Del catálogo |
| Modalidad y zona | Sí | La zona solo si es presencial |
| Puntos fuertes al enseñar | Sí | Máximo 300 caracteres |
| Certificados de idiomas | Sí | Idioma y nivel, del catálogo. Declarados, sin justificante |
| Disponibilidad | Sí | Rejilla de 7 días × 3 franjas |
| Estado y activo o no | — | Interno |
| Consentimiento de publicación | — | Con fecha y versión del texto aceptado |

**No se guarda:** teléfono, foto, nota de EVAU ni de bachillerato, ficheros de
ningún tipo ni justificantes de nada.

La nota de EVAU se descarta a conciencia. Es el dato que más pesa para una familia
y también el más delicado: rendimiento académico personal, publicado y comparable
entre personas. La carrera y la universidad transmiten casi lo mismo sin ese
problema.

### Contacto de una familia

Lo que la familia escribió, la ficha a la que iba dirigido y la fecha. **Se borra
a los 90 días**, porque su única función es poder reenviarlo si el correo falla.

### De un menor

Nada. Ni nombre, ni edad, ni colegio, ni ningún otro dato.

---

## 5. Los flujos

### 5.1 Alta de un profesor

```
Rellena el formulario  →  recibe un correo de confirmación
        ↓
Lucía recibe un aviso  →  revisa la ficha  →  aprueba o rechaza
        ↓                                         ↓
Se publica y él recibe el enlace a su ficha    Recibe el motivo y puede corregir
```

La ficha no se publica hasta que alguien la ha leído. Es la única barrera que
impide que cualquiera aparezca en el directorio declarando un colegio que no es el
suyo, y por eso se mantiene aunque cueste dos minutos.

### 5.2 Una familia contacta

```
Ve una ficha  →  rellena el formulario  →  al profesor le llega un correo
                                                      ↓
                          responde por su cuenta, fuera de la plataforma
```

La plataforma no ve esa conversación, no la guarda y no interviene después. Al
profesor le llega el contacto **de la familia**, elegido por ella. A la familia no
se le da ningún dato del profesor.

### 5.3 El repaso trimestral

Es lo que hace que el directorio no se pudra sin nadie encima.

```
Cada 3 meses  →  correo: «¿sigues aceptando alumnos?»  →  Sí, igual  →  se queda como está
                              │                          →  Sí, pero cambia mi horario  →  a su ficha
                              ↓
              sin respuesta en 14 días  →  la ficha se oculta sola
```

Ocultar no es borrar: el profesor vuelve al directorio en cuanto entra y activa su
interruptor.

**Este correo pregunta dos cosas, no una**, y la segunda es la que justifica que
exista la rejilla de horarios. El horario es el dato que más deprisa caduca: el de
un universitario cambia cada cuatrimestre, y por eso el informe de migración
decidió no traerlo del Excel antiguo. Recogerlo solo tiene sentido si se refresca,
y este correo es el mecanismo que lo refresca.

Las tres respuestas se dan con un clic desde el propio correo, sin entrar en ningún
sitio, salvo la de cambiar el horario, que lleva a su ficha con la rejilla abierta.

Se ejecuta como una tarea programada, alineada con el curso: septiembre, enero y
después de Semana Santa. Sin él, en enero habría fichas de gente que ya terminó la
carrera, horarios del cuatrimestre pasado, familias escribiendo al vacío y quejas
llegando a Lucía.

---

## 6. Los correos

Cuatro, y ninguno más.

| Cuándo | A quién | Qué dice |
|---|---|---|
| Ficha enviada | Profesor | «La hemos recibido, te avisamos al publicarla» |
| Ficha aprobada o rechazada | Profesor | El enlace a su ficha, o el motivo del rechazo |
| Una familia le escribe | Profesor | El contenido del formulario, tal cual |
| Repaso trimestral | Profesor | «¿Sigues disponible? Sí / No» |

Todos llevan enlace de baja. El de contacto lleva el correo de la familia en
*responder a*, para que el profesor conteste desde su propio gestor sin pensar.

---

## 7. Reglas que no se negocian

**Ninguna ficha se publica sin aprobación.**

**Ningún dato de contacto se muestra en la web**, ni el del profesor ni el de la
familia.

**Ningún dato de un menor entra en el sistema.**

**Ninguna palabra del producto promete lo que no se hace.** Quedan prohibidas en la
web, en los correos y en la publicidad: *verificado*, *comprobado*, *garantizado*,
*seguro*, *de confianza*, *avalado*, *certificado*. El registro correcto es el del
propio documento de marca: «Encuentra profesor para tu hijo. Sabiendo de dónde
viene.»

**Darse de baja borra de verdad**, sin recuperación.

---

## 8. Cómo se construye

Se reutiliza lo que ya está hecho y validado, y se deja fuera lo que no hace falta
todavía.

| Pieza | Estado |
|---|---|
| `01_extensiones_y_tipos.sql` | Se usa tal cual |
| `02_catalogos.sql` | Se usa tal cual: colegios, asignaturas, niveles, zonas y certificaciones |
| `01_colegios.sql`, `02_niveles_y_asignaturas.sql` | Se usan tal cual, ya están poblados |
| `04_profesores.sql` | Se usa recortado: fuera `nota_evau`, `nota_bachillerato`, `notas_publicas` y `avatar_url` |
| `profesor_certificaciones` | Se usa **sin** `documento_url` ni `verificada`: el certificado es declarado |
| `profesor_disponibilidad` | Se usa tal cual. Las tres franjas se guardan como horas: mañana 9:00-14:00, tarde 16:00-20:00, noche 20:00-22:00 |
| Tabla nueva `contactos` | Lo que envía una familia, con borrado a los 90 días |
| `05` a `12` | No se aplican en esta versión |

Guardar las franjas como rangos de hora reales, en vez de inventar un tipo nuevo,
permite que el día que alguien quiera afinar el horario a las 17:30 no haya que
migrar nada: la tabla ya lo admite.

**Pila:** la del proyecto menos lo que sobra. Next.js y Tailwind en Vercel,
PostgreSQL en Supabase, y Resend para los correos. Sin Stripe y sin WATI. Todo en
plan gratuito; el único gasto es el dominio.

---

## 9. Fuera de alcance, y cuándo vuelve

| Qué | Cuándo |
|---|---|
| Cobro por contacto | Cuando Lucía esté dada de alta como autónoma. Ventana natural: enero |
| Cuentas de familia y alta de alumnos | Con el cobro, porque entonces sí hay que identificar a quien paga |
| Reseñas | Después del cobro: hace falta constancia de que el contacto ocurrió |
| Migración del histórico | Puede no volver nunca. Si los profesores se registran solos, sobra |
| WhatsApp | Solo si el correo demuestra no ser suficiente |
| Contador de clases por profesor | Cuando haya perfiles migrados a los que atribuírselo |

---

## 10. Cómo se sabe que ha salido bien

No hay indicadores de negocio porque no hay negocio. Hay tres preguntas:

1. **¿Se han registrado profesores sin que Lucía se lo pida uno a uno?**
2. **¿Ha recibido algún profesor un contacto de una familia que no le conocía?**
3. **¿Ha pasado un mes entero sin que Lucía tenga que tocar nada más que aprobar
   fichas?**

La tercera es la que de verdad importa.
