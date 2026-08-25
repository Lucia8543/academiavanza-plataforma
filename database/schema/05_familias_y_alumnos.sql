-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 05: Familias, alumnos y sus necesidades
-- =============================================================================
-- Los datos de menores son categoría especialmente protegida. El diseño aplica
-- minimización: se guarda lo mínimo imprescindible para hacer el match y nada
-- más. En concreto NO se guardan: apellidos completos del menor en el perfil
-- público, dirección postal exacta, ni fecha de nacimiento.
-- =============================================================================

CREATE TABLE app.familias (
  id                      UUID PRIMARY KEY REFERENCES app.perfiles(id) ON DELETE CASCADE,

  -- Zona para clases presenciales. Grano barrio, nunca calle y número.
  zona_id                 UUID REFERENCES catalogo.zonas(id),

  -- Preferencia de colegio de procedencia del profesor: la funcionalidad
  -- diferencial. NULL significa "me da igual el colegio".
  colegio_preferido_id    UUID REFERENCES catalogo.colegios(id),

  -- Cliente de Stripe. Se crea de forma diferida, en el primer pago.
  stripe_customer_id      TEXT UNIQUE,

  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  app.familias IS
  'Perfil especializado de la familia. Extiende app.perfiles 1:1.';
COMMENT ON COLUMN app.familias.colegio_preferido_id IS
  'Filtro por defecto del directorio. NULL = sin preferencia de colegio.';

CREATE INDEX idx_familias_zona ON app.familias (zona_id);

CREATE TRIGGER trg_familias_touch
  BEFORE UPDATE ON app.familias
  FOR EACH ROW EXECUTE FUNCTION app.fn_touch_actualizado_en();


-- -----------------------------------------------------------------------------
-- ALUMNOS
-- Una familia puede tener varios hijos. El Excel no contemplaba este caso:
-- si una familia tenía dos hijos, aparecían como dos filas independientes sin
-- relación entre sí.
-- -----------------------------------------------------------------------------
CREATE TABLE app.alumnos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id        UUID NOT NULL REFERENCES app.familias(id) ON DELETE CASCADE,

  -- Sólo nombre de pila. Suficiente para que el profesor sepa a quién dará
  -- clase, y evita identificar al menor de forma innecesaria.
  nombre            TEXT NOT NULL,
  inicial_apellido  TEXT,

  colegio_id        UUID REFERENCES catalogo.colegios(id),
  colegio_otro      TEXT,
  nivel_id          UUID NOT NULL REFERENCES catalogo.niveles(id),

  -- Contexto útil para el profesor, opcional.
  notas_familia     TEXT,

  activo            BOOLEAN NOT NULL DEFAULT TRUE,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT alumno_inicial_formato
    CHECK (inicial_apellido IS NULL OR length(inicial_apellido) <= 2)
);

COMMENT ON TABLE  app.alumnos IS
  'Hijos de una familia. Minimización de datos: sólo nombre de pila e inicial.';
COMMENT ON COLUMN app.alumnos.inicial_apellido IS
  'Inicial del primer apellido, para distinguir homónimos. Nunca el apellido completo.';

CREATE INDEX idx_alumnos_familia ON app.alumnos (familia_id) WHERE activo;


-- -----------------------------------------------------------------------------
-- NECESIDADES
-- Qué busca la familia para un alumno concreto. Es el "carrito de búsqueda"
-- que rellena el filtro del directorio y que se adjunta a las propuestas.
-- Se separa de `alumnos` porque una misma familia puede buscar Matemáticas en
-- octubre y Química en febrero, y ambas búsquedas son eventos distintos.
-- -----------------------------------------------------------------------------
CREATE TABLE app.necesidades (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id             UUID NOT NULL REFERENCES app.alumnos(id) ON DELETE CASCADE,

  modalidad             app.modalidad NOT NULL DEFAULT 'online',
  horas_semana          SMALLINT,
  fecha_inicio_deseada  DATE,
  urgente               BOOLEAN NOT NULL DEFAULT FALSE,
  comentarios           TEXT,

  activa                BOOLEAN NOT NULL DEFAULT TRUE,

  creado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT necesidad_horas_rango
    CHECK (horas_semana IS NULL OR horas_semana BETWEEN 1 AND 40)
);

COMMENT ON TABLE app.necesidades IS
  'Búsqueda concreta de una familia para un alumno. Una familia puede tener varias a lo largo del tiempo.';

CREATE INDEX idx_necesidades_alumno ON app.necesidades (alumno_id) WHERE activa;


-- Asignaturas concretas que se buscan en esa necesidad.
CREATE TABLE app.necesidad_asignaturas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  necesidad_id    UUID NOT NULL REFERENCES app.necesidades(id) ON DELETE CASCADE,
  asignatura_id   UUID NOT NULL REFERENCES catalogo.asignaturas(id) ON DELETE RESTRICT,

  CONSTRAINT necesidad_asig_unica UNIQUE (necesidad_id, asignatura_id)
);

CREATE INDEX idx_neces_asig_necesidad ON app.necesidad_asignaturas (necesidad_id);
