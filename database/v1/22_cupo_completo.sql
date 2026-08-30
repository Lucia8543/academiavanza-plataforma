-- =============================================================================
-- 22 · El tercer estado de hueco
-- =============================================================================
--
-- La migración 11 creó `cupo` con una restricción que sólo admitía dos valores,
-- `busca` y `justo`. Al añadir el tercero, `completo`, el código lo mandaba y la
-- base de datos lo rechazaba, así que el alta entera fallaba con un «algo ha
-- fallado por nuestra parte». Sólo le pasaba a quien marcaba que no tenía hueco,
-- que es justo la gente a la que más nos costó convencer de que se registrara.
--
-- La restricción hizo bien su trabajo: impidió que entrara un valor que el
-- esquema no reconocía. El fallo fue no acordarse de ampliarla, y por eso este
-- fichero existe en lugar de haberla quitado. Sigue habiendo una lista cerrada.
-- =============================================================================

ALTER TABLE app.profesores DROP CONSTRAINT IF EXISTS prof_cupo_valido;

ALTER TABLE app.profesores ADD CONSTRAINT prof_cupo_valido CHECK (
  cupo IN ('busca', 'justo', 'completo')
);

COMMENT ON COLUMN app.profesores.cupo IS
  'Cuánto hueco le queda. busca: tiene sitio y sale primero. justo: le queda '
  'poco, sale después y con aviso. completo: no le cabe nadie, sigue publicado '
  'pero no se le puede escribir.';
