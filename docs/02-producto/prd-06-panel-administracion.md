# PRD 06 — Panel de administración

**Prioridad:** Imprescindible (v1)
**Usuario:** Lucía

---

## 1. Propósito

El panel está pensado para **revisión ocasional, no supervisión diaria**. La
premisa es que Lucía va a estar de Erasmus y entrará una o dos veces por semana,
posiblemente desde el móvil.

De ahí dos consecuencias de diseño. Primera: el inicio debe responder en treinta
segundos a «¿hay algo que requiera mi atención?». Segunda: lo que no requiera
atención no debe aparecer.

---

## 2. Inicio

### 2.1 Avisos

Lo primero, y solo si hay algo. Si no hay nada pendiente, el panel debe decirlo
con claridad: *«Todo en orden. No hay nada pendiente.»* Es información valiosa.

| Aviso | Cuándo salta |
|---|---|
| Profesores esperando aprobación | Siempre que haya alguno |
| Esperando más de 48 h | Se ha incumplido el compromiso de plazo |
| Reseñas por moderar | Siempre que haya alguna |
| Profesor por debajo de 3,0 estrellas | Con más de tres reseñas |
| Profesor con tres rechazos seguidos | Puede que ya no quiera dar clase |
| Webhooks de Stripe fallando | Más de tres intentos |
| Notificaciones sin enviar | Acumulación de fallos |
| Propuestas caducando sin respuesta | Tendencia al alza |

### 2.2 Situación

Profesores activos, propuestas vivas, matches del mes, ingresos del mes y tarifa
vigente. Apoyado en la vista `app.gestion_resumen`.

### 2.3 Embudo

Enviadas → aceptadas → pagadas, con los porcentajes entre pasos. Es la pantalla
que dice si el precio está bien puesto: una tasa baja de pago tras aceptación
apunta al precio, no al emparejamiento.

---

## 3. Profesores

**Cola de aprobación.** Lo más usado del panel. Por cada candidato: todos los datos
del formulario, el colegio declarado, y las acciones de aprobar, aprobar
verificando el colegio, pedir correcciones o rechazar con motivo.

La verificación del colegio es una acción explícita y separada de la aprobación,
porque son dos juicios distintos: uno sobre si el perfil es publicable, otro sobre
si la procedencia está comprobada. Solo la segunda activa el badge.

**Listado completo.** Con filtros por estado, colegio y valoración. Acciones:
suspender, reactivar, editar, ver como lo ve una familia.

**Rendimiento.** Apoyado en `app.gestion_rendimiento_profesores`: propuestas
recibidas, aceptadas, rechazadas, sin responder, tasa de aceptación y tiempo medio
de respuesta.

---

## 4. Familias y propuestas

**Familias.** Listado con propuestas enviadas y matches completados. Acceso a la
ficha para dar soporte.

**Propuestas.** Listado filtrable por estado, con la ficha completa de cada una y
su historial de transiciones. Acciones excepcionales: forzar caducidad, ampliar
plazo, cancelar con reembolso.

Estas acciones existen porque siempre hay casos raros, pero deben ser poco visibles
y quedar auditadas.

---

## 5. Dinero

- Tarifa vigente y formulario de cambio con **motivo obligatorio**
- Histórico de tarifas con quién y cuándo
- Ingresos del mes y acumulados, apoyado en `app.gestion_ingresos_mensuales`
- Listado de pagos con estado y enlace a Stripe
- Reembolso manual desde la ficha del pago

El cambio de tarifa desde aquí crea también el `Price` correspondiente en Stripe.
Es el motivo por el que esta operación debe hacerse en el panel y no por SQL.

---

## 6. Catálogos

Colegios (incluida la subida del logo), asignaturas, niveles, zonas y
certificaciones. Se pueden desactivar pero no borrar, para no romper referencias
existentes.

---

## 7. Configuración

Los parámetros de `app.configuracion`, editables con su descripción a la vista:

| Parámetro | Por defecto |
|---|---|
| Horas para que el profesor responda | 48 |
| Horas para que la familia pague | 72 |
| Máximo de propuestas vivas por profesor | 5 |
| Máximo de propuestas vivas por familia | 3 |
| Moderación previa de reseñas | Activada |
| Orden por defecto del directorio | Recomendados |
| Envío de WhatsApp activo | Activado |

El último es un interruptor de emergencia: permite cortar los envíos de WhatsApp
sin desplegar nada si algo va mal con el proveedor.

---

## 8. Contenidos

Textos de la portada, preguntas frecuentes, reseñas destacadas, y plantillas de
notificación con vista previa y variables disponibles.

---

## 9. Informe mensual automático

El día 1 de cada mes, un correo con lo ocurrido: nuevos profesores y familias,
propuestas y matches, ingresos, conversión, valoración media, y lo que quedó
pendiente de atención.

Su función es que Lucía no tenga que acordarse de entrar: si todo va bien, el
correo se lo confirma sin más.

---

## 10. Acceso directo a la base de datos

El panel cubre la operativa habitual, pero no todo. Para consultas no previstas y
correcciones puntuales, Lucía dispone de acceso SQL directo con usuario propio.

Ver [guía de acceso a base de datos](../04-tecnico/acceso-base-datos.md).

---

## 11. Seguridad

- Rol `admin` verificado en servidor, no solo en la interfaz
- Doble factor obligatorio
- Toda acción sensible auditada, distinguiendo panel de edición manual
- Sesión de administración con caducidad más corta

---

## 12. Criterios de aceptación

- [ ] El inicio responde en 30 segundos si hay algo pendiente
- [ ] Sin nada pendiente, lo dice explícitamente
- [ ] Aprobar y verificar el colegio son acciones distintas
- [ ] Cambiar la tarifa exige motivo y crea el precio en Stripe
- [ ] Los parámetros de configuración se editan sin desplegar
- [ ] El informe mensual se envía solo
- [ ] Toda acción sensible queda auditada
- [ ] El panel es usable desde el móvil
- [ ] El doble factor es obligatorio
