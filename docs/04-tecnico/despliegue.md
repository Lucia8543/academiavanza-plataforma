# Cómo está desplegada la plataforma

Este documento existe porque, desde que la aplicación vive en Render, **la
configuración del despliegue ya no está en el repositorio**. Antes había un
`vercel.json` que se leía junto al código; ahora hay tres recursos en un panel
web y nadie los ve si no entra. Si esto no se documenta, dentro de seis meses
nadie sabrá por qué las tareas automáticas corren a las siete de la mañana ni
dónde mirar cuando dejen de correr.

El porqué de estar en Render y no en otro sitio está en el
[ADR 0007](../adr/0007-alojar-en-render.md).

---

## Los tres recursos de Render

Todos en la región **Fráncfort**, todos conectados a la rama `main` del
repositorio, todos con despliegue automático al subir cambios.

### 1. `academiavanza-plataforma` — Web Service

Es la aplicación. Plan **Starter**, siete dólares al mes.

| Campo | Valor |
|---|---|
| Build Command | `pnpm install && pnpm build` |
| Start Command | `pnpm start` |

El `build` del `package.json` es `prisma generate && next build`, y ese
`prisma generate` no es decorativo: sin él, un despliegue que reutilice la caché
de dependencias compila con un cliente de Prisma desactualizado y falla con
decenas de errores de tipos que no aparecen en local.

### 2. `mantenimiento-diario` — Cron Job

Ejecuta todos los días a las **07:00 UTC** —las nueve de la mañana en Madrid en
horario de verano, las ocho en invierno—:

```
curl -sS --fail-with-body -H "Authorization: Bearer $CRON_SECRET" \
  https://academiavanza-plataforma.onrender.com/api/mantenimiento
```

Es lo que cierra solicitudes vencidas, borra los datos de las familias a los
noventa días, recuerda a los profesores que tienen a alguien esperando y manda
el correo diario a administración. Lo que hace cada tarea está en
`src/backend/services/mantenimiento.ts`.

**Build Command: `echo ok`.** Render propone `pnpm install && pnpm build` porque
detecta un proyecto Next.js. No hay que dejarlo: esta tarea solo hace una llamada
HTTP y no necesita compilar nada. Con el `build` puesto, cada madrugada
construiría el proyecto entero para lanzar un `curl` — cinco minutos de cómputo
que se pagan y que pueden fallar por memoria.

**Necesita la variable `CRON_SECRET`**, y tiene que ser exactamente la misma que
la del servicio web. Si difieren, la llamada devuelve `401` y no se ejecuta nada.

### 3. `despertar-supabase` — Cron Job

Lunes y jueves a las **09:00 UTC**:

```
curl -sS --fail-with-body https://academiavanza-plataforma.onrender.com/api/despertar
```

El plan gratuito de Supabase pausa el proyecto tras siete días sin actividad, y
despertarlo tarda medio minuto. Dos toques por semana dejan como máximo cuatro
días de margen.

No lleva secreto a propósito: lo único que hace es contar filas, y que alguien lo
llame es exactamente lo que se busca. Build Command `echo ok`, sin variables.

---

## Cómo saber si el mantenimiento ha dejado de correr

Este es el fallo silencioso del sistema. Si el cron deja de ejecutarse, la web
sigue funcionando con normalidad, nadie se queja, y mientras tanto los datos de
las familias dejan de borrarse y las solicitudes vencidas se quedan vivas para
siempre.

Hay tres formas de verlo, de más fiable a menos:

**La tabla `app.mantenimiento_ejecuciones`.** Cada pasada deja una fila con la
fecha, la duración y el resumen. Es la fuente de verdad:

```sql
SELECT ejecutado_en, duracion_ms, errores, resumen
  FROM app.mantenimiento_ejecuciones
 ORDER BY ejecutado_en DESC LIMIT 5;
```

**El panel de administración**, que avisa cuando la última ejecución tiene más de
treinta y seis horas.

**El registro del cron en Render**, que dice si la llamada salió y con qué
resultado.

La causa más probable de que falle es que `CRON_SECRET` no coincida entre el cron
y el servicio web.

---

## El dominio

`academiavanza.es` apunta a Render con un registro **`A`** a `216.24.57.1`, y
`www` con un **`CNAME`** a `academiavanza-plataforma.onrender.com`. La zona DNS se
gestiona en Axarnet.

En la raíz tiene que ser un `A` y no un `CNAME`. Un `CNAME` en la raíz de un
dominio es incompatible con tener registros `MX`, así que ponerlo dejaría el
dominio sin correo.

**Lo que no se toca en esa zona:** los registros `MX`, los `A` de `mail`,
`webmail` y `ftp`, los `TXT` —donde viven SPF, DKIM y DMARC, tanto los del
dominio como los de Resend en `send.academiavanza.es`— y los `NS`.

El registro SPF dice `v=spf1 mx a:mail.academiavanza.es …`, que apunta al `mail`
de forma explícita y no a la raíz. Por eso cambiar la `A` del dominio no afecta al
correo. Si en algún momento se simplificara a `a` a secas, esto dejaría de ser
cierto.

---

## Las variables de entorno

Sólo los nombres. Los valores están en el panel de Render y en el `.env.local`,
que no se sube al repositorio.

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Supabase |
| `NEXT_PUBLIC_APP_URL` | Base de todos los enlaces de los correos |
| `CRON_SECRET` | Protege `/api/mantenimiento`. También en el cron |
| `RESEND_API_KEY` | Envío de correos |
| `EMAIL_ADMIN` | Destinatario del resumen diario |

`NEXT_PUBLIC_APP_URL` es la que más daño hace si se queda mal: se compila dentro
de las páginas, así que cambiarla exige un despliegue nuevo, y mientras esté
apuntando a la dirección anterior, **los enlaces de los correos que ya han salido
seguirán llevando allí**.

---

## Vercel

Ya no se usa. Los crons se desactivaron desde *Settings → Cron Jobs* antes de
mover el dominio, para evitar que las tareas se ejecutaran dos veces y salieran
correos duplicados. El fichero `vercel.json` se eliminó del repositorio.

---

## Axarnet

**No se puede dar de baja el hosting**, aunque la web antigua ya no se sirva desde
ahí. `mail.academiavanza.es` apunta a ese servidor y es lo que hace funcionar el
correo del dominio.
