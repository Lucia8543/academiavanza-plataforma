-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 12: Roles, permisos y seguridad a nivel de fila
-- =============================================================================
-- Tres identidades distintas contra la base de datos:
--
--   academiavanza_app     La aplicación. Permisos acotados y sujeta a RLS.
--   academiavanza_lucia   Identidad nominal de Lucía para el cliente SQL.
--                         Lectura y escritura, exenta de RLS, con auditoría.
--   academiavanza_lectura Sólo lectura. Para conectar herramientas de análisis
--                         sin riesgo de tocar nada.
--
-- Motivo de separar la identidad de Lucía de la de la aplicación: cuando algo
-- cambia en la base de datos, la auditoría distingue si fue el producto o una
-- edición manual. Con un usuario compartido eso es imposible de reconstruir.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Creación de roles
-- Las contraseñas se fijan fuera de este fichero (nunca en el repositorio).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academiavanza_app') THEN
    CREATE ROLE academiavanza_app LOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academiavanza_lucia') THEN
    CREATE ROLE academiavanza_lucia LOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academiavanza_lectura') THEN
    CREATE ROLE academiavanza_lectura LOGIN;
  END IF;
END
$$;

COMMENT ON ROLE academiavanza_app     IS 'Rol de la aplicación. Sujeto a RLS.';
COMMENT ON ROLE academiavanza_lucia   IS 'Rol nominal de administración. Acceso completo con auditoría.';
COMMENT ON ROLE academiavanza_lectura IS 'Rol de sólo lectura para análisis.';


-- -----------------------------------------------------------------------------
-- Permisos del rol de aplicación
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA app, catalogo TO academiavanza_app;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA app      TO academiavanza_app;
GRANT SELECT                 ON ALL TABLES IN SCHEMA catalogo TO academiavanza_app;
GRANT USAGE                  ON ALL SEQUENCES IN SCHEMA app   TO academiavanza_app;

-- La aplicación nunca borra: el borrado es lógico (eliminado_en).
REVOKE DELETE ON ALL TABLES IN SCHEMA app FROM academiavanza_app;

-- Ni toca los datos crudos de la migración.
REVOKE ALL ON SCHEMA legacy FROM academiavanza_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE ON TABLES TO academiavanza_app;


-- -----------------------------------------------------------------------------
-- Permisos del rol de administración (Lucía)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA app, catalogo, legacy, auditoria TO academiavanza_lucia;

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA app, catalogo, legacy TO academiavanza_lucia;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app, catalogo, legacy TO academiavanza_lucia;
GRANT SELECT         ON ALL TABLES    IN SCHEMA auditoria             TO academiavanza_lucia;

-- Exención de RLS: necesita ver todas las filas, no sólo las suyas.
ALTER ROLE academiavanza_lucia BYPASSRLS;

ALTER DEFAULT PRIVILEGES IN SCHEMA app, catalogo, legacy
  GRANT ALL PRIVILEGES ON TABLES TO academiavanza_lucia;


-- -----------------------------------------------------------------------------
-- Permisos del rol de sólo lectura
-- Sin acceso a legacy: contiene datos de menores sin depurar.
-- -----------------------------------------------------------------------------
GRANT USAGE  ON SCHEMA app, catalogo                     TO academiavanza_lectura;
GRANT SELECT ON ALL TABLES IN SCHEMA app, catalogo       TO academiavanza_lectura;
ALTER ROLE academiavanza_lectura BYPASSRLS;

ALTER DEFAULT PRIVILEGES IN SCHEMA app, catalogo
  GRANT SELECT ON TABLES TO academiavanza_lectura;


-- =============================================================================
-- SEGURIDAD A NIVEL DE FILA (RLS)
-- Garantiza que una familia no pueda leer los datos de otra ni el teléfono de
-- un profesor con el que no ha completado el match, aunque la aplicación
-- tuviera un fallo.
-- =============================================================================

ALTER TABLE app.perfiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.profesores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.familias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.alumnos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.necesidades  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.propuestas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.pagos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.resenas      ENABLE ROW LEVEL SECURITY;


-- Función auxiliar: ¿el usuario autenticado es administrador?
CREATE OR REPLACE FUNCTION app.fn_es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app.perfiles
    WHERE id = auth.uid() AND rol = 'admin' AND eliminado_en IS NULL
  );
$$;


-- --- perfiles ---------------------------------------------------------------
CREATE POLICY perfil_propio_lectura ON app.perfiles
  FOR SELECT USING (id = auth.uid() OR app.fn_es_admin());

CREATE POLICY perfil_propio_escritura ON app.perfiles
  FOR UPDATE USING (id = auth.uid() OR app.fn_es_admin());


-- --- profesores -------------------------------------------------------------
-- Los perfiles activos son públicos: el directorio debe poder leerlos sin login.
CREATE POLICY profesor_directorio_publico ON app.profesores
  FOR SELECT USING (estado = 'activo');

CREATE POLICY profesor_gestiona_lo_suyo ON app.profesores
  FOR ALL USING (id = auth.uid() OR app.fn_es_admin());


-- --- familias y alumnos -----------------------------------------------------
CREATE POLICY familia_solo_lo_suyo ON app.familias
  FOR ALL USING (id = auth.uid() OR app.fn_es_admin());

CREATE POLICY alumno_solo_su_familia ON app.alumnos
  FOR ALL USING (familia_id = auth.uid() OR app.fn_es_admin());

CREATE POLICY necesidad_solo_su_familia ON app.necesidades
  FOR ALL USING (
    app.fn_es_admin()
    OR EXISTS (SELECT 1 FROM app.alumnos a WHERE a.id = alumno_id AND a.familia_id = auth.uid())
  );


-- --- propuestas -------------------------------------------------------------
-- Visibles para las dos partes implicadas y para administración.
CREATE POLICY propuesta_partes_implicadas ON app.propuestas
  FOR SELECT USING (
    familia_id  = auth.uid()
    OR profesor_id = auth.uid()
    OR app.fn_es_admin()
  );

CREATE POLICY propuesta_crea_la_familia ON app.propuestas
  FOR INSERT WITH CHECK (familia_id = auth.uid());

CREATE POLICY propuesta_responde_el_profesor ON app.propuestas
  FOR UPDATE USING (profesor_id = auth.uid() OR app.fn_es_admin());


-- --- pagos ------------------------------------------------------------------
CREATE POLICY pago_solo_su_familia ON app.pagos
  FOR SELECT USING (familia_id = auth.uid() OR app.fn_es_admin());


-- --- reseñas ----------------------------------------------------------------
CREATE POLICY resena_publicas_visibles ON app.resenas
  FOR SELECT USING (
    estado = 'publicada'
    OR familia_id  = auth.uid()
    OR profesor_id = auth.uid()
    OR app.fn_es_admin()
  );

CREATE POLICY resena_escribe_la_familia ON app.resenas
  FOR INSERT WITH CHECK (familia_id = auth.uid());


-- =============================================================================
-- AUDITORÍA
-- Registra quién cambió qué en las tablas sensibles, distinguiendo entre la
-- aplicación y las ediciones manuales desde el cliente SQL.
-- =============================================================================

CREATE TABLE auditoria.cambios (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabla           TEXT NOT NULL,
  registro_id     TEXT NOT NULL,
  operacion       TEXT NOT NULL,        -- INSERT | UPDATE | DELETE
  datos_antes     JSONB,
  datos_despues   JSONB,
  campos_afectados TEXT[],

  usuario_bd      TEXT NOT NULL DEFAULT current_user,
  usuario_app     UUID,
  origen          TEXT NOT NULL,        -- 'aplicacion' | 'sql_directo'
  ip_cliente      INET,

  ocurrido_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  auditoria.cambios IS
  'Traza de cambios en tablas sensibles. Distingue cambios de la aplicación de ediciones manuales.';
COMMENT ON COLUMN auditoria.cambios.origen IS
  'sql_directo indica una edición hecha desde un cliente SQL, no desde el producto.';

CREATE INDEX idx_auditoria_tabla    ON auditoria.cambios (tabla, ocurrido_en DESC);
CREATE INDEX idx_auditoria_registro ON auditoria.cambios (tabla, registro_id);
CREATE INDEX idx_auditoria_manual   ON auditoria.cambios (ocurrido_en DESC)
       WHERE origen = 'sql_directo';


CREATE OR REPLACE FUNCTION auditoria.fn_registrar_cambio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_antes   JSONB;
  v_despues JSONB;
  v_campos  TEXT[];
  v_origen  TEXT;
BEGIN
  -- Si el usuario de base de datos no es el de la aplicación, es edición manual.
  v_origen := CASE WHEN current_user = 'academiavanza_app'
                   THEN 'aplicacion'
                   ELSE 'sql_directo'
              END;

  IF TG_OP = 'DELETE' THEN
    v_antes := to_jsonb(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    v_despues := to_jsonb(NEW);
  ELSE
    v_antes   := to_jsonb(OLD);
    v_despues := to_jsonb(NEW);
    SELECT array_agg(clave)
      INTO v_campos
      FROM jsonb_each(v_antes) AS t(clave, valor)
     WHERE v_despues -> clave IS DISTINCT FROM valor;

    -- Nada material cambió: no ensuciamos la auditoría.
    IF v_campos IS NULL OR array_length(v_campos, 1) = 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO auditoria.cambios (
    tabla, registro_id, operacion, datos_antes, datos_despues,
    campos_afectados, usuario_app, origen
  ) VALUES (
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    COALESCE((v_despues ->> 'id'), (v_antes ->> 'id')),
    TG_OP, v_antes, v_despues, v_campos,
    NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::UUID,
    v_origen
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Tablas auditadas: las que afectan a dinero, acceso o reputación.
CREATE TRIGGER trg_audit_profesores AFTER INSERT OR UPDATE OR DELETE ON app.profesores
  FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_cambio();

CREATE TRIGGER trg_audit_propuestas AFTER INSERT OR UPDATE OR DELETE ON app.propuestas
  FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_cambio();

CREATE TRIGGER trg_audit_pagos      AFTER INSERT OR UPDATE OR DELETE ON app.pagos
  FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_cambio();

CREATE TRIGGER trg_audit_tarifas    AFTER INSERT OR UPDATE OR DELETE ON app.tarifas
  FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_cambio();

CREATE TRIGGER trg_audit_resenas    AFTER INSERT OR UPDATE OR DELETE ON app.resenas
  FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_cambio();
