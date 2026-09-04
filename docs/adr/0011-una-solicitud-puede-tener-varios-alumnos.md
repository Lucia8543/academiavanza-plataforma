# ADR 0011 · Una solicitud puede tener varios alumnos, y se paga una sola vez

**Fecha:** 4 de septiembre de 2026
**Estado:** aceptado

## El problema

Una madre quería tres horas semanales para su hija y dos para su hijo, con la
misma profesora. El formulario admitía un curso y unas horas, en singular, así
que tuvo que decidir por cuál de los dos preguntaba. Como no sabía cuál encajaría
mejor en el horario de la profesora, hizo lo razonable: escribir a varios
profesores a la vez, por si acaso.

El resultado fue cuatro conversaciones abiertas que ella no sabía cerrar, un
riesgo de que le cobraran cuatro contactos que ya no quería, y Lucía cerrando
solicitudes a mano. Es decir, la definición de lo que esta plataforma existe para
no tener.

El fallo no fue de nadie. Fue que la plataforma no tenía forma de representar
«dos hermanos», y lo que no se puede decir se cuenta mal.

## La decisión

**Una solicitud puede llevar hasta tres alumnos**, cada uno con su curso y sus
horas. La familia puede además declarar que le vale con que el profesor coja a
alguno de ellos, y entonces es él quien elige cuál.

**El precio no cambia con el número de alumnos.** Lo que se compra es poder
hablar con esa persona, y el teléfono es el mismo coja a uno o a los tres.

## Por qué el precio no cambia

Es la decisión que sostiene a las demás, y la alternativa parecía más justa hasta
que se mira de cerca. Cobrar por alumno obligaría a recalcular el importe en el
momento en que el profesor acepta, a decirle a la familia una cifra distinta de
la que vio al escribir, y a explicarle por qué. Todo eso por unos euros, y a
cambio de una regla que ya no se puede contar en una frase.

La regla que queda sí cabe en una frase, y por eso se puede poner en el
formulario, en el correo del profesor y en la pantalla donde acepta: **se paga
por profesor, no por hijo**.

Tiene un efecto secundario buscado. Una familia que quiere un profesor distinto
para cada hijo paga dos contactos, y eso también es fácil de explicar: acaba con
dos teléfonos y dos personas dando clase.

## Por qué una tabla y no dos columnas más

La salida rápida era añadir `nivel_id_2` y `horas_semana_2` a `contactos`. Se
descartó por una razón concreta: **la aceptación parcial no cabe ahí**. Si el
profesor puede coger a uno de los dos, hay que poder marcar la decisión de cada
hermano por separado, y una columna suelta no tiene dónde guardarla.

`app.contacto_alumnos` tiene una fila por alumno, con su curso, sus horas y un
`aceptado` de tres valores: nulo mientras el profesor no contesta, cierto si lo
coge, falso si a ése no. Los tres hacen falta, porque la familia tiene que poder
distinguir «todavía no ha dicho nada» de «a este niño no».

De cada menor se sigue guardando lo mismo que antes: el curso, y nada más.

## La duplicidad que se asume

`contactos.nivel_id` y `contactos.horas_semana` no se vacían. Siguen llevando los
del primer alumno, porque de ahí leen el panel de cobros, los correos, la lista
de «tus otras solicitudes» y el histórico entero.

Es un dato en dos sitios y eso siempre se paga. Se acepta porque la alternativa
era reescribir media plataforma el mismo día que se toca el formulario, y porque
hay una regla que lo mantiene honesto:

> Manda `contacto_alumnos`. Lo de `contactos` es un reflejo del primer alumno y
> se escribe en un único lugar, dentro del `create` de `crearSolicitud`.

Si algún día se rompe, el síntoma será una solicitud que dice un curso en el
correo y otro en la pantalla.

## El tope de tres

No es un límite técnico. Cada hermano añade dos preguntas al formulario, y un
formulario que crece mientras se rellena en el móvil es gente que lo abandona.
Una familia con cuatro hijos lo cuenta en el texto libre y lo hablan por
teléfono, que es lo que iba a pasar de todas formas.

## Lo que esto no resuelve

Que un hijo dé hora y media y el otro una hora, o que los dos puedan ir el mismo
día, sigue sin caber en ninguna lista. Eso es el texto libre, que por esta misma
razón se ha movido justo debajo de las preguntas de horario.

No se ha intentado meterlo en el formulario a propósito. Lo que tiene que hacer
esta pantalla es que el profesor pueda decir que sí o que no sin llamar a nadie,
no cuadrarle la semana.
