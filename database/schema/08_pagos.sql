-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 08: Pagos
-- =============================================================================
-- IMPORTANTE — Alcance de esta tabla:
--
-- Aquí sólo se registran los cobros que hace la PLATAFORMA a las FAMILIAS por
-- el servicio de intermediación (la tarifa de match).
--
-- Los pagos por las clases entre familia y profesor quedan FUERA del sistema:
-- se acuerdan y liquidan directamente entre ellos por Bizum o transferencia.
-- La plataforma no los registra, no los intermedia y no los conoce. Es una
-- decisión deliberada de producto y elimina la carga de intermediario de pagos.
-- =============================================================================

CREATE TABLE app.pagos (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  propuesta_id              UUID NOT NULL REFERENCES app.propuestas(id) ON DELETE RESTRICT,
  familia_id                UUID NOT NULL REFERENCES app.familias(id)   ON DELETE RESTRICT,

  importe                   NUMERIC(8,2) NOT NULL,
  moneda                    CHAR(3) NOT NULL DEFAULT 'EUR',
  estado                    app.estado_pago NOT NULL DEFAULT 'pendiente',

  -- Identificadores de Stripe. La sesión de Checkout es única por intento.
  stripe_checkout_id        TEXT UNIQUE,
  stripe_payment_intent_id  TEXT UNIQUE,
  stripe_charge_id          TEXT,
  metodo_pago               TEXT,          -- 'card', 'bizum', 'sepa_debit'

  -- Reembolsos
  reembolsado_en            TIMESTAMPTZ,
  importe_reembolsado       NUMERIC(8,2),
  motivo_reembolso          TEXT,

  -- Facturación
  numero_factura            TEXT UNIQUE,
  factura_url               TEXT,

  error_mensaje             TEXT,

  pagado_en                 TIMESTAMPTZ,
  creado_en                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pago_importe_positivo
    CHECK (importe >= 0),
  CONSTRAINT pago_completado_coherente
    CHECK (estado <> 'completado' OR (pagado_en IS NOT NULL AND stripe_payment_intent_id IS NOT NULL)),
  CONSTRAINT pago_reembolso_coherente
    CHECK (estado <> 'reembolsado' OR (reembolsado_en IS NOT NULL AND importe_reembolsado IS NOT NULL)),
  CONSTRAINT pago_reembolso_no_excede
    CHECK (importe_reembolsado IS NULL OR importe_reembolsado <= importe)
);

COMMENT ON TABLE app.pagos IS
  'Cobros de la plataforma a las familias por la tarifa de match. NO incluye pagos por clases.';
COMMENT ON COLUMN app.pagos.metodo_pago IS
  'Bizum está disponible en Stripe España como método de pago nativo.';

CREATE INDEX idx_pagos_propuesta ON app.pagos (propuesta_id);
CREATE INDEX idx_pagos_familia   ON app.pagos (familia_id, creado_en DESC);
CREATE INDEX idx_pagos_estado    ON app.pagos (estado, creado_en DESC);
CREATE INDEX idx_pagos_periodo   ON app.pagos (pagado_en) WHERE estado = 'completado';

CREATE TRIGGER trg_pagos_touch
  BEFORE UPDATE ON app.pagos
  FOR EACH ROW EXECUTE FUNCTION app.fn_touch_actualizado_en();


-- -----------------------------------------------------------------------------
-- Idempotencia de webhooks de Stripe
--
-- Stripe reenvía los eventos si no recibe un 200 a tiempo. Sin control de
-- idempotencia, un reintento revelaría el contacto dos veces o duplicaría el
-- registro contable. Esta tabla garantiza que cada evento se procesa una vez.
-- -----------------------------------------------------------------------------
CREATE TABLE app.stripe_eventos (
  id                  TEXT PRIMARY KEY,           -- 'evt_1A2b3C...' de Stripe
  tipo                TEXT NOT NULL,
  procesado           BOOLEAN NOT NULL DEFAULT FALSE,
  procesado_en        TIMESTAMPTZ,
  intentos            SMALLINT NOT NULL DEFAULT 0,
  error_mensaje       TEXT,
  payload             JSONB NOT NULL,

  recibido_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app.stripe_eventos IS
  'Control de idempotencia de webhooks. Stripe reenvía eventos; cada uno se procesa una sola vez.';

CREATE INDEX idx_stripe_eventos_pendientes ON app.stripe_eventos (recibido_en)
       WHERE NOT procesado;
