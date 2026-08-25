# Importación de datos históricos

Guiones para cargar el Excel histórico de AcademiAvanza en la base de datos nueva.

Ver el análisis completo en
[`docs/05-migracion/informe-migracion.md`](../../docs/05-migracion/informe-migracion.md).

---

## ⚠️ Antes de nada

Los ficheros de origen contienen **datos personales de menores**. No se suben al
repositorio bajo ningún concepto, ni siquiera siendo privado.

Se colocan en `database/etl/datos/`, que está excluido en `.gitignore`. Si alguna vez ves
un `.xlsx` en un `git status`, algo va mal.

---

## Cómo funciona

La carga tiene dos etapas separadas a propósito.

**Etapa 1 — Volcado.** El Excel entra tal cual en el esquema `legacy`, con todas las
columnas como texto. Sin validar nada. El objetivo es que la carga no pueda fallar
y que quede constancia exacta de lo que había en el fichero original.

**Etapa 2 — Transformación.** Los datos de `legacy` se limpian, normalizan y se
escriben en `app`. Lo que no se puede mapear queda marcado en la columna
`incidencias`, nunca se descarta en silencio.

La ventaja de separarlas es que la carga es **repetible**: si aparece un error de
mapeo, se corrige la transformación y se vuelve a ejecutar sin tocar el Excel.

```
   Excel  ──▶  legacy.*  ──▶  app.*  ──▶  invitación  ──▶  perfil validado
             (crudo)      (limpio)         (email)         (visible)
```

---

## Orden de ejecución

```bash
# 0. Colocar los ficheros
#    database/etl/datos/profes.xlsx
#    database/etl/datos/padres.xlsx
#    database/etl/datos/clases.xlsx

pnpm etl:volcado           # Excel → legacy
pnpm etl:analizar          # informe de calidad y valores distintos
                           #   ⚠️ revisar la salida antes de seguir
pnpm etl:catalogos         # normalizar colegios, asignaturas, niveles
pnpm etl:transformar       # legacy → app
pnpm etl:verificar         # comprobaciones de integridad
pnpm etl:invitar --lote=10 # enviar invitaciones, en tandas pequeñas
```

El paso de análisis no es opcional. Es donde se ve qué variantes de texto libre hay
realmente en las columnas de colegio, asignatura y curso, y sin esa información la
normalización es adivinar.

---

## Guiones

| Guion | Qué hace |
|---|---|
| `01-volcado.ts` | Lee los Excel y los vuelca literalmente en `legacy.*` |
| `02-analizar.ts` | Informe de calidad: filas, vacíos, duplicados, valores distintos |
| `03-catalogos.ts` | Construye las equivalencias de texto libre → catálogo |
| `04-transformar.ts` | Crea los registros en `app.*` en estado sin validar |
| `05-verificar.ts` | Comprobaciones de integridad post-carga |
| `06-invitar.ts` | Genera tokens y envía los correos de reclamación |

---

## Reglas de transformación

| Situación | Qué se hace |
|---|---|
| Email vacío o mal formado | No se migra: sin email no hay forma de invitar |
| Email duplicado | Se conserva el más reciente; el resto se marca |
| Colegio no reconocido | A `colegio_otro` y marcado para revisión |
| Nota ilegible | Se deja a `NULL`; se pedirá al validar |
| Titulación no separable | Íntegra a `otros_estudios` y marcada |
| Fila sin nombre | No se migra |

Ninguna fila desaparece sin dejar rastro: todas conservan su registro en `legacy`
con el motivo en `incidencias`.

---

## Qué NO se migra

Y no por olvido, sino por decisión:

- **Disponibilidad horaria** — caduca. Los horarios de un universitario cambian
  cada cuatrimestre.
- **Horas semanales y fecha de inicio deseada** — describen una situación ya
  cerrada.
- **Teléfono de Bizum del profesor** — la plataforma ya no intermedia pagos, así
  que ese dato no tiene finalidad legítima. Se elimina.
- **Asignaturas solicitadas por las familias** — necesidad de un curso concreto, ya
  pasada.
- **Direcciones postales completas** — se reducen a zona.
- **Comentarios libres de las familias** — fragmentos de conversación sin contexto.

El histórico de clases tampoco se migra registro a registro: sólo se calcula el
total por profesor y se guarda en `profesores.clases_historicas`.

---

## Comprobaciones tras la carga

```sql
-- Resumen de lo cargado
SELECT * FROM legacy.cargas ORDER BY ejecutado_en DESC;

-- Filas que necesitan revisión manual
SELECT id, nombre_apellidos, email, incidencias
FROM   legacy.profes_raw
WHERE  requiere_revision
ORDER  BY id;

-- Colegios que no encajaron en el catálogo
SELECT DISTINCT colegio_otro, COUNT(*)
FROM   app.profesores
WHERE  colegio_otro IS NOT NULL
GROUP  BY colegio_otro
ORDER  BY COUNT(*) DESC;

-- Estado de las invitaciones
SELECT * FROM app.gestion_pendientes_validacion;
```

---

## Marcha atrás

Mientras nadie haya reclamado su perfil, la carga se puede deshacer por completo:

```sql
BEGIN;

DELETE FROM app.perfiles
WHERE origen = 'migracion'
  AND datos_validados = FALSE;

TRUNCATE legacy.profes_raw, legacy.padres_raw, legacy.clases_raw, legacy.cargas
  RESTART IDENTITY CASCADE;

COMMIT;
```

En cuanto haya perfiles reclamados, esto deja de ser seguro: borraría cuentas
reales. A partir de ese punto la marcha atrás es selectiva.
