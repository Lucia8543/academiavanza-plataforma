-- =============================================================================
-- AVISOS AL MÓVIL DEL PROFESOR
--
-- Un profesor que no sabe que tiene una solicitud es una familia esperando a
-- alguien que no va a contestar. Hasta ahora el aviso lo daba Lucía a mano.
--
-- A partir de aquí lo da el navegador. El profesor concede permiso una vez y su
-- navegador guarda una dirección de entrega —el `endpoint`— a la que se pueden
-- mandar avisos aunque tenga la web cerrada. Esa dirección es lo que se guarda
-- en esta tabla.
--
-- Un mismo profesor puede tener varias: el móvil, el portátil, el ordenador de
-- casa. Se avisa a todas, porque no hay forma de saber cuál está mirando.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app.suscripciones_push (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id  UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,

  -- Dirección que da el navegador. Es única en el mundo y es la que identifica
  -- al aparato: si el profesor vuelve a dar permiso desde el mismo navegador,
  -- llega la misma y se actualiza en vez de duplicarse.
  endpoint     TEXT NOT NULL UNIQUE,

  -- Claves con las que se cifra el aviso. Sin ellas el navegador lo descarta.
  -- No son secretos nuestros: las genera el navegador del profesor.
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,

  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usado_en     TIMESTAMPTZ,

  -- Cuando el servicio de notificaciones responde que esa dirección ya no
  -- existe —móvil formateado, permiso retirado— se apunta aquí y se deja de
  -- intentar. Se guarda en vez de borrarse para poder saber por qué un profesor
  -- dejó de recibir avisos.
  fallo_en     TIMESTAMPTZ,
  motivo_fallo TEXT
);

COMMENT ON TABLE app.suscripciones_push IS
  'Aparatos a los que se avisa cuando una familia escribe. Uno por navegador.';

CREATE INDEX IF NOT EXISTS idx_push_profesor
  ON app.suscripciones_push (profesor_id)
  WHERE fallo_en IS NULL;


-- -----------------------------------------------------------------------------
-- Cómo se enteró el profesor
--
-- Se apunta en la propia solicitud para poder responder a la pregunta que
-- importa cuando algo va mal: «¿se enteró?». Sin esto, una solicitud parada
-- puede ser un profesor que no quiere contestar o un aviso que nunca salió, y
-- son dos problemas distintos.
-- -----------------------------------------------------------------------------
ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS avisado_push   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avisado_correo BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN app.contactos.avisado_push IS
  'Al menos un aparato del profesor recibió el aviso.';
COMMENT ON COLUMN app.contactos.avisado_correo IS
  'Salió el correo de red, porque el aviso al móvil no pudo entregarse.';

COMMIT;
