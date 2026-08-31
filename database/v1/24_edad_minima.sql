-- =============================================================================
-- 24 · La edad mínima deja de ser sólo una promesa
-- =============================================================================
--
-- La política de privacidad dice, desde que se reescribió el apartado de
-- menores, que para publicar ficha hay que tener catorce años cumplidos, y lo
-- razona con el artículo 7 de la LOPDGDD. Pero el formulario no lo preguntaba en
-- ningún sitio, así que no había nada en la base de datos que sostuviera ese
-- consentimiento. La política prometía y el sistema no cumplía.
--
-- No es un detalle de forma. Parte de los profesores del directorio son
-- estudiantes de último curso de instituto, y catorce años es exactamente la
-- frontera a partir de la cual alguien puede consentir por sí mismo sobre sus
-- propios datos. Por debajo, el consentimiento tendría que darlo quien le
-- tutela, y no lo hemos pedido.
--
-- Se guarda la declaración y su fecha, igual que `acepta_publicacion`. Un
-- consentimiento sin fecha no acredita nada, porque no se puede saber contra qué
-- versión de la política se dio.
--
-- LAS FICHAS QUE YA ESTÁN. Entran con `false`, que es la verdad: no lo
-- declararon porque nunca se les preguntó. El CHECK sólo mira las que se
-- publican a partir de ahora, para no dejar fuera de golpe a quien ya está
-- dentro. A ésos hay que preguntarles, y eso no lo arregla una migración.
-- =============================================================================

BEGIN;

ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS declara_edad_minima BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declara_edad_minima_en TIMESTAMPTZ;

COMMENT ON COLUMN app.profesores.declara_edad_minima IS
  'Declaró tener 14 años cumplidos al publicar la ficha. En falso para las '
  'fichas anteriores a que se preguntara: a ésas hay que preguntarles aparte.';

-- La fecha y la declaración van juntas o no van. Sin fecha no se sabe contra
-- qué versión de la política se declaró, y entonces la declaración no acredita.
ALTER TABLE app.profesores
  DROP CONSTRAINT IF EXISTS prof_edad_con_fecha;

ALTER TABLE app.profesores
  ADD CONSTRAINT prof_edad_con_fecha CHECK (
    declara_edad_minima = false OR declara_edad_minima_en IS NOT NULL
  );

COMMIT;

-- Para saber a quién hay que preguntarle. Devuelve las fichas publicadas antes
-- de que existiera la pregunta.
--
--   SELECT nombre, apellidos, email, creado_en
--     FROM app.profesores
--    WHERE declara_edad_minima = false AND estado = 'activo'
--    ORDER BY creado_en;
