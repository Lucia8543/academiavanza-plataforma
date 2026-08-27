-- =============================================================================
-- AÑOS DANDO CLASE
--
-- La señal de confianza más barata que existe y la única que las plataformas
-- grandes enseñan y aquí faltaba. «Tres años dando clase» dice más que
-- cualquier adjetivo, y a diferencia de una valoración de alumnos no hay que
-- moderarla ni se puede falsificar contra nadie.
--
-- Lo declara el profesor, como todo lo demás de su ficha. No se comprueba, y
-- por eso en la ficha se dice de dónde sale el dato.
-- =============================================================================

BEGIN;

ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS anos_experiencia SMALLINT;

COMMENT ON COLUMN app.profesores.anos_experiencia IS
  'Años dando clases particulares, declarados por el propio profesor. Null si no lo dijo.';

-- Cero es una respuesta válida —empieza ahora— pero cuarenta no lo es en gente
-- que acaba de terminar el colegio. El tope alto deja sitio a un profesor
-- veterano sin dejar pasar una errata de tres cifras.
ALTER TABLE app.profesores DROP CONSTRAINT IF EXISTS prof_experiencia_valida;
ALTER TABLE app.profesores ADD CONSTRAINT prof_experiencia_valida CHECK (
  anos_experiencia IS NULL OR (anos_experiencia >= 0 AND anos_experiencia <= 50)
);

COMMIT;
