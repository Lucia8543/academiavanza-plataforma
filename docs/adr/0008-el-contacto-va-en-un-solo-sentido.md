# ADR 0008 — El contacto va en un solo sentido: del profesor a la familia

**Fecha:** Agosto 2026
**Estado:** Aceptada

---

## Contexto

Hasta ahora, cuando una familia pagaba el contacto, la plataforma hacía un
intercambio simétrico: le daba a la familia el teléfono del profesor y al
profesor el de la familia. Es lo que hace cualquier plataforma de este tipo y
parece lo natural, porque a primera vista beneficia a las dos partes.

Tiene un problema que no se ve hasta que se mira quién está a cada lado.

**Una parte de los profesores que publican ficha es menor de edad.** Son antiguos
alumnos del colegio, muchos en segundo de Bachillerato o recién entrados en la
universidad; algunos tienen dieciséis o diecisiete años. Al otro lado hay un
adulto al que no conocen de nada y del que sólo sabemos lo que ha escrito en un
formulario.

Entregar el número de móvil de un menor a un adulto desconocido, y hacerlo de
forma automática y a cambio de diez euros, no es un detalle de producto que se
arregle con una advertencia en la política de privacidad. Es la clase de decisión
por la que responde quien monta la plataforma.

## Decisión

**El teléfono del profesor no sale de la plataforma en ninguna dirección, en
ningún estado y para nadie.**

Cuando la familia paga:

- Al **profesor** se le da el nombre y el teléfono de la familia.
- A la **familia** no se le da nada del profesor más allá de lo que ya es
  público en su ficha.

Es el profesor quien escribe o llama, y es él quien decide, ya hablando, si le da
su número. Esa decisión es suya y la toma con la información delante, no la toma
un servidor por él.

Lo que la plataforma vende sigue siendo lo mismo —el acceso a un contacto que de
otro modo no existiría— pero el acceso se entrega en la dirección que no pone a
nadie en riesgo.

## Consecuencias

### Favorables

**Ningún dato de contacto de un menor llega a un adulto por decisión nuestra.**
Es la razón de todo lo demás y sería suficiente por sí sola.

**El profesor conserva el control.** Puede dar su número, dar sólo un correo, o
no dar ninguno y quedar directamente. Antes esa decisión se tomaba por él en el
momento en que alguien pulsaba un botón de pago.

**Se simplifica la posición legal.** El aviso legal ya decía que AcademiAvanza no
emplea a los profesores y no responde de lo que pase entre las partes. Repartir
el teléfono de un menor encajaba mal con eso.

### Desfavorables

**La familia queda esperando, y eso hay que compensarlo.** Ha pagado y no puede
hacer nada más que esperar a que le escriban. Es el coste real de esta decisión y
no se disimula: se le dice en el correo de confirmación, en su página de
seguimiento y en la guía, junto con la salida —si en un par de días no le han
escrito, pide otro contacto sin volver a pagar—. Sin esa salida, la decisión
sería defendible y aun así injusta.

**Depende de que el profesor dé el primer paso.** Si no escribe, no pasa nada de
nada. Por eso los tres sitios donde el profesor lee qué ocurre después de aceptar
—el correo de aceptación, el correo con el teléfono y la pantalla de aceptar— le
dicen exactamente lo mismo: *ella no tiene tu número y no se lo vamos a dar; si
no le escribes tú, no puede pasar nada*.

**Una parte del valor percibido se pierde.** «Os pasamos los teléfonos» es un
titular mejor que «él te escribirá». Es un peor titular y una mejor plataforma.

## El caso del profesor que escribe tarde

Hay un recorrido que sólo aparece al recorrerlo entero y que hubo que resolver
aparte.

La familia paga. El profesor recibe su teléfono y no escribe. Pasan tres días,
ella pide otro contacto y busca a otra persona. Y al quinto día él escribe.

Hasta ahora, **a él no se le decía nada en ningún momento**. Se quedaba con el
teléfono de alguien que ya le había descartado sin saber que le había
descartado, y cuando escribía, escribía a una familia que había dejado de
esperarle y que recibía el mensaje de alguien a quien creía haber cancelado.

Ese es el problema de verdad, y no es el dinero. El teléfono no se puede
recuperar —es irreversible desde el momento en que se entrega— pero **sí se le
puede pedir que no lo use, y que quede constancia de que se le pidió**. Es lo
que hace ahora `pedirVale` cuando el motivo es «no conseguí hablar con él»: al
profesor le llega un correo pidiéndole que no escriba y que borre el número.

El tono de ese correo no es de reproche, y es deliberado. La mayoría no escribe
por despiste, por exámenes o porque el aviso se fue a spam. Decirle «has perdido
a esta familia» a alguien que trabaja gratis es la forma más rápida de que se dé
de baja, y lo que aquí hay que conseguir es que no escriba, no que se sienta mal.

**Queda un agujero abierto a propósito.** Si ese profesor escribe igualmente y la
familia decide quedarse con él, ella habrá tenido dos contactos por diez euros.
Se ha decidido no cerrarlo:

- Es raro. Hacen falta tres coincidencias: que él escriba tarde, que ella ya haya
  pedido el vale, y que además se quede con el primero.
- Cerrarlo cuesta más de lo que ahorra. Cualquier comprobación —un botón de «ya
  le he escrito», una pregunta al gastar el vale— le pone una pega a la familia
  que ha pagado, ha esperado tres días sin noticias y sólo tiene nuestra palabra.
  **Una garantía con condiciones deja de ser una garantía y pasa a ser letra
  pequeña**, y quien lo paga es la familia honesta, que es la mayoría.
- Lo que se pierde es una venta de diez euros. Lo que se protegería es la
  sensación de que la garantía es de verdad.

## Cómo se sostiene

Esto no es una convención que se respeta por costumbre: **está vigilado por las
pruebas de integración.** `tests/integracion/dinero.test.ts` comprueba, para cada
estado por el que puede pasar una solicitud —incluidos `pagada` y `devuelta`—,
que el teléfono del profesor no aparece en lo que se le sirve a la familia. Y
`vale.test.ts` lo comprueba también para la solicitud pagada con un vale.

Se han escrito así a propósito, invirtiendo unas pruebas que antes comprobaban lo
contrario. Sin ellas, «que la familia vea el teléfono cuando ya ha pagado» es una
mejora razonable que cualquiera reintroduce en diez minutos sin saber lo que está
deshaciendo.
