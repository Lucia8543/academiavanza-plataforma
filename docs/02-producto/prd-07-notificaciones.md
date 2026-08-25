# PRD 07 — Notificaciones

**Prioridad:** Imprescindible (v1)

---

## 1. Propósito

Las notificaciones son lo que sustituye a Lucía escribiendo por WhatsApp. Si
fallan, el flujo se para: un profesor que no se entera de una propuesta es una
propuesta que caduca y un ingreso que no se produce.

---

## 2. Canales

| Canal | Para qué | Proveedor |
|---|---|---|
| **WhatsApp** | Lo que exige acción inmediata | WATI |
| **Email** | Confirmaciones, resúmenes, lo que se consulta después | Resend |
| **En la aplicación** | Avisos al entrar al panel | Propio |

**Por qué WhatsApp importa tanto aquí.** Es donde ya ocurre la conversación entre
familias y profesores en España, y donde un mensaje se lee en minutos en vez de en
horas. Los avisos que dependen de una respuesta en plazo van por ahí.

Los mensajes críticos se envían por WhatsApp **y** email. Redundancia deliberada.

### Plantillas de WhatsApp

Meta exige aprobar previamente las plantillas para poder escribir fuera de una
ventana de conversación abierta. Hay que darlas de alta con antelación en WATI:
son varios días de trámite y bloquean el lanzamiento si se dejan para el final.

---

## 3. Catálogo de notificaciones

### Al profesor

| Suceso | Canales | Cuándo |
|---|---|---|
| Perfil aprobado | Email + WhatsApp | Inmediato |
| Perfil rechazado o con correcciones | Email | Inmediato |
| Colegio verificado | Email | Inmediato |
| **Nueva propuesta** | **WhatsApp + Email** | Inmediato |
| Recordatorio de propuesta | WhatsApp | A 24 h y a 6 h del vencimiento |
| Propuesta caducada | Email | Al caducar |
| **Match confirmado y pagado** | **WhatsApp + Email** | Inmediato |
| Nueva reseña | Email | Al publicarse |
| Aviso de valoración baja | Email | Al bajar de 3,5 |

### A la familia

| Suceso | Canales | Cuándo |
|---|---|---|
| Bienvenida | Email | Al registrarse |
| Propuesta enviada | Email | Inmediato |
| **El profesor ha aceptado** | **WhatsApp + Email** | Inmediato |
| Recordatorio de pago | WhatsApp | A 24 h del vencimiento |
| Propuesta rechazada | Email | Inmediato, con alternativas |
| Propuesta caducada | Email | Al caducar, con alternativas |
| **Contacto desbloqueado** | **Email** | Tras el pago |
| Justificante de pago | Email | Tras el pago |
| Petición de reseña | Email | A los 7 días del match |
| Plazo de pago vencido | Email | Al caducar |

### A administración

| Suceso | Canales | Cuándo |
|---|---|---|
| Profesor pendiente de aprobar | Email | Diario, agrupado |
| Pendiente hace más de 48 h | Email | Diario |
| Reseñas por moderar | Email | Diario, agrupado |
| Fallos de webhook | Email | Inmediato |
| Informe mensual | Email | Día 1 de cada mes |

**Agrupación.** Los avisos a administración se agrupan en un correo diario. Un
correo por cada profesor que se registra sería ruido, y el ruido se acaba
ignorando.

---

## 4. Tono

El tono lo define el [sistema de diseño](../03-diseno/sistema-diseno.md). En
resumen: cercano, directo, como escribiría una persona. Nada de «estimado usuario»
ni «su solicitud ha sido registrada en nuestro sistema».

**Ejemplo — nueva propuesta, por WhatsApp:**

> Hola [nombre] 👋 Tienes una nueva propuesta de clases.
>
> [Alumno], de [curso], busca clases de [asignaturas] en modalidad [modalidad].
>
> Puedes aceptarla o rechazarla aquí: [enlace]
> Tienes [horas] horas para responder.

**Ejemplo — el profesor ha aceptado, por WhatsApp:**

> ¡Buenas noticias, [nombre]! 🎉
>
> [Profesor] está disponible para dar clase a [alumno].
>
> Desbloquea su teléfono aquí y ya podéis organizaros directamente: [enlace]

---

## 5. Plantillas editables

Todas las plantillas viven en `app.plantillas_notificacion` y se editan desde el
panel, con vista previa y lista de variables disponibles.

Las de WhatsApp guardan además el identificador de la plantilla aprobada por Meta.
**Cambiar su texto exige volver a aprobarla**, cosa que la interfaz debe advertir
de forma clara.

---

## 6. Fiabilidad

**Registro completo.** Todo envío queda en `app.notificaciones` con su estado.

**Reintentos.** Hasta tres, con espera creciente. Si el WhatsApp falla las tres
veces, se envía por email como respaldo.

**Idempotencia.** Los procesos programados comprueban si ya se envió el aviso antes
de volver a enviarlo. Un doble recordatorio es molesto y resta credibilidad.

**Interruptor general.** El parámetro `notificaciones_whatsapp_activas` permite
cortar los envíos de WhatsApp sin desplegar si el proveedor falla.

**En desarrollo.** Con `WHATSAPP_ACTIVO=false`, los mensajes se registran pero no
se envían. Evita gastar créditos y molestar a personas reales durante las pruebas.

---

## 7. Preferencias y cumplimiento

Los avisos transaccionales —los que forman parte del servicio contratado— no son
desactivables. Las comunicaciones comerciales sí, y exigen consentimiento previo
separado.

Todo correo comercial lleva enlace de baja en un clic.

---

## 8. Criterios de aceptación

- [ ] Una propuesta nueva llega al profesor en menos de un minuto por ambos canales
- [ ] La aceptación llega a la familia en menos de un minuto por ambos canales
- [ ] Los recordatorios se envían una sola vez por hito
- [ ] Un fallo de WhatsApp cae a email automáticamente
- [ ] Las plantillas se editan desde el panel sin desplegar
- [ ] Los avisos a administración se agrupan a diario
- [ ] Con `WHATSAPP_ACTIVO=false` no sale ningún mensaje real
- [ ] El interruptor general corta los envíos sin desplegar
- [ ] Todo envío queda registrado con su estado
