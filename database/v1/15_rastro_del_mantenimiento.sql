-- =============================================================================
-- QUE UN FALLO DEJE HUELLA
--
-- Todos los días corre un proceso que caduca solicitudes muertas, manda
-- recordatorios, borra datos de familias pasados noventa días y pausa fichas
-- sin confirmar. Si ese proceso deja de ejecutarse, no pasa nada visible: la web
-- sigue funcionando, las páginas cargan, nadie se queja. Simplemente los datos
-- de las familias dejan de borrarse y los profesores dejan de recibir avisos.
--
-- Hasta ahora, el único sitio donde constaba que algo había fallado era la
-- consola de Vercel. Con Lucía en Erasmus, eso equivale a que no conste en
-- ninguna parte: un proceso roto podía pasarse meses sin que nadie lo notara,
-- incumpliendo de paso lo que promete la política de privacidad.
--
-- Esta tabla es la caja negra. Cada ejecución deja una fila, y el panel enseña
-- un aviso si la última es demasiado antigua o si trae errores. No hay que ir a
-- buscarla: sale sola al entrar.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app.mantenimiento_ejecuciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ejecutado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Lo que hizo cada tarea, tal cual lo devuelve el proceso. En JSON y no en
  -- columnas porque la lista de tareas cambia cada pocas semanas, y no merece
  -- una migración cada vez que se añade una.
  resumen       JSONB       NOT NULL,
  -- Nombres de las tareas que reventaron. Vacío es lo normal y lo bueno.
  errores       TEXT[]      NOT NULL DEFAULT '{}',
  -- Cuánto tardó. Un proceso que empieza a tardar de más suele ser el aviso
  -- previo de uno que va a empezar a fallar por tiempo agotado.
  duracion_ms   INTEGER
);

COMMENT ON TABLE app.mantenimiento_ejecuciones IS
  'Caja negra del proceso diario. Sirve para saber que sigue vivo, no para auditar nada.';

-- La consulta que hace el panel es siempre la misma: la última. Con índice es
-- inmediata aunque la tabla acumule años.
CREATE INDEX IF NOT EXISTS idx_mantenimiento_ultima
  ON app.mantenimiento_ejecuciones (ejecutado_en DESC);


-- -----------------------------------------------------------------------------
-- FICHAS QUE SE HAN PAUSADO SOLAS
--
-- Cuando dos familias distintas dicen que no han conseguido hablar con un
-- profesor, su ficha se despublica automáticamente. Es lo correcto: cada familia
-- que le escriba a partir de ahí va a perder tiempo y dinero.
--
-- Pero desde fuera, esa ficha es idéntica a la de alguien que la pausó él mismo
-- porque tenía exámenes. Y no lo son en absoluto: al segundo no hay que
-- escribirle, y al primero sí, porque probablemente ni sabe que ha desaparecido.
--
-- Esta columna los distingue. Se pone al pausar solo y se borra en cuanto él
-- reactiva la ficha, así que tener fecha significa exactamente «está fuera del
-- directorio sin haberlo pedido».
-- -----------------------------------------------------------------------------

ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS pausada_auto_en TIMESTAMPTZ;

COMMENT ON COLUMN app.profesores.pausada_auto_en IS
  'Cuándo se despublicó la ficha por sí sola. NULL si está publicada o si la pausó su dueño.';

CREATE INDEX IF NOT EXISTS idx_profesores_pausadas_auto
  ON app.profesores (pausada_auto_en DESC)
  WHERE pausada_auto_en IS NOT NULL;

-- No se borra nada de aquí: una fila al día son trescientas sesenta y cinco al
-- año, que no es un problema de espacio en ninguna base de datos de este siglo.
-- Y el histórico completo es justo lo que hace falta el día que haya que
-- explicar por qué algo no se borró cuando tocaba.

-- Los permisos normalmente los hereda del esquema, porque hay unos
-- ALTER DEFAULT PRIVILEGES puestos para eso. Se conceden aquí igualmente por si
-- esta base de datos no los tiene, y sin romperse si los roles no existen.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academiavanza_app') THEN
    GRANT SELECT, INSERT ON app.mantenimiento_ejecuciones TO academiavanza_app;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academiavanza_lectura') THEN
    GRANT SELECT ON app.mantenimiento_ejecuciones TO academiavanza_lectura;
  END IF;
END
$$;

COMMIT;
