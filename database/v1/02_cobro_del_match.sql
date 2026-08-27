-- =============================================================================
-- COBRO DEL MATCH
--
-- Hasta ahora, una familia rellenaba el formulario y su teléfono salía derecho
-- hacia el profesor. A partir de aquí el recorrido tiene tres paradas:
--
--   1. La familia escribe.            estado = 'pendiente_profesor'
--   2. El profesor acepta o rechaza.  estado = 'aceptada' | 'rechazada'
--   3. La familia paga por Bizum y
--      Lucía lo confirma.             estado = 'pagada'
--
-- Los teléfonos —el de la familia y el del profesor— sólo se enseñan en el
-- paso 3. Antes de eso, el profesor decide con lo que de verdad necesita para
-- decidir: curso, asignatura, horario y lo que la familia le cuente.
--
-- Este fichero es una migración: se ejecuta UNA VEZ sobre la base de datos que
-- ya existe. No sustituye a 01_esquema.sql, se aplica encima.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1 · En qué punto está cada solicitud
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t
                 JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE t.typname = 'estado_solicitud' AND n.nspname = 'app') THEN
    CREATE TYPE app.estado_solicitud AS ENUM (
      'pendiente_profesor',  -- esperando a que el profesor diga sí o no
      'aceptada',            -- ha dicho que sí; falta el pago
      'pagada',              -- Lucía ha confirmado el Bizum: teléfonos abiertos
      'rechazada',           -- el profesor ha dicho que no; nadie paga nada
      'caducada'             -- nadie hizo nada en 30 días
    );
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 2 · El teléfono del profesor
--
-- Hasta ahora no se pedía a propósito. Ahora hace falta, porque es lo que
-- recibe la familia cuando paga. No se publica en ninguna ficha y no sale del
-- servidor salvo en ese momento.
--
-- La restricción exige tenerlo sólo para las fichas publicadas: una ficha sin
-- teléfono no puede llegar al final del recorrido, así que no debe estar en el
-- directorio. Antes de crearla se rellenan las fichas de prueba, que se dieron
-- de alta cuando el campo no existía.
-- -----------------------------------------------------------------------------
ALTER TABLE app.profesores ADD COLUMN IF NOT EXISTS telefono TEXT;

COMMENT ON COLUMN app.profesores.telefono IS
  'Privado. Sólo se muestra a una familia que ha pagado el match. Nunca en el directorio.';

UPDATE app.profesores
   SET telefono = '600000000'
 WHERE telefono IS NULL
   AND email LIKE '%@ejemplo.invalid';

-- Cualquier otra ficha ya publicada sin teléfono se pausa en vez de romper la
-- migración: es preferible que su titular lo añada a que aparezca en un
-- recorrido que no puede terminar.
UPDATE app.profesores
   SET estado = 'pendiente'
 WHERE telefono IS NULL
   AND estado = 'activo';

ALTER TABLE app.profesores DROP CONSTRAINT IF EXISTS prof_activo_exige_telefono;
ALTER TABLE app.profesores ADD CONSTRAINT prof_activo_exige_telefono
  CHECK (estado <> 'activo' OR telefono IS NOT NULL);


-- -----------------------------------------------------------------------------
-- 3 · La solicitud
--
-- Tres identificadores distintos para tres usos distintos, y es deliberado:
--
--   codigo          Corto y legible. Es lo que la familia escribe en el
--                   concepto del Bizum y lo que Lucía teclea en el panel.
--                   Como es corto, es adivinable, y por eso NO abre nada por
--                   sí solo.
--
--   token_familia   Largo. Es la dirección de la página donde la familia
--                   consulta cómo va lo suyo. Sin correo de por medio, esa
--                   dirección es lo único que tiene, así que tiene que ser
--                   imposible de adivinar.
--
--   token_profesor  Largo. El enlace donde el profesor acepta o rechaza. Hoy
--                   se lo pasa Lucía a mano; el día que el correo funcione,
--                   se envía solo sin cambiar nada de esto.
-- -----------------------------------------------------------------------------
ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS estado         app.estado_solicitud,
  ADD COLUMN IF NOT EXISTS codigo         TEXT,
  ADD COLUMN IF NOT EXISTS token_familia  TEXT,
  ADD COLUMN IF NOT EXISTS token_profesor TEXT,
  ADD COLUMN IF NOT EXISTS aceptada_en    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rechazada_en   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pagada_en      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
  ADD COLUMN IF NOT EXISTS importe        NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS vale_concedido BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vale_de        UUID REFERENCES app.contactos(id);

COMMENT ON COLUMN app.contactos.codigo IS
  'Código del concepto del Bizum. Corto y por tanto adivinable: no da acceso a nada por sí solo.';
COMMENT ON COLUMN app.contactos.token_familia IS
  'Dirección privada de seguimiento. Sin correo, es lo único que tiene la familia.';
COMMENT ON COLUMN app.contactos.importe IS
  'Lo que costaba el match cuando se creó la solicitud. Se congela: cambiar la tarifa no reescribe el pasado.';
COMMENT ON COLUMN app.contactos.vale_concedido IS
  'La familia quedó descontenta y tiene derecho a un segundo match sin pagar.';
COMMENT ON COLUMN app.contactos.vale_de IS
  'Esta solicitud se creó gastando el vale de otra anterior.';

-- Las solicitudes que ya existieran son de antes de que hubiera cobro. Se
-- marcan como pagadas para que sigan funcionando como funcionaban: ninguna
-- familia debe encontrarse de pronto con que le piden dinero por algo que ya
-- había hecho.
UPDATE app.contactos
   SET estado         = COALESCE(estado, 'pagada'),
       pagada_en      = COALESCE(pagada_en, enviado_en),
       importe        = COALESCE(importe, 0),
       codigo         = COALESCE(codigo, UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5))),
       token_familia  = COALESCE(token_familia, MD5(RANDOM()::TEXT || id::TEXT)),
       token_profesor = COALESCE(token_profesor, MD5(RANDOM()::TEXT || id::TEXT || 'p'))
 WHERE estado IS NULL;

ALTER TABLE app.contactos
  ALTER COLUMN estado         SET NOT NULL,
  ALTER COLUMN estado         SET DEFAULT 'pendiente_profesor',
  ALTER COLUMN codigo         SET NOT NULL,
  ALTER COLUMN token_familia  SET NOT NULL,
  ALTER COLUMN token_profesor SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contacto_codigo_unico    ON app.contactos (codigo);
CREATE UNIQUE INDEX IF NOT EXISTS contacto_token_fam_unico ON app.contactos (token_familia);
CREATE UNIQUE INDEX IF NOT EXISTS contacto_token_pro_unico ON app.contactos (token_profesor);

-- El panel entra por aquí: solicitudes esperando algo, las más antiguas
-- primero.
CREATE INDEX IF NOT EXISTS idx_contactos_estado
  ON app.contactos (estado, enviado_en);

-- Coherencia entre el estado y sus fechas. Sin esto, un error de programación
-- podría dejar una solicitud «pagada» sin fecha de pago, y esa fila sería
-- imposible de auditar después.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_fechas_coherentes;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_fechas_coherentes CHECK (
      (estado <> 'aceptada'  OR aceptada_en  IS NOT NULL)
  AND (estado <> 'rechazada' OR rechazada_en IS NOT NULL)
  AND (estado <> 'pagada'    OR pagada_en    IS NOT NULL)
);

-- El curso pasa a ser obligatorio: es lo primero que pregunta un profesor
-- antes de aceptar, y ahora tiene que decidir sin hablar con nadie.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_exige_nivel;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_exige_nivel
  CHECK (nivel_id IS NOT NULL OR estado = 'pagada');


-- -----------------------------------------------------------------------------
-- 4 · El precio
--
-- No es una constante del código: vive aquí y se cambia desde el panel. La fila
-- vigente es la que no tiene fecha de fin. Cambiar el precio es cerrar la
-- vigente y abrir otra, nunca editar la que hay: así queda el rastro de lo que
-- costaba cada cosa en cada momento.
-- -----------------------------------------------------------------------------
UPDATE app.tarifas
   SET vigente_hasta = NOW()
 WHERE concepto = 'match' AND vigente_hasta IS NULL;

INSERT INTO app.tarifas (concepto, importe, moneda, motivo)
VALUES ('match', 10.00, 'EUR', 'Precio de salida del cobro por match');

COMMIT;
