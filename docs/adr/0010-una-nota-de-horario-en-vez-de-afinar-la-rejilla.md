# ADR 0010 · Una nota de horario en vez de afinar la rejilla

**Fecha:** 1 de septiembre de 2026
**Estado:** aceptada

## El problema

La rejilla de disponibilidad tiene tres franjas: mañana de 09:00 a 14:00, tarde
de 16:00 a 20:00 y noche de 20:00 a 22:00. Son bloques de cuatro y cinco horas,
y hay profesores cuya disponibilidad real dentro de un bloque es de hora y
media.

La rejilla, entonces, no miente pero dice bastante menos de lo que el profesor
sabe. La familia lee «tarde» y entiende que hay cuatro horas donde hay noventa
minutos, y el desajuste no aparece hasta que las dos partes ya están hablando.

Lo destapó una profesora con prácticas por las mañanas a partir de octubre, que
sólo podía de 17:30 a 19:00 y escribió pidiendo avisar a la familia antes de que
se comprometiera a nada. Tenía razón y no tenía dónde ponerlo: ni la hora
concreta dentro de la franja, ni que su horario cambiaba con el curso.

Porque el segundo problema es ése. La rejilla es un patrón semanal sin fechas.
No existe forma de decir «esto hasta el 30 de septiembre, aquello desde
octubre», y en un directorio hecho de estudiantes universitarios eso no es un
caso raro: es lo que pasa cada octubre y cada enero.

## Lo que se decidió

Un campo de texto libre de 120 caracteres, `nota_disponibilidad`, que el
profesor escribe y mantiene, y que se muestra en su ficha justo debajo de la
rejilla. Algo del estilo de «desde octubre sólo de 17:30 a 19:00».

Complementa la rejilla, no la sustituye. La rejilla sigue sirviendo para lo que
servía, que es descartar en bloque a quien no puede por las tardes; la nota
aporta el matiz que hace falta para no hacer perder el tiempo a nadie.

## Las alternativas que se descartaron

**Partir las franjas en bloques más pequeños.** Dividir la tarde en 16:00-18:00
y 18:00-20:00 acerca la rejilla a la verdad, pero no la alcanza: quien puede de
17:30 a 19:00 sigue sin poder decirlo, porque su hueco cruza las dos mitades.
Y no resuelve en absoluto el problema de las fechas, que es la mitad del caso
original. Tocar el esquema, el formulario, el directorio y la migración para
arreglar medio problema no sale a cuenta.

**Añadir `valido_desde` y `valido_hasta` a cada franja.** Resuelve las dos
cosas, y es la solución correcta si algún día esto se convierte en un producto
de reservas. Hoy no lo es. Obliga a diseñar una interfaz donde el profesor
gestiona varios patrones solapados en el tiempo, que es exactamente la
complejidad que el `CLAUDE.md` deja fuera de alcance de forma indefinida cuando
dice que no hay calendario. Se descartó por eso, no porque no funcionara.

## Lo que se pierde

La nota es texto libre, así que **el sistema no puede filtrar por ella**. Si una
familia necesita clase a las 18:00, la plataforma no puede descartar
automáticamente a quien ha escrito que sólo puede a las 17:30.

Se asume porque el flujo ya tiene un filtro humano en el sitio correcto: según
el [ADR 0001](0001-cobrar-solo-el-match.md), la propuesta es gratis y la familia
sólo paga si el profesor acepta. El profesor lee la solicitud y decide, y ese es
el punto donde un horario incompatible se detiene. La nota adelanta esa
información a la familia para que ni siquiera llegue a solicitarlo, que es una
mejora sobre lo que había, no una garantía nueva.

## La trampa que hay que vigilar

Es un campo de texto libre **que se publica**, y encima invita a concretar. Un
profesor bienintencionado escribe «escríbeme y lo vemos» con su teléfono
detrás, y ahí se ha saltado sin querer todo el modelo: lo que la plataforma
cobra es precisamente el contacto.

Por eso la nota pasa por `detectarDatosSensibles`, igual que los puntos fuertes,
y por las dos puertas: el esquema Zod del alta y la validación a mano del panel.
El texto de ayuda del formulario lo dice de forma explícita.

## Consecuencias

- Los profesores existentes tienen el campo vacío y la ficha sigue igual. No
  hace falta migrar nada ni pedirles nada.
- Si con el tiempo se ve que casi todo el directorio escribe una nota con una
  hora concreta, eso sería la señal de que la rejilla se ha quedado corta de
  verdad y de que toca revisar esta decisión.
