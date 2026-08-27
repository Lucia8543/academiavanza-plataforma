# ADR 0006 · Cobrar el match con Bizum confirmado a mano

**Fecha:** 25 de agosto de 2026
**Estado:** aceptado
**Sustituye parcialmente a:** [ADR 0004](0004-lanzar-un-directorio-gratuito.md)
**Reactiva:** [ADR 0001](0001-cobrar-solo-el-match.md)

## Contexto

El [ADR 0004](0004-lanzar-un-directorio-gratuito.md) aplazaba el cobro a enero y
lanzaba la versión 1 como un directorio gratuito. El motivo era el tiempo: montar
una pasarela de pago no cabía en tres semanas.

Esa decisión se revisa. La versión 1 cobrará por cada match, y lo hará por Bizum
con confirmación manual, porque es lo único que se puede tener funcionando antes
de que Lucía se vaya.

El [ADR 0001](0001-cobrar-solo-el-match.md) ya había establecido *qué* se cobra:
sólo el contacto, y sólo cuando el profesor ha aceptado. Eso no cambia. Lo que
este documento decide es *cómo* se cobra.

## Decisión

El recorrido tiene tres paradas, y los teléfonos sólo se abren en la última.

1. **La familia escribe.** Su teléfono se guarda, pero no se le pasa a nadie.
2. **El profesor acepta o rechaza.** Decide con el curso, la asignatura, el
   horario y el mensaje. No necesita el teléfono para decidir, así que no lo
   recibe. Si rechaza, ahí termina y nadie ha pagado nada.
3. **La familia paga 10 € por Bizum** poniendo un código en el concepto. Lucía
   recibe el Bizum en su móvil, entra en el panel, teclea el código y confirma.
   En ese momento —y no antes— cada uno ve el teléfono del otro.

Si la familia queda descontenta y no ha dado más de dos clases, Lucía le concede
un vale desde el panel y el siguiente match le sale gratis. Uno por familia.

### Los tres identificadores

| Identificador | Para qué | Por qué es así |
|---|---|---|
| `codigo` | Concepto del Bizum y búsqueda en el panel | Corto porque hay que teclearlo dos veces. Al ser corto es adivinable, así que **no abre nada por sí solo** |
| `token_familia` | Dirección de la página de seguimiento | Largo e imposible de adivinar. Sin correo de por medio, esa dirección es lo único que tiene la familia |
| `token_profesor` | Enlace donde acepta o rechaza | Largo. Hoy se lo pasa Lucía; cuando el correo funcione se enviará solo, sin cambiar nada |

## Consecuencias

### Lo que mejora

Se cobra desde el primer día en vez de en enero, y el ADR 0001 vuelve a estar
vigente sin haber tenido que montar Stripe.

El profesor decide antes de que nadie pague. Una familia no puede pagar por un
contacto que no va a existir.

Ningún teléfono circula hasta que hay un acuerdo entre las dos partes.

### Lo que empeora, y hay que decirlo

**Esto exige que Lucía esté.** Es un incumplimiento consciente del principio que
abre el `CLAUDE.md`: *cualquier flujo que exija su presencia es un defecto*. Una
familia que paga un viernes por la noche no recibe nada hasta que alguien mira el
banco. No hay forma de arreglarlo con el cobro por Bizum: hace falta una pasarela
que avise sola, y eso es Stripe.

La consecuencia práctica es que el tiempo entre pagar y recibir el teléfono
depende de una persona, y esa persona estará en otro país. Conviene decírselo a
la familia en la propia pantalla del pago, en vez de que lo descubra esperando.

**La familia no tiene correo, así que su dirección de seguimiento es todo lo que
tiene.** Si la pierde, se queda sin forma de volver. Se mitiga con una pantalla
de recuperación que pide el código y el teléfono, pero es una mitigación, no una
solución.

**El vale es un acto de fe.** La plataforma no lleva calendario ni registro de
clases —está fuera de alcance a propósito— así que no hay manera de comprobar si
se han dado dos clases o seis. Se concede por la palabra de la familia, con un
límite de uno por familia.

**No se ha valorado la parte fiscal.** Este documento decide cómo se construye,
no si se puede cobrar ni bajo qué figura. Esa parte queda expresamente fuera y
corresponde a Lucía resolverla.

## Alternativas descartadas

**Stripe.** Automático de verdad: la familia paga con tarjeta y el teléfono se
abre solo, sin que nadie mire nada. Es la solución correcta al problema de la
presencia. Se descarta ahora por tiempo, y porque el plan gratuito de Vercel
prohíbe usos comerciales, de modo que cobrar obliga además a pasar a Pro. Debería
retomarse en cuanto haya margen.

**Seguir gratis hasta enero,** como decía el ADR 0004. Se descarta por decisión
de producto.

## Qué queda del ADR 0004

Sigue en pie todo lo que no es el cobro: el directorio, el badge del colegio, la
aprobación manual de fichas y el alcance mínimo de la versión 1. Sólo decae la
parte que decía que la versión 1 sería gratuita.
