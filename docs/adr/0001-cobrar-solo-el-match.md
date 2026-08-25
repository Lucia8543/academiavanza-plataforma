# ADR 0001 — La plataforma cobra sólo el match, no las clases

**Fecha:** Agosto 2026
**Estado:** Aceptada

---

## Contexto

En el modelo manual, Lucía intermediaba en todo el circuito económico: las familias
le pagaban las clases por transferencia a su IBAN, ella llevaba el control de los
bonos de seis clases en un Excel, avisaba cuando quedaban pocas, y cada domingo
hacía un Bizum a cada profesor por las clases de la semana siguiente.

Ese circuito es la mayor carga operativa del negocio y la razón principal por la
que no puede funcionar sin ella. Es también lo que la obligaba a estar disponible
todos los fines de semana.

Las plataformas de referencia se reparten en dos modelos: las que intermedian en
cada clase y cobran comisión (Classgap 12–20 %, Preply 33 %, GoStudent con
suscripción completa), y las que sólo cobran por el acceso al contacto (Superprof y
TusClasesParticulares con sus pases mensuales, Wuolah por lead generado).

## Decisión

**La plataforma cobra una única tarifa a la familia, en el momento en que un
profesor acepta su propuesta, a cambio de revelarle su teléfono. Nada más.**

Los pagos por las clases quedan fuera del sistema: los acuerdan y liquidan familia
y profesor directamente, por Bizum o transferencia. La plataforma no los registra,
no los intermedia y no los conoce.

Concretamente, el modelo de datos **no** contiene tablas de bonos, clases
impartidas, liquidaciones a profesores ni saldos.

## Consecuencias

### Favorables

Elimina de raíz la carga operativa que motivó el rediseño. Sin bonos que seguir ni
Bizums que hacer, no queda nada que exija presencia semanal.

Evita convertirse en intermediario de pagos, lo que acarrea obligaciones
regulatorias, fiscales y de custodia de fondos considerables para un negocio de
este tamaño.

Simplifica el producto de forma drástica: no hay calendario, ni control de
asistencia, ni conciliación de saldos, ni gestión de impagos entre partes.

El cobro es idéntico en todos los casos y ocurre una sola vez, lo que hace la
integración con Stripe trivial y el modelo fácil de explicar.

### Desfavorables

**Se pierde el ingreso recurrente.** En el modelo anterior, cada clase generaba
comisión. Ahora una relación familia–profesor que dure dos años genera exactamente
un cobro. Es el coste real de esta decisión y hay que asumirlo conscientemente.

**Desaparece la visibilidad sobre lo que pasa después.** La plataforma no sabe si
las clases se dieron, si fueron bien o si la relación continuó. Se mitiga
parcialmente con las reseñas, pero la información es mucho menor.

**Aparece el incentivo a saltarse la plataforma.** Una vez revelado el teléfono, no
hay nada que ate a las partes al producto. Se asume: intentar impedirlo exigiría
justamente la intermediación que se quiere evitar.

**El valor percibido debe estar todo en el momento del match.** Si la familia no
percibe que el contacto verificado vale lo que cuesta, no paga. De ahí que la
verificación del colegio y la calidad del directorio no sean adornos, sino el
producto entero.

## Alternativas descartadas

**Comisión por clase, al estilo Classgap o Preply.** Reproduce exactamente el
problema que se quiere eliminar: exige saber qué clases se dieron, lo que obliga a
un sistema de confirmación y a perseguir a quien no confirma.

**Suscripción mensual de la familia, al estilo Superprof o TusClasesParticulares.**
Es un modelo válido y de hecho queda contemplado como posible evolución. Se
descarta para el arranque porque exige un volumen de oferta que justifique pagar
todos los meses, y con un directorio pequeño la propuesta no se sostiene.

**Suscripción del profesor.** Reduce la oferta justo cuando más falta hace. Con un
directorio pequeño, cada profesor que no se registra por no pagar es una pérdida
mucho mayor que la cuota.

**Cobrar el envío de la propuesta.** Se llegó a plantear un modelo en dos tramos
—una cantidad pequeña por enviar la propuesta y otra por revelar el contacto— y se
descartó: la familia pagaría sin garantía de resultado, y un profesor que no
responde o rechaza dejaría un cobro sin contraprestación. Cobrar sólo cuando hay
acuerdo por ambas partes es más justo y más fácil de defender.

## Referencias

- [Modelo de ingresos y análisis de precio](../01-negocio/modelo-ingresos.md)
- [Análisis competitivo](../01-negocio/analisis-competitivo.md)
- [Modelo de datos](../04-tecnico/modelo-datos.md), apartado 5
