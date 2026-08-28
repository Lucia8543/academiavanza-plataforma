# ADR 0007 — La plataforma se aloja en Render, no en Vercel

**Fecha:** Agosto 2026
**Estado:** Aceptada

---

## Contexto

La plataforma se desplegó al principio en Vercel, en el plan gratuito, porque es
el camino de menor resistencia para una aplicación Next.js: se conecta el
repositorio y funciona.

El problema apareció al leer las condiciones. El plan Hobby de Vercel **prohíbe
el uso comercial**, y AcademiAvanza cobra diez euros a la familia cada vez que un
profesor acepta. No es una zona gris ni una interpretación forzada: hay una
transacción económica, y por tanto el plan gratuito no es una opción legítima.

Descubrirlo antes de lanzar es mucho mejor que descubrirlo después. Una
suspensión de cuenta con familias esperando respuesta y profesores con
solicitudes vivas no es un incidente técnico, es el final del servicio.

Sobre la mesa había tres caminos:

**Vercel Pro**, unos veinte dólares al mes. Resuelve el problema sin tocar nada.
A cambio se paga por una red de distribución mundial y unos límites de tráfico
pensados para un público que esta plataforma no tiene: sus usuarios están todos
en Madrid.

**Un servidor propio**, tipo Contabo, por cinco euros al mes. Es la opción más
barata y la que más control da. También la que exige parchear el sistema
operativo, renovar certificados, vigilar copias de seguridad y responder si algo
se cae. Con datos de menores de edad en juego y la responsable fuera de España
durante meses, eso no es ahorro: es una deuda que vence en el peor momento.

**Render**, siete dólares al mes en su plan Starter, con la máquina en Fráncfort.

## Decisión

**La aplicación se aloja en Render, en un Web Service del plan Starter, región
Fráncfort. Las tareas automáticas dejan de ser crons de Vercel y pasan a ser Cron
Jobs nativos de Render.**

El dominio `academiavanza.es` apunta a Render mediante un registro `A` en la
raíz. Todo lo relativo al correo —los registros `MX`, `TXT` y el `A` de
`mail`— sigue en el hosting de Axarnet y no se toca.

Supabase y Resend no cambian.

## Consecuencias

### Favorables

**El uso es legítimo.** Es la razón por la que existe esta decisión y basta por
sí sola.

**Cuesta menos que la alternativa cómoda** —siete dólares frente a veinte— y no
exige administrar ningún servidor, que era el coste oculto de la alternativa
barata.

**Todo queda en la Unión Europea.** La aplicación en Fráncfort y la base de datos
en Irlanda. Para una plataforma que trata datos de menores de edad, poder decir
eso en la política de privacidad sin matices ni cláusulas de transferencia
internacional vale más que unos milisegundos de latencia.

**Las tareas automáticas dejan de ser aproximadas.** El cron de Vercel en plan
gratuito tenía una ventana de una hora; el de Render se ejecuta a la hora que se
le dice.

### Desfavorables

**El secreto de las tareas vive ahora en dos sitios.** El servicio web y el cron
son recursos distintos en Render, cada uno con sus variables de entorno, y ambos
necesitan el mismo `CRON_SECRET`. Si alguien lo cambia en uno y no en el otro, la
llamada devuelve un 401 y **el mantenimiento deja de ejecutarse en silencio**: no
se borran datos de familias, no se cierran solicitudes y nadie se entera. La red
que lo detecta es el aviso del panel de administración, que salta cuando el
proceso lleva más de treinta y seis horas sin correr.

**Los despliegues son más lentos.** Render reconstruye desde cero; Vercel
cacheaba. Un minuto o dos más por despliegue, a cambio de que no vuelva a pasar
lo del cliente de Prisma desactualizado.

**No hay red de distribución mundial.** Alguien que abra la web desde América la
verá algo más lenta. El directorio es de profesores de Madrid, así que es un
coste teórico.

**La configuración de los crons ya no está en el repositorio.** Con Vercel vivía
en `vercel.json`, versionado junto al código. En Render vive en su panel. Se
documenta en [`docs/04-tecnico/despliegue.md`](../04-tecnico/despliegue.md), que
hay que mantener a mano y que por tanto puede quedarse obsoleto.

## Efecto colateral: la web antigua

Hasta este cambio, `academiavanza.es` no servía la plataforma: servía **la web
anterior de WordPress**, alojada en Axarnet, la del modelo de academia con
profesores del Colegio Montpellier. El dominio nunca llegó a apuntar a Vercel.

Al mover el registro `A`, esa web deja de verse. Sus ficheros siguen en el
hosting de Axarnet y no se han borrado, pero el dominio ya no lleva a ellos.

**El hosting de Axarnet no se puede cancelar**, aunque parezca que ya no sirve
para nada: `mail.academiavanza.es` apunta a ese mismo servidor y es lo que hace
que funcione el correo del dominio.
