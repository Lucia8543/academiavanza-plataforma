-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 06: Tarifas y configuración de la plataforma
-- =============================================================================
-- Requisito de negocio: Lucía debe poder cambiar el precio del match cuando
-- quiera, desde el panel de administración, sin desplegar código.
--
-- Decisión de diseño: se modela como tabla de tarifas con vigencia temporal
-- (patrón "slowly changing dimension") en lugar de una columna que se
-- sobrescribe. Motivos:
--
--   · Un cobro pasado debe seguir mostrando el precio que se aplicó entonces.
--   · Permite programar una subida con antelación (vigente_desde futuro).
--   · Deja histórico auditable de quién cambió el precio y cuándo.
--   · Permite analizar el efecto de un cambio de precio sobre la conversión.
-- =============================================================================

CREATE TABLE app.tarifas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificador del concepto facturable. De momento sólo existe uno, pero
  -- deja la puerta abierta a suscripciones o packs sin rehacer el modelo.
  concepto            TEXT NOT NULL DEFAULT 'match',

  importe             NUMERIC(8,2) NOT NULL,
  moneda              CHAR(3) NOT NULL DEFAULT 'EUR',

  -- Vigencia. vigente_hasta NULL = tarifa actualmente en vigor.
  vigente_desde       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vigente_hasta       TIMESTAMPTZ,

  -- Identificadores de Stripe. Al cambiar el importe se crea un Price nuevo en
  -- Stripe (los Price son inmutables) y se guarda aquí su id.
  stripe_price_id     TEXT,
  stripe_product_id   TEXT,

  -- Trazabilidad del cambio
  motivo              TEXT,
  creado_por          UUID REFERENCES app.perfiles(id),
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tarifa_importe_valido  CHECK (importe >= 0),
  CONSTRAINT tarifa_moneda_valida   CHECK (moneda ~ '^[A-Z]{3}$'),
  CONSTRAINT tarifa_vigencia_valida CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde)
);

COMMENT ON TABLE  app.tarifas IS
  'Histórico de precios con vigencia. Editable desde el panel de administración.';
COMMENT ON COLUMN app.tarifas.vigente_hasta IS
  'NULL indica la tarifa en vigor. Sólo puede haber una por concepto (ver índice único).';

-- Sólo puede haber una tarifa vigente por concepto en cada momento.
-- Es la restricción que impide dejar el sistema en estado ambiguo.
CREATE UNIQUE INDEX idx_tarifa_vigente_unica
    ON app.tarifas (concepto)
    WHERE vigente_hasta IS NULL;

CREATE INDEX idx_tarifas_concepto_periodo ON app.tarifas (concepto, vigente_desde DESC);


-- -----------------------------------------------------------------------------
-- Consulta de la tarifa en vigor
-- La aplicación llama a esta función; nunca lee la tabla directamente.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.fn_tarifa_vigente(p_concepto TEXT DEFAULT 'match')
RETURNS TABLE (
  tarifa_id       UUID,
  importe         NUMERIC(8,2),
  moneda          CHAR(3),
  stripe_price_id TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT t.id, t.importe, t.moneda, t.stripe_price_id
  FROM   app.tarifas t
  WHERE  t.concepto      = p_concepto
    AND  t.vigente_desde <= NOW()
    AND  (t.vigente_hasta IS NULL OR t.vigente_hasta > NOW())
  ORDER BY t.vigente_desde DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION app.fn_tarifa_vigente IS
  'Devuelve la tarifa aplicable en este instante. Punto único de consulta de precios.';


-- -----------------------------------------------------------------------------
-- Cambio de tarifa
-- Cierra la vigente y abre la nueva en una sola transacción, garantizando que
-- nunca hay dos tarifas vivas ni un hueco sin tarifa.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.fn_cambiar_tarifa(
  p_importe           NUMERIC,
  p_motivo            TEXT DEFAULT NULL,
  p_stripe_price_id   TEXT DEFAULT NULL,
  p_concepto          TEXT DEFAULT 'match',
  p_actor             UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nueva_id UUID;
  v_ahora    TIMESTAMPTZ := NOW();
BEGIN
  IF p_importe < 0 THEN
    RAISE EXCEPTION 'El importe no puede ser negativo (recibido: %)', p_importe;
  END IF;

  -- Cierra la tarifa actualmente en vigor.
  UPDATE app.tarifas
     SET vigente_hasta = v_ahora
   WHERE concepto      = p_concepto
     AND vigente_hasta IS NULL;

  -- Abre la nueva.
  INSERT INTO app.tarifas (concepto, importe, vigente_desde, stripe_price_id, motivo, creado_por)
  VALUES (p_concepto, p_importe, v_ahora, p_stripe_price_id, p_motivo, p_actor)
  RETURNING id INTO v_nueva_id;

  RETURN v_nueva_id;
END;
$$;

COMMENT ON FUNCTION app.fn_cambiar_tarifa IS
  'Cambia el precio de forma atómica. Uso: SELECT app.fn_cambiar_tarifa(19.99, ''Subida temporada alta'');';


-- =============================================================================
-- CONFIGURACIÓN GENERAL
-- Parámetros operativos que Lucía puede ajustar sin desplegar.
-- =============================================================================

CREATE TABLE app.configuracion (
  clave           TEXT PRIMARY KEY,
  valor           JSONB NOT NULL,
  tipo            TEXT NOT NULL,        -- 'numero' | 'texto' | 'booleano' | 'json'
  descripcion     TEXT NOT NULL,
  editable_ui     BOOLEAN NOT NULL DEFAULT TRUE,

  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por UUID REFERENCES app.perfiles(id),

  CONSTRAINT config_tipo_valido
    CHECK (tipo IN ('numero','texto','booleano','json'))
);

COMMENT ON TABLE  app.configuracion IS
  'Parámetros operativos editables desde el panel, sin necesidad de desplegar código.';
COMMENT ON COLUMN app.configuracion.editable_ui IS
  'FALSE para parámetros técnicos que no deben tocarse desde la interfaz.';

INSERT INTO app.configuracion (clave, valor, tipo, descripcion) VALUES
  ('propuesta_horas_respuesta',      '48'::jsonb,    'numero',
   'Horas que tiene el profesor para responder antes de que la propuesta caduque'),

  ('propuesta_horas_pago',           '72'::jsonb,    'numero',
   'Horas que tiene la familia para pagar tras la aceptación del profesor'),

  ('profesor_max_propuestas',        '5'::jsonb,     'numero',
   'Propuestas simultáneas en estado enviada/aceptada que puede tener un profesor'),

  ('familia_max_propuestas_activas', '3'::jsonb,     'numero',
   'Propuestas simultáneas que puede tener abiertas una familia'),

  ('resenas_moderacion_previa',      'true'::jsonb,  'booleano',
   'Si es true, las reseñas requieren aprobación antes de publicarse'),

  ('directorio_orden_defecto',       '"valoracion"'::jsonb, 'texto',
   'Criterio de ordenación por defecto del directorio: valoracion | recientes | aleatorio'),

  ('notificaciones_whatsapp_activas','true'::jsonb,  'booleano',
   'Interruptor general de envío de WhatsApp. Permite desactivarlo sin desplegar');
