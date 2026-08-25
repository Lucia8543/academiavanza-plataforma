# PRD 05 — Tarifas y pagos

**Prioridad:** Imprescindible (v1)
**Depende de:** PRD 04

---

## 1. Alcance

La plataforma cobra **una única cosa**: la tarifa que paga la familia para
desbloquear el contacto de un profesor que ya ha confirmado su disponibilidad.

**Fuera de alcance, y no por falta de tiempo:** los pagos por las clases. Los
acuerdan y liquidan familia y profesor directamente, por Bizum o transferencia. La
plataforma no los intermedia, no los registra y no los conoce. Ver
[ADR 0001](../adr/0001-cobrar-solo-el-match.md).

No existen tablas de bonos, saldos, liquidaciones ni clases impartidas.

---

## 2. El precio

### 2.1 Cuánto

**Sin decidir.** El análisis de referencias está en
[análisis competitivo](../01-negocio/analisis-competitivo.md), apartado 4.3.

Resumen: Superprof cobra 29 €/mes y TusClasesParticulares 14 €/mes por acceso a
contactos sin verificar ni confirmar. La tarifa de AcademiAvanza compra algo
distinto —un contacto verificado y confirmado— y el rango razonable va de 9,99 € a
19,99 €, con 14,99 € como punto de partida.

La tabla de tarifas se inicializa con 14,99 €, valor provisional.

### 2.2 Configurable sin desplegar

**Requisito explícito:** Lucía debe poder cambiar el precio cuando quiera, desde el
panel, sin tocar código ni pedírselo a nadie.

La implementación no sobrescribe un valor: cada precio se guarda con su periodo de
vigencia en `app.tarifas`. Esto resuelve cuatro cosas a la vez.

**El histórico se conserva.** Un cobro de hace tres meses sigue mostrando lo que se
cobró entonces. Es requisito contable, no una preferencia.

**Se pueden programar cambios.** Fijar una subida para el 1 de septiembre sin estar
pendiente ese día.

**Queda traza.** Quién cambió el precio, cuándo y con qué motivo.

**Se puede medir.** Cruzar el histórico de precios con la conversión responde a la
pregunta de si subir el precio compensa.

Un índice único parcial garantiza que solo haya una tarifa vigente a la vez.

### 2.3 Congelación del importe

Al cobrar, la propuesta guarda `tarifa_aplicada` como instantánea. Ese valor no se
recalcula nunca. Cambiar el precio no altera ni un solo cobro anterior.

---

## 3. Cobro

### 3.1 Flujo

```
Familia pulsa «Desbloquear contacto»
        │
        ▼
Se consulta la tarifa vigente  ──▶ app.fn_tarifa_vigente('match')
        │
        ▼
Se crea la sesión de Stripe Checkout
        │
        ▼
La familia paga en el entorno de Stripe
        │
        ▼
Stripe envía el webhook  ──▶  /api/stripe/webhook
        │
        ▼
Se verifica la firma. Se comprueba idempotencia.
        │
        ▼
Propuesta → 'pagada'. Se revela el teléfono. Se notifica a ambos.
```

El estado de la propuesta se cambia **desde el webhook**, nunca desde la vuelta del
navegador. La página de retorno es solo cosmética: el usuario puede cerrar el
navegador antes de que cargue y el pago debe surtir efecto igualmente.

### 3.2 Métodos de pago

Tarjeta y **Bizum**, que Stripe soporta de forma nativa en España y es el método
que estas familias ya usan. Merece la pena activarlo desde el principio.

### 3.3 Idempotencia

Stripe reenvía eventos si no recibe respuesta a tiempo. Sin control, un reenvío
revelaría el contacto dos veces y duplicaría el apunte contable.

Cada evento se registra en `app.stripe_eventos` por su identificador antes de
procesarse. Si ya está, se responde 200 y no se hace nada más.

---

## 4. Reembolsos

| Situación | Reembolso | Quién |
|---|---|---|
| El profesor se da de baja tras cobrar | Total, automático | Sistema |
| El teléfono revelado es incorrecto | Total | Administración |
| El profesor no responde tras el match | Total, si se reclama en 7 días | Administración |
| La familia se arrepiente | No | — |
| No se llegan a dar clases | No | — |

El criterio: se reembolsa cuando la plataforma no entregó lo que vendió (un
contacto válido de un profesor disponible), no cuando la relación posterior no
prospera, que queda fuera de su control.

Los reembolsos se ejecutan contra la API de Stripe y se reflejan en `app.pagos`.

---

## 5. Facturación

La entidad emisora es la de la actividad económica dada de alta —previsiblemente
la de su padre, según se decida—.

Stripe Tax calcula el IVA y genera el recibo. Cada pago guarda el número y el
enlace del justificante.

> **Pendiente de resolver antes de cobrar en producción:** confirmar la entidad
> emisora, el régimen de IVA aplicable y los datos fiscales que deben figurar.
> No es una decisión técnica.

---

## 6. Panel de administración

Ver [PRD 06](prd-06-panel-administracion.md). En lo relativo a dinero:

- Tarifa vigente y formulario de cambio, con motivo obligatorio
- Histórico de tarifas
- Ingresos del mes y acumulados
- Listado de pagos con su estado
- Reembolso manual desde la ficha de un pago
- Aviso si un webhook falla más de tres veces

**Al cambiar el precio desde el panel**, el sistema crea también el objeto `Price`
correspondiente en Stripe y guarda su identificador. Hacerlo por SQL directo no
crea nada en Stripe: por eso se recomienda el panel para esta operación.

---

## 7. Seguridad

- Ningún dato de tarjeta pasa por la plataforma; lo gestiona Stripe íntegramente
- La firma de cada webhook se verifica criptográficamente
- El importe se toma siempre del servidor, nunca de lo que envíe el cliente
- El endpoint de webhook no tiene autenticación de usuario, solo firma
- Los reembolsos manuales exigen rol de administración y quedan auditados

---

## 8. Criterios de aceptación

- [ ] Cambiar el precio desde el panel no requiere desplegar
- [ ] Cambiar el precio no altera ningún cobro anterior
- [ ] Nunca hay dos tarifas vigentes a la vez
- [ ] El cambio de estado ocurre en el webhook, no en la vuelta del navegador
- [ ] Un webhook repetido no duplica ni el revelado ni el apunte contable
- [ ] Bizum aparece como método de pago
- [ ] Un pago fallido deja la propuesta reintentable mientras quede plazo
- [ ] La baja de un profesor con match pagado dispara reembolso automático
- [ ] El importe cobrado siempre lo fija el servidor
