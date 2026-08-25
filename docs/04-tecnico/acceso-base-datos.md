# Acceso directo a la base de datos

Guía para consultar y editar la base de datos de AcademiAvanza desde un cliente
SQL, sin pasar por el panel de administración.

---

## 1. Por qué existe este acceso

El panel de administración cubre la operativa del día a día. Pero hay cosas que un
panel nunca cubre bien: responder una pregunta que a nadie se le ocurrió al
diseñarlo, corregir a mano un dato que entró mal, o cruzar dos tablas para
entender por qué algo no cuadra.

Para eso está este acceso. Es una herramienta de diagnóstico y de análisis, no la
vía normal de trabajo.

---

## 2. Usuarios de base de datos

Existen tres identidades distintas, y la separación es deliberada.

| Usuario | Para qué | Permisos |
|---|---|---|
| `academiavanza_app` | La aplicación web | Lectura y escritura acotadas. No puede borrar. Sujeto a seguridad por fila. |
| `academiavanza_lucia` | Lucía, desde el cliente SQL | Lectura y escritura completas. Ve todas las filas. Auditado. |
| `academiavanza_lectura` | Herramientas de análisis | Sólo lectura. Sin acceso a los datos crudos de migración. |

**Por qué no compartir el usuario de la aplicación.** Porque entonces sería
imposible saber si un cambio lo hizo el producto o una edición manual. Con dos
identidades separadas, la tabla de auditoría lo distingue automáticamente: cada
cambio queda marcado como `aplicacion` o `sql_directo`.

Esto importa el día que algo esté mal y haya que reconstruir qué pasó.

---

## 3. Cliente recomendado

**DBeaver Community** — gratuito, funciona en Windows, Mac y Linux, y soporta
PostgreSQL de forma nativa. Descarga en <https://dbeaver.io/download/>.

Alternativas igual de válidas: **TablePlus** (más bonito, de pago tras el periodo
de prueba), **pgAdmin 4** (el oficial de PostgreSQL, algo más árido) o la propia
consola SQL del panel de Supabase, que va bien para consultas rápidas.

---

## 4. Datos de conexión

Se obtienen en el panel de Supabase, en *Project Settings → Database*.

```
Host:       db.<referencia-del-proyecto>.supabase.co
Puerto:     5432
Base:       postgres
Usuario:    academiavanza_lucia
Contraseña: (gestor de contraseñas — nunca en el repositorio)
SSL:        require
```

### Configuración en DBeaver

1. *Database → New Database Connection → PostgreSQL*
2. Rellenar host, puerto, base de datos, usuario y contraseña
3. En la pestaña **SSL**, marcar *Use SSL* y poner *SSL mode* en `require`
4. *Test Connection* y guardar

> **Nunca guardes la contraseña en un fichero del repositorio.** Un gestor de
> contraseñas, o la opción de guardado del propio DBeaver, que la cifra.

---

## 5. Cómo está organizada la base de datos

Cuatro esquemas, cada uno con su función:

**`app`** — Las tablas del producto. Es donde está prácticamente todo lo que
interesa: profesores, familias, propuestas, pagos, reseñas.

**`catalogo`** — Datos maestros: colegios, asignaturas, niveles, zonas,
certificaciones. Cambian poco y se editan desde el panel.

**`legacy`** — El volcado crudo del Excel histórico. Sólo para consultar durante la
migración. Contiene datos sin depurar, incluidos datos de menores.

**`auditoria`** — El registro de quién cambió qué.

---

## 6. Consultas de uso frecuente

Se han creado varias vistas para no tener que escribir uniones de seis tablas cada
vez. Empiezan por `gestion_` y están pensadas exactamente para esto.

### Estado del negocio de un vistazo

```sql
SELECT * FROM app.gestion_resumen;
```

Devuelve una única fila con profesores activos, propuestas pendientes, matches del
mes, ingresos y tarifa vigente.

### Ingresos mes a mes

```sql
SELECT * FROM app.gestion_ingresos_mensuales;
```

### Rendimiento de cada profesor

```sql
SELECT * FROM app.gestion_rendimiento_profesores;
```

Un profesor por fila con su embudo completo: propuestas recibidas, aceptadas,
rechazadas, sin responder, matches cerrados, tasa de aceptación y tiempo medio de
respuesta.

Para ver quién no está respondiendo:

```sql
SELECT profesor, propuestas_recibidas, sin_responder, horas_medias_respuesta
FROM   app.gestion_rendimiento_profesores
WHERE  sin_responder > 0
ORDER  BY sin_responder DESC;
```

### Conversión global

```sql
SELECT * FROM app.gestion_embudo;
```

Cuántas propuestas se envían, cuántas se aceptan, cuántas se pagan y los
porcentajes entre cada paso. Es la consulta que dice si el precio está bien puesto:
si `pct_pago_tras_aceptar` es bajo, el problema es el precio, no el matching.

### Perfiles migrados sin reclamar

```sql
SELECT * FROM app.gestion_pendientes_validacion;
```

### Propuestas atascadas

```sql
SELECT referencia, familia_nombre, profesor_nombre, estado, creado_en
FROM   app.v_propuestas_detalle
WHERE  estado = 'enviada'
  AND  creado_en < NOW() - INTERVAL '48 hours'
ORDER  BY creado_en;
```

### Profesores esperando aprobación

```sql
SELECT pe.nombre, pe.apellidos, pe.email, c.nombre AS colegio,
       pr.titulacion, pr.universidad, pr.nota_evau, pr.creado_en
FROM   app.profesores pr
JOIN   app.perfiles   pe ON pe.id = pr.id
LEFT JOIN catalogo.colegios c ON c.id = pr.colegio_id
WHERE  pr.estado = 'pendiente'
ORDER  BY pr.creado_en;
```

---

## 7. Cambiar el precio del match

El precio se puede cambiar desde el panel de administración, que es la vía
recomendada porque también se encarga de crear el precio correspondiente en Stripe.

Desde SQL, la instrucción es:

```sql
SELECT app.fn_cambiar_tarifa(
  19.99,                          -- nuevo importe
  'Subida de precio septiembre'   -- motivo, queda registrado
);
```

La función cierra la tarifa anterior y abre la nueva en una sola operación, de
forma que nunca hay dos precios vigentes a la vez ni un hueco sin precio.

Para consultar el precio actual:

```sql
SELECT * FROM app.fn_tarifa_vigente('match');
```

Para ver el histórico completo de cambios:

```sql
SELECT importe, vigente_desde, vigente_hasta, motivo
FROM   app.tarifas
WHERE  concepto = 'match'
ORDER  BY vigente_desde DESC;
```

> **Importante.** Si cambias el precio por SQL, hay que crear también el `Price`
> correspondiente en Stripe y anotar su identificador en `stripe_price_id`. El
> panel lo hace automáticamente; por SQL, no. Es el motivo por el que se
> recomienda el panel para esta operación concreta.
>
> Los cobros ya realizados **no** se ven afectados: cada propuesta guarda el
> importe que se le aplicó en su momento.

---

## 8. Otros parámetros configurables

Además del precio, hay una serie de parámetros operativos en `app.configuracion`:

```sql
SELECT clave, valor, descripcion FROM app.configuracion ORDER BY clave;
```

Por ejemplo, para dar a los profesores 72 horas en lugar de 48 para responder:

```sql
UPDATE app.configuracion
SET    valor = '72'::jsonb, actualizado_en = NOW()
WHERE  clave = 'propuesta_horas_respuesta';
```

---

## 9. Precauciones al editar

El acceso es de lectura y escritura, así que conviene tener presentes unas cuantas
cosas.

**Consulta antes de modificar.** Ejecuta primero el `SELECT` con el mismo `WHERE`
que vas a usar en el `UPDATE`, y comprueba que devuelve exactamente las filas que
esperas.

**Envuelve en una transacción lo que no sea trivial.** Así puedes deshacerlo:

```sql
BEGIN;
UPDATE app.profesores SET estado = 'activo' WHERE id = '...';
-- comprobar el resultado
-- si está bien:  COMMIT;
-- si no:         ROLLBACK;
```

**No borres filas.** El modelo usa borrado lógico. Para dar de baja a alguien:

```sql
UPDATE app.perfiles SET eliminado_en = NOW() WHERE id = '...';
```

Un `DELETE` real rompería las referencias de propuestas y pagos, que son registros
contables.

**No toques `app.pagos` a mano.** Es la contabilidad y debe cuadrar con Stripe. Si
algo está mal, lo correcto es corregirlo en Stripe y dejar que el webhook lo
sincronice.

**Cuidado con `UPDATE` sin `WHERE`.** El clásico. En DBeaver se puede activar el
modo de confirmación para sentencias que afecten a muchas filas, en *Preferences →
Editors → SQL Editor*.

---

## 10. Consultar la auditoría

Todo cambio en profesores, propuestas, pagos, tarifas y reseñas queda registrado.

Cambios hechos a mano desde SQL en la última semana:

```sql
SELECT tabla, operacion, campos_afectados, usuario_bd, ocurrido_en
FROM   auditoria.cambios
WHERE  origen = 'sql_directo'
  AND  ocurrido_en > NOW() - INTERVAL '7 days'
ORDER  BY ocurrido_en DESC;
```

Historia completa de un registro concreto:

```sql
SELECT operacion, campos_afectados, datos_antes, datos_despues, ocurrido_en
FROM   auditoria.cambios
WHERE  tabla = 'app.propuestas'
  AND  registro_id = '<uuid>'
ORDER  BY ocurrido_en;
```

---

## 11. Copias de seguridad

Supabase hace copias diarias automáticas. Aun así, antes de cualquier operación
masiva conviene sacar una copia manual:

```bash
pg_dump "postgresql://academiavanza_lucia:<clave>@db.<ref>.supabase.co:5432/postgres" \
  --schema=app --schema=catalogo \
  --file=copia_$(date +%Y%m%d).sql
```

Y para exportar una tabla a Excel, DBeaver lo hace con clic derecho sobre el
resultado → *Export resultset* → *CSV* o *XLSX*.

---

## 12. Si algo va mal

**No puedo conectar.** Comprueba que el modo SSL está en `require`. Supabase
rechaza conexiones sin cifrar.

**Una consulta no devuelve nada y debería.** Comprueba que estás conectada como
`academiavanza_lucia` y no con otro usuario. Los demás roles están sujetos a
seguridad por fila y ven un subconjunto.

**He roto algo.** Si fue dentro de una transacción sin confirmar, `ROLLBACK`. Si ya
estaba confirmado, la tabla de auditoría guarda el valor anterior en
`datos_antes`, así que se puede reconstruir.
