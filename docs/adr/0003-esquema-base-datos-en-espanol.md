# ADR 0003 — El esquema de base de datos se nombra en español

**Fecha:** Agosto 2026
**Estado:** Aceptada

---

## Contexto

La convención habitual en desarrollo es nombrar todo el código en inglés, incluidas
las tablas y columnas de la base de datos, reservando el español para la interfaz y
la documentación.

En este proyecto hay una circunstancia que no es la habitual: **Lucía va a
consultar la base de datos directamente desde un cliente SQL.** No es una
posibilidad remota ni un caso de mantenimiento excepcional; es un requisito
explícito, con su propio rol de acceso y su guía de uso.

Lucía no es desarrolladora. Es la responsable del negocio, y va a escribir
consultas para responderse preguntas que el panel no cubre.

## Decisión

**El esquema de base de datos se nombra íntegramente en español.** Tablas,
columnas, tipos enumerados, vistas, funciones y restricciones.

```sql
SELECT profesor, propuestas_recibidas, tasa_aceptacion_pct
FROM   app.gestion_rendimiento_profesores
WHERE  sin_responder > 0;
```

frente a la alternativa:

```sql
SELECT teacher, received_proposals, acceptance_rate_pct
FROM   app.mgmt_teacher_performance
WHERE  unanswered > 0;
```

**El resto del código sigue en inglés**: variables, funciones, componentes y
nombres de fichero de la aplicación.

La frontera es la capa de repositorios, que traduce entre ambos mundos.

## Consecuencias

### Favorables

Lucía puede leer y escribir consultas sin traducir mentalmente. Una columna llamada
`nota_evau` no necesita explicación; `entrance_exam_grade` sí.

La documentación de base de datos y las consultas de ejemplo se leen de corrido, sin
mezclar idiomas dentro de la misma frase.

Los conceptos del dominio son específicos del sistema educativo español —EVAU,
bachillerato, ESO, Bizum— y traducirlos produce nombres peores. `nota_evau` es más
claro que cualquier equivalente inglés, que tendría que ser explicativo y largo.

Los mensajes de error de las restricciones son legibles directamente:
`prop_contacto_solo_si_pagada` dice lo que ha pasado sin consultar nada.

### Desfavorables

**Rompe la convención general.** Un desarrollador que llegue nuevo lo encontrará
inusual y hay que explicárselo.

**Convive con código en inglés.** En la capa de repositorios se mezclan ambos
idiomas en el mismo fichero.

**Los acentos y la eñe.** Se evitan por completo en identificadores —`resenas`, no
`reseñas`— para no depender de configuraciones regionales. Es una inconsistencia
ortográfica asumida conscientemente.

**Pluralización irregular.** El español tiene más excepciones que el inglés. Se
adopta la regla de plural simple para nombres de tabla y se documenta.

## Alternativas descartadas

**Todo en inglés con vistas en español.** Se llegó a considerar mantener el esquema
en inglés y crear una capa de vistas traducidas para Lucía. Se descarta porque
duplica la superficie a mantener, y porque las vistas solo sirven para leer: en
cuanto quisiera corregir un dato tendría que volver a los nombres en inglés.

**Todo en español, incluido el código de la aplicación.** Complicaría integrar
bibliotecas de terceros y contradice la convención de los marcos utilizados, cuyos
propios ficheros y funciones están en inglés.

## Notas

Se admite el préstamo cuando es el término de uso común en el dominio técnico:
`stripe_price_id`, `webhook`, `slug`, `token_hash`. Traducirlos produciría nombres
que nadie reconocería.
