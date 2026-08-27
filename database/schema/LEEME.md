# Esta carpeta es el diseño original. No la ejecutes

Los doce ficheros de `database/schema/` se escribieron al principio del
proyecto, cuando AcademiAvanza era un documento y no una web. Describen una
base de datos bastante más ambiciosa que la que existe: cuentas de familia,
alumnos dados de alta, pagos con Stripe, reseñas con réplica del profesor,
notificaciones y permisos por fila.

**Nada de eso se construyó.** Lo que hay en Supabase son los ficheros de
[`database/v1/`](../v1/), que son los que se han ido ejecutando uno a uno según
crecía la plataforma. Si alguien tuviera que levantar la base de datos desde
cero, es esa carpeta la que hay que aplicar, en orden numérico.

## Por qué no se borra

Porque explica decisiones que siguen vigentes y que no están escritas en ningún
otro sitio: por qué el esquema está en castellano, por qué se separan los
catálogos del resto, y qué se pensó hacer con los datos de la migración. Borrarla
perdería ese razonamiento y no ganaría nada.

Y porque parte de lo que describe puede volver algún día. Las reseñas no están
descartadas para siempre; están fuera de alcance ahora.

## Qué pasó con la comprobación automática

Durante semanas, la comprobación de GitHub validaba esta carpeta. Como el código
avanzaba por `v1` y esto se quedaba quieto, el resultado era rojo en cada subida.
Un aviso que siempre está en rojo deja de mirarse a los tres días, así que dejó de
avisar de nada.

Desde agosto de 2026 el CI valida `database/v1/` y además comprueba que las
semillas se pueden ejecutar dos veces sin romperse.

## Si algún día hay que unificarlas

La opción limpia sería generar un único esquema a partir de lo que hay en
producción y jubilar las dos carpetas. Es trabajo de una tarde y conviene hacerlo
con la base de datos delante, no de memoria. Mientras tanto, la regla es simple:

> **Lo que manda es `database/v1/`.** Esta carpeta se lee, no se ejecuta.
