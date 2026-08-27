-- =============================================================================
-- «PUEDO IR MÁS LEJOS SI COMPENSA»
--
-- La zona de un profesor se guardaba como si fuera un límite, y no lo es: un
-- profesor de Chamberí puede cruzarse Madrid hasta Las Rozas si son dos horas
-- seguidas o si el horario le cuadra. Ha pasado.
--
-- El daño no estaba en el filtro —no hay filtro por zona— sino en la lectura.
-- Una familia de Las Rozas leía «se desplaza a Chamberí» y se descartaba sola,
-- sin escribir. El profesor no se enteraba nunca de que la habría cogido, y la
-- familia se quedaba sin un profesor que le servía.
--
-- Con esta casilla, la zona pasa a ser lo habitual y no la frontera.
-- =============================================================================

BEGIN;

ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS desplazamiento_flexible BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN app.profesores.desplazamiento_flexible IS
  'Está dispuesto a salir de su zona habitual si el horario o la duración compensan.';

COMMIT;
