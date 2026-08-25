-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 06: Propuestas de contacto y matches
-- =============================================================================
-- Es el corazón del producto. Modela el flujo completo:
--
--   1. La familia encuentra un profesor y le envía una propuesta   → GRATIS
--   2. El profesor recibe la notificación y responde OK / NOK
--   3. Si responde OK, la familia paga la tarifa de match          → COBRO
--   4. Se revela el teléfono del profesor y ambos siguen por su cuenta
--
-- Decisión de diseño: una sola tabla `propuestas` con máquina de estados, en
-- lugar de dos tablas `propuestas` + `matches`. Motivo: el match no es una
-- entidad distinta, es un estado terminal de la propuesta. Separarlas obligaría
-- a mantener sincronía entre dos filas que describen el mismo hecho.
-- =============================================================================

CREATE TABLE app.propuestas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia legible para soporte y para los mensajes de WhatsApp: 'AV-2026-0147'
  referencia              TEXT NOT NULL UNIQUE,

  familia_id              UUID NOT NULL REFERENCES app.familias(id)   ON DELETE RESTRICT,
  alumno_id               UUID NOT NULL REFERENCES app.alumnos(id)    ON DELETE RESTRICT,
  necesidad_id            UUID          REFERENCES app.necesidades(id) ON DELETE SET NULL,
  profesor_id             UUID NOT NULL REFERENCES app.profesores(id) ON DELETE RESTRICT,

  estado                  app.estado_propuesta NOT NULL DEFAULT 'enviada',

  -- ---------------------------------------------------------------------------
  -- Instantánea de la solicitud
  -- Se congela lo que la familia pidió en el momento de enviar la propuesta.
  -- Si luego cambia la necesidad, la propuesta conserva su contexto original.
  -- ---------------------------------------------------------------------------
  mensaje_familia         TEXT,
  asignaturas_solicitadas TEXT[] NOT NULL DEFAULT '{}',
  nivel_solicitado        TEXT,
  modalidad_solicitada    app.modalidad,

  -- ---------------------------------------------------------------------------
  -- Respuesta del profesor
  -- ---------------------------------------------------------------------------
  respondida_en           TIMESTAMPTZ,
  motivo_rechazo          TEXT,
  mensaje_profesor        TEXT,

  -- Plazo de respuesta. Si se supera sin respuesta, un proceso programado
  -- pasa la propuesta a 'caducada' y avisa a la familia.
  responder_antes_de      TIMESTAMPTZ NOT NULL,

  -- ---------------------------------------------------------------------------
  -- Cobro y revelado de contacto
  --
  -- `tarifa_aplicada` es una instantánea del precio vigente cuando se cobró.
  -- Es imprescindible para contabilidad: si Lucía cambia el precio en el panel,
  -- los cobros pasados deben seguir reflejando lo que se cobró realmente.
  -- ---------------------------------------------------------------------------
  tarifa_id               UUID REFERENCES app.tarifas(id),
  tarifa_aplicada         NUMERIC(8,2),
  moneda                  CHAR(3) NOT NULL DEFAULT 'EUR',

  pagada_en               TIMESTAMPTZ,
  contacto_revelado_en    TIMESTAMPTZ,

  -- Plazo para pagar tras la aceptación del profesor. Vencido, pasa a
  -- 'caducada_pago' y se libera el hueco en la cuota del profesor.
  pagar_antes_de          TIMESTAMPTZ,

  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ---------------------------------------------------------------------------
  -- Coherencia de la máquina de estados
  -- ---------------------------------------------------------------------------
  CONSTRAINT prop_referencia_formato
    CHECK (referencia ~ '^AV-[0-9]{4}-[0-9]{4,}$'),

  -- Toda propuesta resuelta debe tener fecha de respuesta.
  CONSTRAINT prop_respuesta_coherente
    CHECK (estado NOT IN ('aceptada','rechazada','pagada') OR respondida_en IS NOT NULL),

  -- Un rechazo debe llevar motivo: alimenta las métricas de calidad del match.
  CONSTRAINT prop_rechazo_con_motivo
    CHECK (estado <> 'rechazada' OR motivo_rechazo IS NOT NULL),

  -- Una propuesta pagada debe tener importe, fecha de pago y tarifa asociada.
  CONSTRAINT prop_pago_coherente
    CHECK (
      estado <> 'pagada' OR (
        pagada_en       IS NOT NULL AND
        tarifa_aplicada IS NOT NULL AND
        tarifa_id       IS NOT NULL
      )
    ),

  -- El contacto sólo puede revelarse si se ha pagado. Es la regla de negocio
  -- que protege el ingreso, y se hace cumplir en la propia base de datos.
  CONSTRAINT prop_contacto_solo_si_pagada
    CHECK (contacto_revelado_en IS NULL OR estado = 'pagada'),

  CONSTRAINT prop_tarifa_no_negativa
    CHECK (tarifa_aplicada IS NULL OR tarifa_aplicada >= 0)
);

COMMENT ON TABLE  app.propuestas IS
  'Flujo completo de contacto familia→profesor. El match es el estado ''pagada''.';
COMMENT ON COLUMN app.propuestas.tarifa_aplicada IS
  'Instantánea del precio cobrado. No se recalcula nunca aunque cambie la tarifa vigente.';
COMMENT ON CONSTRAINT prop_contacto_solo_si_pagada ON app.propuestas IS
  'Garantía a nivel de base de datos de que el teléfono no se revela sin pago.';

CREATE INDEX idx_prop_familia    ON app.propuestas (familia_id, creado_en DESC);
CREATE INDEX idx_prop_profesor   ON app.propuestas (profesor_id, creado_en DESC);
CREATE INDEX idx_prop_estado     ON app.propuestas (estado, creado_en DESC);

-- Índices parciales para los procesos programados de caducidad.
CREATE INDEX idx_prop_pendientes_respuesta ON app.propuestas (responder_antes_de)
       WHERE estado = 'enviada';
CREATE INDEX idx_prop_pendientes_pago      ON app.propuestas (pagar_antes_de)
       WHERE estado = 'aceptada';

-- Una familia no puede tener dos propuestas vivas con el mismo profesor para el
-- mismo alumno. Evita duplicados por doble clic o por impaciencia.
CREATE UNIQUE INDEX idx_prop_sin_duplicados_vivos
    ON app.propuestas (familia_id, alumno_id, profesor_id)
    WHERE estado IN ('enviada', 'aceptada');

CREATE TRIGGER trg_propuestas_touch
  BEFORE UPDATE ON app.propuestas
  FOR EACH ROW EXECUTE FUNCTION app.fn_touch_actualizado_en();


-- -----------------------------------------------------------------------------
-- Historial de cambios de estado
-- Tabla de sólo-inserción. Permite reconstruir la vida completa de cualquier
-- propuesta y calcular tiempos de respuesta reales.
-- -----------------------------------------------------------------------------
CREATE TABLE app.propuesta_eventos (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  propuesta_id    UUID NOT NULL REFERENCES app.propuestas(id) ON DELETE CASCADE,

  estado_anterior app.estado_propuesta,
  estado_nuevo    app.estado_propuesta NOT NULL,
  actor_id        UUID REFERENCES app.perfiles(id),
  actor_tipo      TEXT NOT NULL DEFAULT 'usuario',  -- 'usuario' | 'sistema' | 'stripe'
  metadatos       JSONB NOT NULL DEFAULT '{}'::jsonb,

  ocurrido_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app.propuesta_eventos IS
  'Traza inmutable de transiciones de estado. Fuente de verdad para métricas de tiempo.';

CREATE INDEX idx_prop_eventos_propuesta ON app.propuesta_eventos (propuesta_id, ocurrido_en);


-- -----------------------------------------------------------------------------
-- Registro de cada cambio de estado mediante disparador
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.fn_registrar_evento_propuesta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO app.propuesta_eventos (propuesta_id, estado_anterior, estado_nuevo, actor_tipo)
    VALUES (NEW.id, NULL, NEW.estado, 'usuario');

  ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO app.propuesta_eventos (propuesta_id, estado_anterior, estado_nuevo, actor_tipo)
    VALUES (NEW.id, OLD.estado, NEW.estado, 'sistema');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_propuestas_evento
  AFTER INSERT OR UPDATE OF estado ON app.propuestas
  FOR EACH ROW EXECUTE FUNCTION app.fn_registrar_evento_propuesta();


-- -----------------------------------------------------------------------------
-- Generación de la referencia legible (AV-2026-0001)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS app.seq_referencia_propuesta;

CREATE OR REPLACE FUNCTION app.fn_generar_referencia_propuesta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referencia IS NULL THEN
    NEW.referencia := 'AV-'
                   || to_char(NOW(), 'YYYY')
                   || '-'
                   || lpad(nextval('app.seq_referencia_propuesta')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_propuestas_referencia
  BEFORE INSERT ON app.propuestas
  FOR EACH ROW EXECUTE FUNCTION app.fn_generar_referencia_propuesta();
