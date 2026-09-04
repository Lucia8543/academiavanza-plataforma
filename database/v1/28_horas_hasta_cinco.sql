-- =============================================================================
-- 28 · Las horas por semana llegan hasta «5 o más»
-- =============================================================================
--
-- La migración 27 dejó como tope «mas-de-3», y ese valor tapa lo mismo tres
-- horas y media que ocho. Para casi todo daba igual, hasta que apareció el caso
-- que lo rompe: una madre con dos hijos, tres horas para una y dos para el
-- otro. Cinco horas a la semana no es «más de tres», es un encargo del doble de
-- tamaño, y es exactamente la diferencia que decide si a un profesor con la
-- tarde medio llena le cabe o no.
--
-- POR QUÉ NO SE BORRA `mas-de-3`
--
-- Porque hay filas guardadas con ese valor y **una restricción CHECK se aplica
-- a lo que ya está**, no sólo a lo que entra. Quitarlo de la lista haría que la
-- migración fallase al aplicarse, o peor, que dejara la tabla con filas que
-- violan su propia regla.
--
-- Así que se queda como valor histórico: la base de datos lo acepta, el
-- formulario ya no lo ofrece y `horasEnPalabras` sigue sabiendo decirlo. Es la
-- diferencia entre un vocabulario que crece y uno que se reescribe rompiendo lo
-- de detrás.
-- =============================================================================

ALTER TABLE app.contactos
  DROP CONSTRAINT IF EXISTS contacto_horas_semana_valida;

ALTER TABLE app.contactos
  ADD CONSTRAINT contacto_horas_semana_valida
  CHECK (
    horas_semana IS NULL
    OR horas_semana IN (
      '1', '2', '3', '4', '5-o-mas', 'no-lo-se',
      -- Sólo para las filas anteriores a esta migración. El formulario ya no lo
      -- ofrece; si algún día no queda ninguna, se puede quitar de aquí.
      'mas-de-3'
    )
  );

COMMENT ON COLUMN app.contactos.horas_semana IS
  'Horas de clase por semana que estima la familia. Nulo si no contestó; '
  '«no-lo-se» si contestó que todavía no lo sabe. No son lo mismo. '
  '«mas-de-3» es histórico, de antes de que la lista llegara hasta cinco.';
