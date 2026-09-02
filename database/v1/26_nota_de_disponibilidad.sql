-- =============================================================================
-- NOTA DE DISPONIBILIDAD
--
-- La rejilla de horarios tiene tres franjas: mañana, tarde y noche. «Tarde»
-- son cuatro horas, de 16:00 a 20:00, y hay profesores cuya disponibilidad
-- real dentro de esa franja es de hora y media. La rejilla, entonces, no
-- miente pero dice bastante menos de lo que el profesor sabe, y la familia
-- lee cuatro horas donde hay noventa minutos.
--
-- El caso que lo destapó: una profesora con prácticas por las mañanas a
-- partir de octubre que sólo podía de 17:30 a 19:00, y que escribió pidiendo
-- avisar a la familia antes de que se comprometiera a nada. Tenía razón, y no
-- tenía dónde ponerlo.
--
-- Se resuelve con una línea de texto que escribe el propio profesor, y no
-- afinando la rejilla ni añadiendo fechas de validez a cada franja. El
-- razonamiento está en el ADR 0010. La idea corta: la rejilla sirve para
-- descartar, y para el matiz basta una frase.
--
-- El texto se publica en la ficha, así que pasa por el mismo filtro de datos
-- sensibles que los puntos fuertes. Un profesor que escriba aquí su teléfono
-- se estaría saltando el cobro del match sin querer.
-- =============================================================================

BEGIN;

ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS nota_disponibilidad TEXT;

COMMENT ON COLUMN app.profesores.nota_disponibilidad IS
  'Matiz de horario escrito por el profesor, por ejemplo «desde octubre sólo de 17:30 a 19:00». Complementa la rejilla, no la sustituye. Null si no dijo nada.';

-- Ciento veinte caracteres dan para una frase con un horario y un mes, que es
-- justo lo que se pide. Más largo se convertiría en una segunda presentación,
-- que ya existe y tiene su propio campo.
ALTER TABLE app.profesores DROP CONSTRAINT IF EXISTS prof_nota_disponibilidad_longitud;
ALTER TABLE app.profesores ADD CONSTRAINT prof_nota_disponibilidad_longitud CHECK (
  nota_disponibilidad IS NULL OR char_length(nota_disponibilidad) <= 120
);

COMMIT;
