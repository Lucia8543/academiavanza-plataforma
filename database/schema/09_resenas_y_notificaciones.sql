-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 09: Reseñas y notificaciones
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RESEÑAS
-- Sólo puede reseñar quien ha completado un match pagado. Es lo que distingue
-- estas reseñas de las de Superprof, donde cualquiera puede escribir.
-- La restricción se aplica en la propia base de datos, no sólo en la aplicación.
-- -----------------------------------------------------------------------------
CREATE TABLE app.resenas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  propuesta_id        UUID NOT NULL REFERENCES app.propuestas(id) ON DELETE RESTRICT,
  profesor_id         UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,
  familia_id          UUID NOT NULL REFERENCES app.familias(id)   ON DELETE CASCADE,

  puntuacion_global   SMALLINT NOT NULL,
  puntuacion_trato    SMALLINT,
  puntuacion_metodo   SMALLINT,
  puntuacion_puntual  SMALLINT,

  titulo              TEXT,
  texto               TEXT NOT NULL,
  recomienda          BOOLEAN,

  -- Lo que se muestra públicamente: nombre de pila e inicial. Nunca el
  -- nombre completo ni ningún dato del menor.
  nombre_publico      TEXT NOT NULL,
  asignatura_texto    TEXT,

  estado              app.estado_resena NOT NULL DEFAULT 'pendiente',
  moderada_en         TIMESTAMPTZ,
  moderada_por        UUID REFERENCES app.perfiles(id),
  motivo_ocultacion   TEXT,

  -- Derecho de réplica del profesor.
  respuesta_profesor  TEXT,
  respondida_en       TIMESTAMPTZ,

  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Una reseña por propuesta: impide inflar la valoración de un profesor.
  CONSTRAINT resena_una_por_propuesta UNIQUE (propuesta_id),

  CONSTRAINT resena_puntuacion_global_rango CHECK (puntuacion_global BETWEEN 1 AND 5),
  CONSTRAINT resena_puntuacion_trato_rango  CHECK (puntuacion_trato   IS NULL OR puntuacion_trato   BETWEEN 1 AND 5),
  CONSTRAINT resena_puntuacion_metodo_rango CHECK (puntuacion_metodo  IS NULL OR puntuacion_metodo  BETWEEN 1 AND 5),
  CONSTRAINT resena_puntuacion_puntual_rango CHECK (puntuacion_puntual IS NULL OR puntuacion_puntual BETWEEN 1 AND 5),
  CONSTRAINT resena_texto_minimo            CHECK (length(trim(texto)) >= 40),
  CONSTRAINT resena_moderacion_coherente
    CHECK (estado = 'pendiente' OR moderada_en IS NOT NULL)
);

COMMENT ON TABLE app.resenas IS
  'Reseñas verificadas: sólo las puede escribir una familia con match pagado sobre ese profesor.';

CREATE INDEX idx_resenas_profesor_publicas ON app.resenas (profesor_id, creado_en DESC)
       WHERE estado = 'publicada';
CREATE INDEX idx_resenas_moderacion        ON app.resenas (creado_en)
       WHERE estado = 'pendiente';

CREATE TRIGGER trg_resenas_touch
  BEFORE UPDATE ON app.resenas
  FOR EACH ROW EXECUTE FUNCTION app.fn_touch_actualizado_en();


-- -----------------------------------------------------------------------------
-- Validación: la propuesta reseñada debe estar pagada y pertenecer a esa familia
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.fn_validar_resena()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_estado      app.estado_propuesta;
  v_familia_id  UUID;
  v_profesor_id UUID;
BEGIN
  SELECT estado, familia_id, profesor_id
    INTO v_estado, v_familia_id, v_profesor_id
    FROM app.propuestas
   WHERE id = NEW.propuesta_id;

  IF v_estado <> 'pagada' THEN
    RAISE EXCEPTION 'Sólo se puede reseñar una propuesta con match pagado (estado actual: %)', v_estado;
  END IF;

  IF v_familia_id <> NEW.familia_id OR v_profesor_id <> NEW.profesor_id THEN
    RAISE EXCEPTION 'La reseña no corresponde a las partes de la propuesta %', NEW.propuesta_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_resenas_validar
  BEFORE INSERT ON app.resenas
  FOR EACH ROW EXECUTE FUNCTION app.fn_validar_resena();


-- -----------------------------------------------------------------------------
-- Recálculo de métricas del profesor al publicarse u ocultarse una reseña
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.fn_actualizar_metricas_profesor()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_profesor_id UUID := COALESCE(NEW.profesor_id, OLD.profesor_id);
BEGIN
  UPDATE app.profesores p
     SET valoracion_media = sub.media,
         total_resenas    = sub.total
    FROM (
      SELECT ROUND(AVG(puntuacion_global)::NUMERIC, 2) AS media,
             COUNT(*)                                  AS total
      FROM   app.resenas
      WHERE  profesor_id = v_profesor_id
        AND  estado      = 'publicada'
    ) sub
   WHERE p.id = v_profesor_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_resenas_metricas
  AFTER INSERT OR UPDATE OF estado OR DELETE ON app.resenas
  FOR EACH ROW EXECUTE FUNCTION app.fn_actualizar_metricas_profesor();


-- =============================================================================
-- NOTIFICACIONES
-- =============================================================================

CREATE TABLE app.plantillas_notificacion (
  clave           TEXT PRIMARY KEY,
  canal           TEXT NOT NULL,         -- 'email' | 'whatsapp' | 'in_app'
  asunto          TEXT,
  cuerpo          TEXT NOT NULL,
  variables       TEXT[] NOT NULL DEFAULT '{}',

  -- Las plantillas de WhatsApp deben estar aprobadas por Meta antes de poder
  -- enviarse fuera de la ventana de 24 h.
  whatsapp_template_id TEXT,
  activa          BOOLEAN NOT NULL DEFAULT TRUE,

  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por UUID REFERENCES app.perfiles(id),

  CONSTRAINT plantilla_canal_valido CHECK (canal IN ('email','whatsapp','in_app'))
);

COMMENT ON TABLE app.plantillas_notificacion IS
  'Textos de los mensajes automáticos, editables desde el panel de administración.';


CREATE TABLE app.notificaciones (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  destinatario_id     UUID NOT NULL REFERENCES app.perfiles(id) ON DELETE CASCADE,
  plantilla_clave     TEXT REFERENCES app.plantillas_notificacion(clave),
  canal               TEXT NOT NULL,

  propuesta_id        UUID REFERENCES app.propuestas(id) ON DELETE SET NULL,

  asunto              TEXT,
  cuerpo              TEXT,
  datos               JSONB NOT NULL DEFAULT '{}'::jsonb,

  estado              TEXT NOT NULL DEFAULT 'pendiente',
  proveedor_id        TEXT,             -- id del mensaje en Resend o WATI
  error_mensaje       TEXT,
  intentos            SMALLINT NOT NULL DEFAULT 0,

  -- Marca de lectura para las notificaciones dentro de la aplicación.
  leida_en            TIMESTAMPTZ,

  programada_para     TIMESTAMPTZ,
  enviada_en          TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT notif_canal_valido  CHECK (canal  IN ('email','whatsapp','in_app')),
  CONSTRAINT notif_estado_valido CHECK (estado IN ('pendiente','enviada','entregada','fallida','cancelada'))
);

COMMENT ON TABLE app.notificaciones IS
  'Registro de todos los envíos. Permite reintentar, auditar y evitar duplicados.';

CREATE INDEX idx_notif_destinatario ON app.notificaciones (destinatario_id, creado_en DESC);
CREATE INDEX idx_notif_pendientes   ON app.notificaciones (programada_para)
       WHERE estado = 'pendiente';
CREATE INDEX idx_notif_no_leidas    ON app.notificaciones (destinatario_id)
       WHERE canal = 'in_app' AND leida_en IS NULL;
