-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 02: Tablas de catálogo (datos maestros)
-- =============================================================================
-- Estas tablas contienen valores de referencia normalizados. Se separan de las
-- tablas operativas porque cambian con muy poca frecuencia, las mantiene
-- administración, y son referenciadas desde múltiples sitios.
--
-- Normalizar colegios y asignaturas (en vez de guardar texto libre) es lo que
-- permite el filtrado fiable del directorio, que es el diferencial del producto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- COLEGIOS
-- Núcleo del diferencial de producto: cada profesor lleva el badge del colegio
-- del que procede, y las familias pueden filtrar por él.
-- -----------------------------------------------------------------------------
CREATE TABLE catalogo.colegios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  nombre_corto      TEXT,
  logo_url          TEXT,
  web_url           TEXT,
  municipio         TEXT,
  provincia         TEXT DEFAULT 'Madrid',

  -- Un colegio "destacado" aparece primero en los filtros de la interfaz.
  -- El Montpellier arranca como destacado por razones históricas del negocio.
  destacado         BOOLEAN NOT NULL DEFAULT FALSE,
  orden_visual      INTEGER NOT NULL DEFAULT 100,

  -- Permite ocultar colegios sin borrarlos (los profesores ya asociados
  -- mantienen la referencia).
  activo            BOOLEAN NOT NULL DEFAULT TRUE,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT colegios_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE  catalogo.colegios IS
  'Colegios de procedencia de los profesores. Alimenta el badge del perfil y el filtro del directorio.';
COMMENT ON COLUMN catalogo.colegios.logo_url IS
  'URL del logo en Supabase Storage. Se muestra en el badge del perfil del profesor.';
COMMENT ON COLUMN catalogo.colegios.destacado IS
  'Si es TRUE aparece en la parte superior del selector de filtros.';

CREATE INDEX idx_colegios_activo    ON catalogo.colegios (activo) WHERE activo;
CREATE INDEX idx_colegios_destacado ON catalogo.colegios (destacado, orden_visual) WHERE activo;
CREATE INDEX idx_colegios_nombre_trgm ON catalogo.colegios USING gin (nombre gin_trgm_ops);


-- -----------------------------------------------------------------------------
-- ASIGNATURAS
-- -----------------------------------------------------------------------------
CREATE TABLE catalogo.asignaturas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL UNIQUE,
  categoria         TEXT,             -- 'ciencias', 'letras', 'idiomas', 'otros'
  icono             TEXT,             -- nombre del icono Lucide para la interfaz
  orden_visual      INTEGER NOT NULL DEFAULT 100,
  activa            BOOLEAN NOT NULL DEFAULT TRUE,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT asignaturas_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE catalogo.asignaturas IS
  'Catálogo cerrado de asignaturas. Sustituye al texto libre del formulario de Google.';

CREATE INDEX idx_asignaturas_activa ON catalogo.asignaturas (activa, orden_visual) WHERE activa;


-- -----------------------------------------------------------------------------
-- NIVELES EDUCATIVOS
-- -----------------------------------------------------------------------------
CREATE TABLE catalogo.niveles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL UNIQUE,       -- '3º ESO'
  etapa             catalogo.etapa_educativa NOT NULL,
  orden_visual      INTEGER NOT NULL,           -- para ordenar de menor a mayor
  activo            BOOLEAN NOT NULL DEFAULT TRUE,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE catalogo.niveles IS
  'Cursos concretos (1º ESO, 2º Bachillerato...). La etapa permite agrupar en la interfaz.';

CREATE INDEX idx_niveles_etapa ON catalogo.niveles (etapa, orden_visual) WHERE activo;


-- -----------------------------------------------------------------------------
-- ZONAS GEOGRÁFICAS
-- Para clases presenciales. Se usa zona/barrio en lugar de dirección exacta
-- por minimización de datos personales (RGPD art. 5.1.c).
-- -----------------------------------------------------------------------------
CREATE TABLE catalogo.zonas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,              -- 'Valdebebas', 'Chamartín'
  municipio         TEXT NOT NULL DEFAULT 'Madrid',
  activa            BOOLEAN NOT NULL DEFAULT TRUE,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE catalogo.zonas IS
  'Zonas para clases presenciales. Deliberadamente granular a nivel barrio, no dirección.';


-- -----------------------------------------------------------------------------
-- CERTIFICACIONES DE IDIOMAS
-- Normalizado porque es un criterio de filtrado relevante para las familias.
-- -----------------------------------------------------------------------------
CREATE TABLE catalogo.certificaciones_idioma (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  idioma            TEXT NOT NULL,              -- 'Inglés', 'Francés', 'Alemán'
  nombre            TEXT NOT NULL,              -- 'Cambridge C1 Advanced'
  nivel_mcer        TEXT,                       -- 'A1'..'C2' (Marco Común Europeo)
  organismo         TEXT,                       -- 'Cambridge', 'Trinity', 'Goethe'
  orden_visual      INTEGER NOT NULL DEFAULT 100,
  activa            BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT certif_nivel_mcer_valido
    CHECK (nivel_mcer IS NULL OR nivel_mcer IN ('A1','A2','B1','B2','C1','C2'))
);

COMMENT ON TABLE catalogo.certificaciones_idioma IS
  'Titulaciones de idiomas normalizadas. El Excel las guardaba como texto libre.';
