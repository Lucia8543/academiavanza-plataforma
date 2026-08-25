# Modelo de ingresos y análisis de precio

---

## 1. Cómo gana dinero la plataforma

**Una sola fuente:** la tarifa que paga la familia para desbloquear el contacto de
un profesor que ya ha confirmado su disponibilidad.

Los profesores no pagan nada. Publicar su perfil es gratuito, y así debe seguir
siendo mientras el directorio sea pequeño: cada profesor que no se registra por no
pagar es una pérdida mucho mayor que la cuota que aportaría.

```
Familia envía propuesta ─────────────────▶  0 €
Profesor acepta ─────────────────────────▶  0 €
Familia desbloquea el teléfono ──────────▶  TARIFA  ← único ingreso
Clases posteriores ──────────────────────▶  0 €  (fuera de la plataforma)
```

**Nada más.** Ni comisión por clase, ni suscripción, ni intermediación de pagos.
El razonamiento completo está en [ADR 0001](../adr/0001-cobrar-solo-el-match.md).

---

## 2. Qué compra exactamente la familia

Merece la pena precisarlo, porque de ello depende cuánto se puede cobrar.

No compra un listado: eso es gratis. No compra un número de teléfono a secas: eso
lo da cualquiera. Compra **un contacto verificado y confirmado**:

- El profesor ha sido aprobado por administración
- Su colegio de procedencia está comprobado
- **Ha dicho expresamente que puede dar esas clases a ese alumno**

El tercer punto es el que sostiene el precio. En cualquier otra plataforma, la
familia paga por la posibilidad de contactar. Aquí paga por un acuerdo que ya
existe.

---

## 3. Qué cobra la competencia

| Plataforma | Qué cobra a la familia | Precio | Diferencias |
|---|---|---|---|
| **Superprof** | Pase mensual para contactar | 29 €/mes | Sin verificar, sin confirmar, suscripción |
| **TusClasesParticulares** | Pase mensual para contactar | 14 €/mes | Sin verificar, sin confirmar, suscripción |
| **Classgap** | Nada por contactar | 0 € | Cobra 12-20 % de cada clase |
| **GoStudent** | Nada por separado | 0 € | Suscripción completa de 19-25 €/clase |
| **Preply** | Nada por contactar | 0 € | Comisión del 33 % sobre cada clase |
| **Wuolah** | Comisión por contacto generado | ~5-10 € | Sin verificar, sin confirmar |

Dos grupos claros. Los que **cobran por el acceso al contacto** (Superprof,
TusClasesParticulares, Wuolah) y los que **cobran por cada clase** (Classgap,
Preply, GoStudent).

AcademiAvanza pertenece al primer grupo por decisión de alcance, pero con un
producto mejor: en los tres casos comparables, el contacto no está ni verificado ni
confirmado.

---

## 4. Cuánto se puede cobrar

El punto de referencia útil es el pase mensual de TusClasesParticulares: 14 €.

Una familia que lo paga contacta con tres, cuatro o cinco profesores hasta dar con
uno disponible y adecuado. Es decir, **paga 14 € por un proceso de ensayo y error**
que además le lleva tiempo.

En AcademiAvanza paga una vez, por un contacto que ya ha dicho que sí. Eso vale
como mínimo lo mismo.

| Opción | Precio | Cuándo tiene sentido |
|---|---|---|
| **Agresivo** | 9,99 € | Para ganar volumen en el lanzamiento. Muy por debajo del mercado. |
| **Equilibrado** | 14,99 € | Alineado con lo que el mercado ya ha educado a pagar. |
| **Premium** | 19,99 € | Cuando haya reseñas y una tasa de aceptación alta que lo respalden. |

**Recomendación para arrancar: 14,99 €.** No hay que defender un precio nuevo —el
mercado ya lo ha fijado— y el producto que se entrega es mejor.

### Cuándo moverlo

**Bajar a 9,99 €** si la tasa de pago tras aceptación baja del 60 %. Significaría
que las familias llegan hasta el final y se echan atrás en la pantalla de pago, que
es el síntoma clásico de precio alto.

**Subir a 19,99 €** si esa tasa supera el 85 % de forma sostenida y hay al menos
veinte reseñas en el directorio. Una conversión muy alta indica que se está
dejando dinero sobre la mesa.

Ambas cifras son consultables en `app.gestion_embudo`.

> **El precio es configurable desde el panel.** No es una constante en el código:
> se cambia sin desplegar y sin pedírselo a nadie. Ver
> [PRD 05](../02-producto/prd-05-tarifas-y-pagos.md).

---

## 5. Proyección

Con la tarifa a 14,99 € y el coste de operación estimado de unos 60 €/mes
([ver arquitectura](../04-tecnico/arquitectura-sistema.md)):

| Matches/mes | Ingresos | Coste | Resultado |
|---|---|---|---|
| 4 | 60 € | 60 € | Cubre gastos |
| 10 | 150 € | 60 € | 90 € |
| 20 | 300 € | 62 € | 238 € |
| 40 | 600 € | 65 € | 535 € |

**El umbral de rentabilidad son cuatro matches al mes.** Es una cifra baja y
alcanzable, lo que da margen para experimentar con el precio sin poner en riesgo la
viabilidad.

El margen crece muy rápido porque el coste es casi todo fijo: atender veinte
matches cuesta prácticamente lo mismo que atender cuatro.

---

## 6. Comparación con el modelo anterior

Conviene ser honesto sobre lo que se pierde.

En el modelo manual, Lucía cobraba una comisión por cada clase impartida. Una
relación que durase un curso entero generaba ingresos recurrentes durante meses.

En el modelo nuevo, esa misma relación genera **un único cobro de 14,99 €**.

| | Modelo anterior | Modelo nuevo |
|---|---|---|
| Ingreso por relación | Recurrente, meses | Único |
| Carga de trabajo | 2-4 h/semana | Prácticamente cero |
| Escalabilidad | Limitada por su tiempo | Sin límite práctico |
| Riesgo si no está | El negocio se para | Ninguno |

Se cambia ingreso por relación por **volumen y ausencia de trabajo**. Con veinte
matches al mes, el ingreso mensual es comparable al anterior sin dedicar horas.

Es el intercambio que hace posible el Erasmus, y hay que asumirlo conscientemente.

---

## 7. Vías futuras

**Suscripción para familias frecuentes.** Quien tiene tres hijos o cambia de
profesor a menudo podría pagar una cuota anual con matches incluidos. Requiere un
directorio con volumen suficiente para justificarla.

**Cuota de visibilidad para profesores.** Aparecer destacado en el directorio.
Delicado: puede erosionar la confianza si no se señala con claridad que es una
posición pagada. No antes de tener oferta abundante.

**Recomendación entre familias.** Descuento en el siguiente match por traer a otra
familia. No es ingreso, pero reduce el coste de captación.

Ninguna entra en la versión 1. El modelo de un solo cobro debe demostrar que
funciona antes de añadir capas.
