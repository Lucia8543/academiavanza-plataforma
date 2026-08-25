# PRD 04 — Flujo de propuesta y match

**Prioridad:** Imprescindible (v1) · **Este es el núcleo del producto**
**Depende de:** PRD 01, PRD 02, PRD 03, PRD 05

---

## 1. Propósito

Este documento describe el mecanismo por el que una familia y un profesor entran
en contacto, y el único punto en el que la plataforma ingresa dinero.

El principio que lo gobierna: **la familia solo paga cuando hay un profesor
confirmado al otro lado.**

---

## 2. El flujo

```
   ①  La familia envía una propuesta ......................... GRATIS
                    │
                    ▼
   ②  El profesor recibe aviso por email y WhatsApp
                    │
        ┌───────────┼───────────────┐
     acepta      rechaza      no responde en plazo
        │           │                │
        ▼           ▼                ▼
   ③ la familia   fin, sin coste   caduca, sin coste
     recibe aviso
        │
        ▼
   ④  La familia paga la tarifa ......................... COBRO ÚNICO
        │
        ▼
   ⑤  Se revela el teléfono del profesor
        │
        ▼
   ⑥  Contacto directo. La plataforma sale de escena.
        │
        ▼
   ⑦  Tras la primera clase, se pide reseña a la familia
```

---

## 3. Estados

| Estado | Qué significa | Siguiente paso |
|---|---|---|
| `enviada` | Esperando respuesta del profesor | Acepta, rechaza o caduca |
| `aceptada` | Disponible. Pendiente de pago. | Paga o caduca el plazo de pago |
| `rechazada` | El profesor no puede | Terminal |
| `caducada` | Sin respuesta en plazo | Terminal |
| `pagada` | **Match completado.** Teléfono revelado. | Terminal |
| `caducada_pago` | Aceptada pero sin pagar a tiempo | Terminal |
| `cancelada` | Retirada por la familia | Terminal |

La restricción que impide revelar el teléfono sin pago está escrita en la propia
base de datos (`prop_contacto_solo_si_pagada`), no solo en el código.

---

## 4. Paso a paso

### 4.1 Envío de la propuesta

**Requisitos:** cuenta de familia, al menos un alumno registrado, y que el profesor
esté activo y con plazas.

**Qué rellena la familia:** alumno al que va dirigida, asignaturas concretas,
modalidad y un mensaje libre opcional pero recomendado.

Antes de enviar se muestra un resumen con el mensaje clave: *«Enviar esta
propuesta es gratis. Solo pagarás si [nombre] confirma que está disponible.»*

**Límites.** Una familia puede tener tres propuestas vivas a la vez (configurable),
y no puede tener dos propuestas vivas con el mismo profesor para el mismo alumno
—garantizado por índice único en base de datos, lo que evita duplicados por doble
clic—. El profesor tiene su propio límite de cinco propuestas vivas.

**Qué se congela.** La propuesta guarda una instantánea de lo solicitado. Si la
familia cambia luego sus necesidades, la propuesta conserva su contexto original.

### 4.2 Respuesta del profesor

Se le notifica de inmediato por email y WhatsApp. El aviso incluye nombre del
alumno, nivel, asignaturas, modalidad, zona si aplica, el mensaje de la familia y
el plazo restante.

**Nunca incluye** el teléfono ni el email de la familia. El profesor tampoco
obtiene datos de contacto hasta que hay pago.

**Plazo:** 48 horas configurable. Se envía recordatorio a las 24 h y a las 6 h
restantes.

Al aceptar, puede añadir un mensaje que la familia verá. Al rechazar, **el motivo
es obligatorio** —sin plazas, no doy esa asignatura, no me encaja el horario, zona
demasiado lejos, otro— porque alimenta las métricas de calidad del emparejamiento.

### 4.3 Aviso de aceptación y pago

La familia recibe email y WhatsApp: *«[Nombre] está disponible para dar clase a
[alumno]. Desbloquea su teléfono para poneros de acuerdo.»*

En la plataforma ve el perfil completo, el mensaje del profesor, el importe y el
plazo para pagar. Ver [PRD 05](prd-05-tarifas-y-pagos.md).

**Plazo de pago:** 72 horas configurable. Vencido, la propuesta pasa a
`caducada_pago` y se libera el hueco del profesor. La familia puede volver a
enviar propuesta al mismo profesor: se trata como una propuesta nueva.

### 4.4 Revelado del contacto

Confirmado el pago por el webhook de Stripe, el sistema pasa la propuesta a
`pagada`, registra el instante del revelado y notifica a ambas partes.

La familia ve el teléfono con un enlace directo a WhatsApp con mensaje
prerrellenado. El profesor recibe el teléfono de la familia, y solo en este
momento.

Ambos reciben además las indicaciones sobre cómo se acuerda el pago de las clases,
que es cosa suya: importe, forma y calendario los fijan entre ellos.

### 4.5 Después del match

La plataforma no interviene más, salvo para pedir la reseña. A los siete días del
match se envía a la familia la invitación a valorar. Ver
[PRD 08](prd-08-resenas.md).

---

## 5. Procesos programados

| Proceso | Frecuencia | Qué hace |
|---|---|---|
| Recordatorio al profesor | Cada hora | Avisa a 24 h y a 6 h del vencimiento |
| Caducar propuestas | Cada hora | `enviada` vencida → `caducada`, avisa a la familia |
| Recordatorio de pago | Cada hora | Avisa a 24 h del vencimiento del plazo de pago |
| Caducar pagos | Cada hora | `aceptada` vencida → `caducada_pago` |
| Solicitud de reseña | Diario | A los 7 días del match |

Todos son idempotentes: ejecutarlos dos veces no duplica avisos.

---

## 6. Casos límite

| Situación | Qué ocurre |
|---|---|
| El profesor pausa su perfil con propuestas vivas | Siguen su curso. Solo deja de recibir nuevas. |
| El profesor se da de baja con propuestas vivas | Se cancelan y se avisa a las familias. Si alguna estaba pagada, se reembolsa. |
| La familia cancela una propuesta enviada | Permitido mientras esté en `enviada`. Se avisa al profesor. |
| La familia cancela una ya aceptada | No se permite cancelar; se permite no pagar y dejar que caduque. |
| El pago falla | La propuesta sigue en `aceptada` y puede reintentar mientras quede plazo. |
| El profesor acepta justo al vencer el plazo | Vale la marca de tiempo de la base de datos, no la del cliente. |
| Familia y profesor son la misma persona | Se impide por coincidencia de email o teléfono. |

---

## 7. Métricas

Las de este flujo son las que dicen si el negocio funciona:

- **Tasa de aceptación** = aceptadas / enviadas. Si baja, el directorio muestra
  profesores que en realidad no están disponibles.
- **Tasa de pago tras aceptación** = pagadas / aceptadas. Si baja, el precio es
  demasiado alto o el valor no se está comunicando bien.
- **Conversión total** = pagadas / enviadas.
- **Tiempo hasta respuesta** y **tiempo hasta pago**.
- **Motivos de rechazo**, agregados: dicen qué falla en la búsqueda.

Consultables en `app.gestion_embudo` y `app.gestion_rendimiento_profesores`.

---

## 8. Criterios de aceptación

- [ ] Enviar una propuesta no cobra nada en ningún caso
- [ ] El teléfono no se revela sin pago confirmado, ni siquiera manipulando la API
- [ ] El profesor no ve datos de contacto de la familia antes del pago
- [ ] Rechazar exige motivo
- [ ] Las propuestas caducan solas y avisan a la familia
- [ ] No se pueden crear dos propuestas vivas con el mismo profesor y alumno
- [ ] Se respetan los límites de propuestas vivas de familia y profesor
- [ ] Cada cambio de estado queda registrado en `propuesta_eventos`
- [ ] Los procesos programados son idempotentes
- [ ] Si el profesor se da de baja con un match pagado, se reembolsa
