-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 10: Esquema legacy (volcado del Excel histórico)
-- =============================================================================
-- Estrategia de carga en dos etapas:
--
--   Etapa 1 (legacy.*)  Volcado literal del Excel, TODO como texto, sin validar.
--                       Objetivo: que la carga nunca falle y quede constancia
--                       exacta de lo que había en el fichero original.
--
--   Etapa 2 (app.*)     Transformación, limpieza y normalización hacia el modelo
--                       real. Lo que no se pueda mapear queda marcado para
--                       revisión manual, no se descarta en silencio.
--
-- Ventaja de separar las etapas: la carga es repetible. Si se descubre un error
-- de mapeo, se corrige la transformación y se vuelve a ejecutar sin tener que
-- volver a tocar el Excel.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Control de cargas
-- -----------------------------------------------------------------------------
CREATE TABLE legacy.cargas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fichero_origen      TEXT NOT NULL,
  hoja                TEXT,
  filas_leidas        INTEGER NOT NULL DEFAULT 0,
  filas_importadas    INTEGER NOT NULL DEFAULT 0,
  filas_descartadas   INTEGER NOT NULL DEFAULT 0,
  filas_revision      INTEGER NOT NULL DEFAULT 0,
  notas               TEXT,

  ejecutado_por       TEXT,
  ejecutado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE legacy.cargas IS
  'Registro de cada ejecución de importación, para poder auditar y repetir.';


-- -----------------------------------------------------------------------------
-- Volcado crudo de la hoja PROFES
-- Todas las columnas son TEXT a propósito: el Excel contiene valores como
-- "12,4" , "12.4" , "un 12 y pico" en la misma columna de nota.
-- -----------------------------------------------------------------------------
CREATE TABLE legacy.profes_raw (
  id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  carga_id                  UUID REFERENCES legacy.cargas(id),
  fila_origen               INTEGER,

  marca_temporal            TEXT,
  colegio_montpellier       TEXT,   -- '¿Has estudiado en el Montpellier? (Si no, escribe en cuál)'
  nombre_apellidos          TEXT,
  telefono                  TEXT,
  telefono_bizum            TEXT,   -- NO se migra: la plataforma ya no gestiona pagos
  email                     TEXT,
  carrera_estudios          TEXT,
  asignaturas               TEXT,
  cursos                    TEXT,
  modalidad                 TEXT,
  direccion_zona            TEXT,
  horas_semana              TEXT,
  disponibilidad            TEXT,   -- NO se migra: caducado
  nota_evau_bachillerato    TEXT,
  comentarios               TEXT,
  certificado_idiomas       TEXT,
  habilidades_logros        TEXT,
  recomendado_por           TEXT,

  -- Estado de la transformación
  procesado                 BOOLEAN NOT NULL DEFAULT FALSE,
  profesor_id               UUID REFERENCES app.profesores(id),
  requiere_revision         BOOLEAN NOT NULL DEFAULT FALSE,
  incidencias               TEXT[] NOT NULL DEFAULT '{}',

  importado_en              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  legacy.profes_raw IS
  'Volcado literal de la hoja PROFES. Todo TEXT: se valida en la transformación, no en la carga.';
COMMENT ON COLUMN legacy.profes_raw.telefono_bizum IS
  'Se conserva por fidelidad al original pero NO se migra: la plataforma ya no intermedia pagos.';
COMMENT ON COLUMN legacy.profes_raw.incidencias IS
  'Problemas detectados al transformar: colegio no reconocido, nota ilegible, email duplicado...';

CREATE INDEX idx_profes_raw_pendientes ON legacy.profes_raw (procesado) WHERE NOT procesado;
CREATE INDEX idx_profes_raw_revision   ON legacy.profes_raw (requiere_revision) WHERE requiere_revision;


-- -----------------------------------------------------------------------------
-- Volcado crudo de la hoja PADRES
-- -----------------------------------------------------------------------------
CREATE TABLE legacy.padres_raw (
  id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  carga_id                  UUID REFERENCES legacy.cargas(id),
  fila_origen               INTEGER,

  marca_temporal            TEXT,
  colegio_alumno            TEXT,
  nombre_alumno             TEXT,
  nombre_padre              TEXT,
  email                     TEXT,
  telefono                  TEXT,
  curso_alumno              TEXT,
  asignaturas               TEXT,
  modalidad                 TEXT,
  direccion                 TEXT,   -- se reduce a zona: no se migra la calle
  horas_semana              TEXT,   -- NO se migra: caducado
  disponibilidad            TEXT,   -- NO se migra: caducado
  comentarios               TEXT,
  fecha_inicio_deseada      TEXT,   -- NO se migra: caducado
  email_secundario          TEXT,

  procesado                 BOOLEAN NOT NULL DEFAULT FALSE,
  familia_id                UUID REFERENCES app.familias(id),
  alumno_id                 UUID REFERENCES app.alumnos(id),
  requiere_revision         BOOLEAN NOT NULL DEFAULT FALSE,
  incidencias               TEXT[] NOT NULL DEFAULT '{}',

  importado_en              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE legacy.padres_raw IS
  'Volcado literal de la hoja PADRES. Contiene datos de menores: acceso restringido.';

CREATE INDEX idx_padres_raw_pendientes ON legacy.padres_raw (procesado) WHERE NOT procesado;


-- -----------------------------------------------------------------------------
-- Volcado crudo del registro de clases impartidas
-- No se migra al modelo operativo (la plataforma ya no gestiona clases). Su
-- único uso es calcular el agregado `profesores.clases_historicas`.
-- -----------------------------------------------------------------------------
CREATE TABLE legacy.clases_raw (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  carga_id            UUID REFERENCES legacy.cargas(id),
  fila_origen         INTEGER,

  fecha               TEXT,
  profesor_texto      TEXT,
  alumno_texto        TEXT,
  asignatura_texto    TEXT,
  duracion            TEXT,
  importe             TEXT,
  notas               TEXT,

  -- Resultado del emparejamiento con el profesor real
  profesor_id         UUID REFERENCES app.profesores(id),
  emparejado          BOOLEAN NOT NULL DEFAULT FALSE,

  importado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE legacy.clases_raw IS
  'Histórico de clases. Sólo se usa para calcular el total agregado por profesor.';

CREATE INDEX idx_clases_raw_profesor ON legacy.clases_raw (profesor_id);


-- -----------------------------------------------------------------------------
-- Tokens de reclamación de perfil
--
-- Un perfil migrado no tiene contraseña ni cuenta de Supabase Auth. Se le envía
-- al profesor un enlace con un token de un solo uso para que revise sus datos,
-- los corrija y cree su acceso. Hasta entonces el perfil permanece oculto.
-- -----------------------------------------------------------------------------
CREATE TABLE app.tokens_reclamacion (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Se guarda el hash, nunca el token en claro: si alguien accede a la tabla
  -- no puede suplantar a nadie.
  token_hash        TEXT NOT NULL UNIQUE,

  perfil_id         UUID NOT NULL REFERENCES app.perfiles(id) ON DELETE CASCADE,
  email_destino     CITEXT NOT NULL,

  usado_en          TIMESTAMPTZ,
  expira_en         TIMESTAMPTZ NOT NULL,
  enviado_en        TIMESTAMPTZ,
  recordatorios     SMALLINT NOT NULL DEFAULT 0,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT token_expiracion_futura CHECK (expira_en > creado_en)
);

COMMENT ON TABLE  app.tokens_reclamacion IS
  'Enlaces de un solo uso para que un usuario migrado reclame y valide su perfil.';
COMMENT ON COLUMN app.tokens_reclamacion.token_hash IS
  'SHA-256 del token. El valor en claro sólo existe en el correo enviado.';

CREATE INDEX idx_tokens_perfil  ON app.tokens_reclamacion (perfil_id);
CREATE INDEX idx_tokens_activos ON app.tokens_reclamacion (expira_en)
       WHERE usado_en IS NULL;
