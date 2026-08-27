-- =============================================================================
-- AVISO DE QUE UN VALE VA A CADUCAR
--
-- Un vale vive dentro de su solicitud, y las solicitudes se borran a los
-- noventa días. Así que un vale tiene fecha de caducidad aunque en ningún sitio
-- se diga, y hasta ahora desaparecía en silencio: la familia entraba a usarlo
-- tres meses después y se encontraba su página vacía.
--
-- Esta columna es lo que evita mandarle el aviso todos los días durante los
-- diez últimos.
-- =============================================================================

BEGIN;

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS aviso_vale_caduca_en TIMESTAMPTZ;

COMMENT ON COLUMN app.contactos.aviso_vale_caduca_en IS
  'Cuándo se avisó a la familia de que su vale estaba a punto de caducar. Null si aún no se le ha avisado.';

-- Por aquí entra la tarea diaria que busca vales a punto de caducar.
CREATE INDEX IF NOT EXISTS idx_contactos_vale_vivo
  ON app.contactos (enviado_en)
  WHERE vale_concedido AND aviso_vale_caduca_en IS NULL;

COMMIT;
