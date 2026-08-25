# Visión y alcance del producto

---

## 1. En una frase

**AcademiAvanza es un directorio verificado de profesores particulares donde las
familias saben de qué colegio viene cada profesor, y donde el contacto solo se
paga cuando el profesor ha confirmado que está disponible.**

---

## 2. El problema

Una familia que busca profesor particular para su hijo se enfrenta a dos opciones,
ambas malas.

La primera es un marketplace abierto tipo Superprof: doscientos perfiles por
asignatura, sin ninguna verificación, sin forma de saber si esa persona conoce el
temario del colegio de su hijo. La familia elige a ciegas y se fía de unas
estrellas anónimas.

La segunda es el boca a boca: fiable pero lentísimo, y limitado a la red de
contactos que uno ya tiene.

AcademiAvanza ocupa el hueco intermedio: la fiabilidad de la recomendación
personal con la comodidad de una plataforma.

---

## 3. Qué hace la plataforma

**Verifica el origen académico de cada profesor.** Cada perfil lleva el badge del
colegio del que procede, comprobado por administración. Las familias pueden
filtrar por colegio y ver únicamente profesores que estudiaron donde estudia su
hijo, o donde ellas consideren.

**Media el primer contacto.** La familia no obtiene un teléfono al azar: envía una
propuesta, el profesor confirma si puede, y solo entonces se produce el
intercambio.

**Cobra una única vez, y solo si hay acuerdo.** La propuesta es gratuita. Si el
profesor rechaza o no responde, la familia no paga nada.

---

## 4. Qué NO hace, y es deliberado

Esto es tan importante como lo anterior, porque define el alcance.

**No gestiona los pagos de las clases.** No hay bonos, ni saldos, ni
liquidaciones, ni transferencias a profesores. El dinero de las clases se acuerda
y se mueve directamente entre familia y profesor, por Bizum o transferencia. La
plataforma no lo conoce.

**No gestiona horarios ni asistencia.** No hay calendario de clases, ni
confirmación de sesiones, ni control de faltas.

**No tiene mensajería interna.** Una vez revelado el teléfono, las partes hablan
por WhatsApp como harían de todos modos.

**No asigna profesores automáticamente.** La familia elige. La plataforma ordena y
filtra, pero no decide por ella.

El motivo de fondo es el mismo en los cuatro casos: cada una de estas funciones
exigiría intervención humana continua, que es exactamente lo que el rediseño
elimina. Ver [ADR 0001](../adr/0001-cobrar-solo-el-match.md).

---

## 5. Usuarios

| Rol | Quién es | Qué hace en la plataforma |
|---|---|---|
| **Familia** | Padre o madre buscando refuerzo para un hijo | Busca, filtra, envía propuestas, paga el match, reseña |
| **Profesor** | Estudiante universitario, normalmente exalumno de un colegio del entorno | Publica su perfil, recibe propuestas, acepta o rechaza |
| **Administración** | Lucía | Aprueba perfiles, verifica colegios, ajusta el precio, supervisa |

---

## 6. El flujo, de principio a fin

```
FAMILIA                    PLATAFORMA                    PROFESOR
   │                            │                            │
   │  busca y filtra            │                            │
   │  (colegio, asignatura…)    │                            │
   ├───────────────────────────▶│                            │
   │                            │                            │
   │  envía propuesta  GRATIS   │                            │
   ├───────────────────────────▶│   notifica (email + WA)    │
   │                            ├───────────────────────────▶│
   │                            │                            │
   │                            │      acepta / rechaza      │
   │                            │◀───────────────────────────┤
   │      si ACEPTA:            │                            │
   │◀───────────────────────────┤                            │
   │  «está disponible»         │                            │
   │                            │                            │
   │  paga la tarifa  ─── COBRO ÚNICO ───▶                   │
   ├───────────────────────────▶│                            │
   │                            │                            │
   │  ◀── teléfono revelado ────┤                            │
   │                            │                            │
   │═══════════ a partir de aquí, por su cuenta ═════════════│
   │         WhatsApp · horarios · pagos de clases           │
   │                            │                            │
   │  reseña tras la 1ª clase   │                            │
   ├───────────────────────────▶│                            │
```

Si el profesor **rechaza** o **no responde en plazo**, la familia no paga nada y
puede probar con otro.

---

## 7. Principios de producto

**Cero intervención diaria.** El sistema debe poder funcionar semanas sin que
nadie lo toque. Cualquier flujo que exija la presencia de Lucía es un defecto de
diseño, no una funcionalidad.

**Primero el móvil.** Familias y profesores usan el teléfono. Lo que no funcione
bien en pantalla pequeña, no funciona.

**La confianza es el producto.** El badge del colegio, la verificación y las
reseñas no son adornos: son la razón por la que alguien paga. Si se degradan, no
queda producto.

**Se paga por resultado.** La familia solo paga cuando hay un profesor confirmado
al otro lado. Es lo que hace defendible el cobro.

**Simplicidad radical.** De la portada al perfil de un profesor no debe haber más
de dos clics. El registro no debe pasar de cinco minutos.

---

## 8. Indicadores de éxito

| Indicador | 6 meses | 12 meses |
|---|---|---|
| Profesores activos en el directorio | 25 | 60 |
| Matches completados (acumulado) | 40 | 120 |
| Propuestas aceptadas por profesores | > 60 % | > 70 % |
| Pago tras aceptación del profesor | > 70 % | > 80 % |
| Tiempo medio de respuesta del profesor | < 24 h | < 12 h |
| Perfiles migrados reclamados | > 40 % | > 60 % |
| Intervenciones manuales al mes | < 8 | < 4 |

El último es el que de verdad importa: mide si el rediseño ha cumplido su
propósito.

---

## 9. Alcance por versiones

### Versión 1 — lo imprescindible

Directorio con filtros, perfiles de profesor con badge verificado, registro de
familias y profesores, flujo completo de propuesta y match, cobro con Stripe,
precio configurable, panel de administración, notificaciones por email y WhatsApp,
reseñas, y reclamación de perfiles migrados.

### Versión 2 — cuando la versión 1 esté rodada

Suscripción para familias con búsquedas frecuentes, sistema de recomendación entre
familias, aplicación instalable en el móvil, blog para posicionamiento, y
estadísticas avanzadas.

### Fuera de alcance, indefinidamente

Gestión de pagos de clases, calendario, aula virtual, mensajería interna,
seguimiento académico del alumno.

---

## 10. Documentos de requisitos

| Documento | Cubre |
|---|---|
| [PRD 01 — Directorio y búsqueda](prd-01-directorio-y-busqueda.md) | Listado, filtros, ordenación |
| [PRD 02 — Perfiles de profesor](prd-02-perfiles-profesor.md) | Registro, perfil público, aprobación |
| [PRD 03 — Portal de la familia](prd-03-portal-familia.md) | Registro, panel, alumnos |
| [PRD 04 — Flujo de propuesta y match](prd-04-flujo-match.md) | El núcleo del producto |
| [PRD 05 — Tarifas y pagos](prd-05-tarifas-y-pagos.md) | Stripe, precio configurable |
| [PRD 06 — Panel de administración](prd-06-panel-administracion.md) | Gestión y supervisión |
| [PRD 07 — Notificaciones](prd-07-notificaciones.md) | Email y WhatsApp |
| [PRD 08 — Reseñas](prd-08-resenas.md) | Valoraciones verificadas |
| [PRD 09 — Alta de perfiles migrados](prd-09-onboarding-migrados.md) | Reclamación y validación |
