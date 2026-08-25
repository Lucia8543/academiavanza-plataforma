-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 03: Usuarios y perfiles base
-- =============================================================================
-- La autenticación la gestiona Supabase Auth en el esquema `auth`. Aquí sólo
-- extendemos con los datos de aplicación.
--
-- Patrón: una tabla `perfiles` con los campos comunes a todos los roles, y
-- tablas especializadas (`profesores`, `familias`) que la extienden 1:1.
-- Es el patrón de "herencia por tabla de clase" y evita tanto una tabla gigante
-- con columnas nulas como duplicar nombre/email/teléfono en dos sitios.
-- =============================================================================

CREATE TABLE app.perfiles (
  -- La PK es la misma que la de auth.users: relación 1:1 estricta.
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  rol                   app.rol_usuario NOT NULL,

  nombre                TEXT NOT NULL,
  apellidos             TEXT NOT NULL,
  email                 CITEXT NOT NULL UNIQUE,
  telefono              TEXT,
  avatar_url            TEXT,

  -- Procedencia del registro y estado de validación por el usuario.
  -- Clave para la migración: un perfil importado del Excel arranca con
  -- datos_validados = FALSE hasta que la persona los revisa y confirma.
  origen                app.origen_dato NOT NULL DEFAULT 'autoregistro',
  datos_validados       BOOLEAN NOT NULL DEFAULT FALSE,
  validado_en           TIMESTAMPTZ,

  -- RGPD: consentimientos con sello temporal y versión del texto aceptado.
  acepta_privacidad     BOOLEAN NOT NULL DEFAULT FALSE,
  acepta_privacidad_en  TIMESTAMPTZ,
  version_privacidad    TEXT,
  acepta_comunicaciones BOOLEAN NOT NULL DEFAULT FALSE,

  ultimo_acceso_en      TIMESTAMPTZ,
  creado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Borrado lógico: nunca borramos filas con histórico asociado.
  eliminado_en          TIMESTAMPTZ,

  CONSTRAINT perfiles_telefono_formato
    CHECK (telefono IS NULL OR telefono ~ '^\+?[0-9\s\-\.]{9,20}$'),
  CONSTRAINT perfiles_validado_coherente
    CHECK ((datos_validados = FALSE) OR (validado_en IS NOT NULL)),
  CONSTRAINT perfiles_consentimiento_coherente
    CHECK ((acepta_privacidad = FALSE) OR (acepta_privacidad_en IS NOT NULL))
);

COMMENT ON TABLE  app.perfiles IS
  'Datos comunes a todos los usuarios. Extiende auth.users de Supabase.';
COMMENT ON COLUMN app.perfiles.origen IS
  'migracion = importado del Excel histórico; autoregistro = alta por el propio usuario.';
COMMENT ON COLUMN app.perfiles.datos_validados IS
  'FALSE en perfiles migrados hasta que el usuario revisa y confirma sus datos.';
COMMENT ON COLUMN app.perfiles.eliminado_en IS
  'Borrado lógico. Una fila con eliminado_en no nulo se considera inexistente para la aplicación.';

CREATE INDEX idx_perfiles_rol           ON app.perfiles (rol) WHERE eliminado_en IS NULL;
CREATE INDEX idx_perfiles_email         ON app.perfiles (email);
CREATE INDEX idx_perfiles_sin_validar   ON app.perfiles (origen, datos_validados)
                                        WHERE origen = 'migracion' AND datos_validados = FALSE;


-- -----------------------------------------------------------------------------
-- Disparador de actualización automática de `actualizado_en`
-- Se reutiliza en el resto de tablas del esquema.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.fn_touch_actualizado_en()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.actualizado_en := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfiles_touch
  BEFORE UPDATE ON app.perfiles
  FOR EACH ROW EXECUTE FUNCTION app.fn_touch_actualizado_en();
