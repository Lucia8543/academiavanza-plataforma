-- =============================================================================
-- TRES ESTADOS DE DISPONIBILIDAD EN VEZ DE DOS
--
-- Hasta ahora la disponibilidad era un interruptor: o estás en el directorio o
-- no estás. No había sitio para lo que de verdad pasa a mitad de curso, que es
-- «voy lleno, pero si me encaja mucho el horario, quizá».
--
-- El profesor sin sitio podía rechazar, sí. Pero cada rechazo le cuesta
-- atención a él y dos días de espera a una familia que mientras tanto no ha
-- escrito a nadie más. Con un estado intermedio, la familia lo sabe antes de
-- decidir a quién escribe.
--
-- La columna `disponible` se queda como está y sigue mandando: quien la tiene
-- en falso no aparece, sea cual sea el cupo. Esto sólo matiza a los que sí
-- aparecen.
-- =============================================================================

BEGIN;

ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS cupo TEXT NOT NULL DEFAULT 'busca';

COMMENT ON COLUMN app.profesores.cupo IS
  'busca = quiere alumnos; justo = solo si encaja mucho. Quien no puede nada pone disponible en falso.';

ALTER TABLE app.profesores DROP CONSTRAINT IF EXISTS prof_cupo_valido;
ALTER TABLE app.profesores ADD CONSTRAINT prof_cupo_valido CHECK (
  cupo IN ('busca', 'justo')
);

-- El directorio ordena por esto: primero quien busca alumnos, después quien va
-- justo, y dentro de cada grupo al azar.
CREATE INDEX IF NOT EXISTS idx_profesores_cupo
  ON app.profesores (cupo)
  WHERE estado = 'activo' AND disponible;

COMMIT;
