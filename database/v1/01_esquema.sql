-- =============================================================================
-- AcademiAvanza — Esquema de la versión 1 (directorio gratuito)
-- =============================================================================
-- Este fichero crea, de una sola vez, todo lo que necesita el directorio
-- mínimo descrito en docs/02-producto/prd-00-directorio-minimo.md.
--
-- No sustituye a database/schema/, que sigue siendo el diseño del producto
-- completo con cobro. Es un subconjunto: cuando en enero se active la tarifa,
-- se añadirán encima las piezas que faltan (familias, propuestas, pagos,
-- reseñas) sin rehacer lo de aquí.
--
-- Tres diferencias deliberadas respecto del esquema completo:
--
--   1. No depende de `auth.users` ni de `app.perfiles`. En esta versión no hay
--      cuentas de familia, y el profesor entra con un enlace de un solo uso que
--      genera la propia aplicación. Ver ADR 0005.
--   2. No existen `nota_evau`, `nota_bachillerato` ni `avatar_url`. Son los
--      datos más delicados y la versión 1 no los recoge.
--   3. El colegio es DECLARADO. No hay columna de verificación, porque la
--      plataforma no lo comprueba y no debe insinuar que sí.
--
-- Se ejecuta entero, tal cual, en el editor SQL de Supabase.
-- Es idempotente: volver a ejecutarlo no rompe nada.
-- =============================================================================


-- =============================================================================
-- 1. Extensiones y esquemas
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- texto sin distinguir mayúsculas
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- búsquedas ignorando acentos
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda por similitud

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS catalogo;

COMMENT ON SCHEMA app       IS 'Tablas operativas de la aplicación';
COMMENT ON SCHEMA catalogo  IS 'Datos maestros: colegios, asignaturas, niveles';


-- =============================================================================
-- 2. Tipos enumerados
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE app.modalidad AS ENUM ('online', 'presencial', 'ambas');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ciclo de vida de la ficha de un profesor.
--
--   pendiente ──> activo ──> (el profesor se oculta) ──> pausado
--       │            └─────> inactivo   (se da de baja)
--       └──> rechazado
--
DO $$ BEGIN
  CREATE TYPE app.estado_profesor AS ENUM (
    'pendiente',   -- ficha enviada, esperando que administración la lea
    'activo',      -- aprobada y visible en el directorio
    'pausado',     -- aprobada, pero el profesor no acepta alumnos ahora
    'inactivo',    -- dado de baja
    'rechazado'    -- no aprobada
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE catalogo.etapa_educativa AS ENUM (
    'primaria', 'eso', 'bachillerato', 'evau', 'universidad', 'otros'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- 3. Catálogos
-- Idénticos a los de database/schema/02_catalogos.sql, para que las semillas
-- que ya existen funcionen sin tocar una coma.
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalogo.colegios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  nombre_corto      TEXT,
  logo_url          TEXT,
  web_url           TEXT,
  municipio         TEXT,
  provincia         TEXT DEFAULT 'Madrid',
  destacado         BOOLEAN NOT NULL DEFAULT FALSE,
  orden_visual      INTEGER NOT NULL DEFAULT 100,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT colegios_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE catalogo.colegios IS
  'Colegios declarados por los profesores. Alimenta el badge y el filtro principal.';

CREATE TABLE IF NOT EXISTS catalogo.asignaturas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL UNIQUE,
  categoria         TEXT,
  icono             TEXT,
  orden_visual      INTEGER NOT NULL DEFAULT 100,
  activa            BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT asignaturas_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS catalogo.niveles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL UNIQUE,
  etapa             catalogo.etapa_educativa NOT NULL,
  orden_visual      INTEGER NOT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalogo.zonas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  municipio         TEXT NOT NULL DEFAULT 'Madrid',
  activa            BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE catalogo.zonas IS
  'Zonas para clases presenciales. A nivel de barrio, nunca de dirección.';

CREATE TABLE IF NOT EXISTS catalogo.certificaciones_idioma (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  idioma            TEXT NOT NULL,
  nombre            TEXT NOT NULL,
  nivel_mcer        TEXT,
  organismo         TEXT,
  orden_visual      INTEGER NOT NULL DEFAULT 100,
  activa            BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT certif_nivel_mcer_valido
    CHECK (nivel_mcer IS NULL OR nivel_mcer IN ('A1','A2','B1','B2','C1','C2'))
);

CREATE INDEX IF NOT EXISTS idx_colegios_activo     ON catalogo.colegios (activo, orden_visual) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_asignaturas_activa  ON catalogo.asignaturas (activa, orden_visual) WHERE activa;
CREATE INDEX IF NOT EXISTS idx_niveles_etapa       ON catalogo.niveles (etapa, orden_visual) WHERE activo;


-- =============================================================================
-- 4. Profesores
-- La tabla central. Se sostiene sola: no referencia a ninguna tabla de usuarios
-- porque en esta versión el profesor no tiene cuenta, tiene ficha.
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.profesores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dirección pública de la ficha: /profesores/lucia-c-a3f2
  slug                    TEXT NOT NULL UNIQUE,

  -- ---------------------------------------------------------------------------
  -- Identidad. El nombre completo es interno; en público sólo sale
  -- «nombre + inicial del primer apellido», que se calcula al vuelo.
  -- ---------------------------------------------------------------------------
  nombre                  TEXT NOT NULL,
  apellidos               TEXT NOT NULL,
  email                   CITEXT NOT NULL UNIQUE,

  -- ---------------------------------------------------------------------------
  -- Procedencia académica: el diferencial del producto.
  -- El colegio lo DECLARA el profesor. Administración revisa que la ficha sea
  -- coherente antes de publicarla, pero no contrasta nada con el centro, y por
  -- eso aquí no hay ninguna columna que se llame «verificado».
  -- ---------------------------------------------------------------------------
  colegio_id              UUID REFERENCES catalogo.colegios(id) ON DELETE RESTRICT,
  colegio_otro            TEXT,

  -- ---------------------------------------------------------------------------
  -- Estudios
  -- ---------------------------------------------------------------------------
  titulacion              TEXT,      -- 'Medicina'
  universidad             TEXT,      -- 'Universidad Autónoma de Madrid'
  curso_actual            SMALLINT,  -- 2; NULL si ya ha terminado
  titulacion_finalizada   BOOLEAN NOT NULL DEFAULT FALSE,

  -- ---------------------------------------------------------------------------
  -- Lo que distingue a un profesor de otro.
  -- No es una biografía: responde a «algo que te distinga al dar clase».
  -- ---------------------------------------------------------------------------
  puntos_fuertes          TEXT,

  -- ---------------------------------------------------------------------------
  -- Modalidad y ubicación
  -- ---------------------------------------------------------------------------
  modalidad               app.modalidad NOT NULL DEFAULT 'online',
  zona_id                 UUID REFERENCES catalogo.zonas(id),
  zona_otra               TEXT,

  -- ---------------------------------------------------------------------------
  -- Estado de la ficha y disponibilidad
  --
  -- `estado` lo controla administración: si la ficha está publicada o no.
  -- `disponible` lo controla el profesor: si acepta alumnos ahora mismo.
  -- Son cosas distintas y por eso son dos columnas.
  -- ---------------------------------------------------------------------------
  estado                  app.estado_profesor NOT NULL DEFAULT 'pendiente',
  disponible              BOOLEAN NOT NULL DEFAULT TRUE,

  -- Fecha de la última vez que el profesor confirmó que sigue disponible.
  -- Es lo que hace funcionar el repaso trimestral: si esta fecha envejece
  -- demasiado sin respuesta, la ficha se oculta sola.
  disponibilidad_confirmada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_recordatorio_en  TIMESTAMPTZ,

  aprobado_en             TIMESTAMPTZ,
  motivo_rechazo          TEXT,

  -- ---------------------------------------------------------------------------
  -- Consentimiento para publicar la ficha (RGPD).
  -- Se guarda con fecha y con la versión del texto aceptado, porque dentro de
  -- un año hará falta poder demostrar qué aceptó exactamente y cuándo.
  -- ---------------------------------------------------------------------------
  acepta_publicacion      BOOLEAN NOT NULL DEFAULT FALSE,
  acepta_publicacion_en   TIMESTAMPTZ,
  version_privacidad      TEXT,

  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT prof_slug_formato
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT prof_colegio_informado
    CHECK (colegio_id IS NOT NULL OR colegio_otro IS NOT NULL),
  CONSTRAINT prof_puntos_fuertes_longitud
    CHECK (puntos_fuertes IS NULL OR char_length(puntos_fuertes) <= 300),
  CONSTRAINT prof_consentimiento_coherente
    CHECK (acepta_publicacion = FALSE OR acepta_publicacion_en IS NOT NULL),
  -- Una ficha no puede publicarse sin consentimiento. La regla vive en la base
  -- de datos, no sólo en el formulario: así no hay forma de saltársela.
  CONSTRAINT prof_activo_exige_consentimiento
    CHECK (estado <> 'activo' OR acepta_publicacion = TRUE)
);

COMMENT ON TABLE  app.profesores IS
  'Fichas de profesor. En la versión 1 no hay cuentas: se entra con enlace al correo.';
COMMENT ON COLUMN app.profesores.colegio_otro IS
  'Colegio declarado que aún no está en el catálogo. Administración lo revisa.';
COMMENT ON COLUMN app.profesores.disponible IS
  'Interruptor del propio profesor. Distinto de `estado`, que lo controla administración.';
COMMENT ON COLUMN app.profesores.disponibilidad_confirmada_en IS
  'Última confirmación de disponibilidad. Alimenta el repaso trimestral.';

CREATE INDEX IF NOT EXISTS idx_profesores_directorio
  ON app.profesores (estado, disponible) WHERE estado = 'activo' AND disponible;
CREATE INDEX IF NOT EXISTS idx_profesores_colegio ON app.profesores (colegio_id);
CREATE INDEX IF NOT EXISTS idx_profesores_email   ON app.profesores (email);


-- =============================================================================
-- 5. Oferta del profesor
-- Tablas de unión: un profesor imparte varias asignaturas, a varios niveles.
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.profesor_asignaturas (
  profesor_id     UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,
  asignatura_id   UUID NOT NULL REFERENCES catalogo.asignaturas(id) ON DELETE RESTRICT,
  PRIMARY KEY (profesor_id, asignatura_id)
);

CREATE TABLE IF NOT EXISTS app.profesor_niveles (
  profesor_id     UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,
  nivel_id        UUID NOT NULL REFERENCES catalogo.niveles(id) ON DELETE RESTRICT,
  PRIMARY KEY (profesor_id, nivel_id)
);

-- Certificados de idiomas: DECLARADOS. No se pide justificante ni se comprueba,
-- así que aquí no hay ni `documento_url` ni `verificada`.
CREATE TABLE IF NOT EXISTS app.profesor_certificaciones (
  profesor_id       UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,
  certificacion_id  UUID NOT NULL REFERENCES catalogo.certificaciones_idioma(id) ON DELETE RESTRICT,
  PRIMARY KEY (profesor_id, certificacion_id)
);

-- Disponibilidad como rejilla de día × franja.
-- Se guarda con horas reales en vez de inventar un tipo «mañana/tarde/noche»:
-- el día que alguien quiera afinar a las 17:30, la tabla ya lo admite.
--   mañana  09:00-14:00 · tarde 16:00-20:00 · noche 20:00-22:00
CREATE TABLE IF NOT EXISTS app.profesor_disponibilidad (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id     UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,
  dia_semana      SMALLINT NOT NULL,   -- 1 = lunes … 7 = domingo (ISO-8601)
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,
  CONSTRAINT disp_dia_valido   CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT disp_rango_valido CHECK (hora_fin > hora_inicio),
  CONSTRAINT disp_franja_unica UNIQUE (profesor_id, dia_semana, hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_profesor ON app.profesor_disponibilidad (profesor_id);


-- =============================================================================
-- 6. Contactos de familias
-- Lo que una familia escribe desde una ficha. Se guarda sólo para poder
-- reenviarlo si el correo falla, y se borra a los 90 días.
--
-- No se guarda ningún dato del alumno menor: ni nombre, ni edad, ni colegio.
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.contactos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id       UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,

  -- Quien escribe es el adulto, no el alumno.
  nombre_familia    TEXT NOT NULL,
  email_familia     CITEXT,
  telefono_familia  TEXT,

  nivel_id          UUID REFERENCES catalogo.niveles(id),
  modalidad         app.modalidad,
  zona              TEXT,
  mensaje           TEXT,

  -- Declaración de que quien escribe es madre, padre o tutor legal.
  es_tutor_legal    BOOLEAN NOT NULL DEFAULT FALSE,
  acepta_privacidad BOOLEAN NOT NULL DEFAULT FALSE,

  enviado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correo_entregado  BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT contacto_algun_canal
    CHECK (email_familia IS NOT NULL OR telefono_familia IS NOT NULL),
  CONSTRAINT contacto_mensaje_longitud
    CHECK (mensaje IS NULL OR char_length(mensaje) <= 500),
  CONSTRAINT contacto_exige_tutor
    CHECK (es_tutor_legal = TRUE),
  CONSTRAINT contacto_exige_privacidad
    CHECK (acepta_privacidad = TRUE)
);

COMMENT ON TABLE app.contactos IS
  'Mensajes de familias a profesores. Se borran a los 90 días: sólo sirven para reenviar.';

CREATE INDEX IF NOT EXISTS idx_contactos_profesor ON app.contactos (profesor_id, enviado_en DESC);
CREATE INDEX IF NOT EXISTS idx_contactos_fecha    ON app.contactos (enviado_en);


-- =============================================================================
-- 7. Accesos sin contraseña
-- Un enlace de un solo uso enviado al correo del profesor. Ver ADR 0005.
--
-- Se guarda el HASH del código, nunca el código. Si alguien leyera esta tabla
-- no podría entrar en ninguna cuenta.
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.accesos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id     UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  proposito       TEXT NOT NULL DEFAULT 'acceso',  -- 'acceso' | 'confirmar-disponibilidad'
  expira_en       TIMESTAMPTZ NOT NULL,
  usado_en        TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN app.accesos.token_hash IS
  'Hash del código enviado por correo. El código original no se guarda en ningún sitio.';

CREATE INDEX IF NOT EXISTS idx_accesos_token ON app.accesos (token_hash);
CREATE INDEX IF NOT EXISTS idx_accesos_purga ON app.accesos (expira_en);


-- =============================================================================
-- 8. Tarifas
-- Preparada pero apagada. La versión 1 no cobra (ADR 0004), pero la tabla
-- existe para que las semillas funcionen y para que encender el cobro en enero
-- sea añadir una fila, no rehacer el modelo.
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.tarifas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto          TEXT NOT NULL DEFAULT 'match',
  importe           NUMERIC(8,2) NOT NULL,
  moneda            CHAR(3) NOT NULL DEFAULT 'EUR',
  vigente_desde     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vigente_hasta     TIMESTAMPTZ,
  stripe_price_id   TEXT,
  stripe_product_id TEXT,
  motivo            TEXT,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tarifa_importe_valido  CHECK (importe >= 0),
  CONSTRAINT tarifa_moneda_valida   CHECK (moneda ~ '^[A-Z]{3}$'),
  CONSTRAINT tarifa_vigencia_valida CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde)
);


-- =============================================================================
-- 9. Actualización automática de `actualizado_en`
-- =============================================================================
CREATE OR REPLACE FUNCTION app.fn_actualizar_marca_temporal()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_profesores_actualizado ON app.profesores;
CREATE TRIGGER tg_profesores_actualizado
  BEFORE UPDATE ON app.profesores
  FOR EACH ROW EXECUTE FUNCTION app.fn_actualizar_marca_temporal();

DROP TRIGGER IF EXISTS tg_colegios_actualizado ON catalogo.colegios;
CREATE TRIGGER tg_colegios_actualizado
  BEFORE UPDATE ON catalogo.colegios
  FOR EACH ROW EXECUTE FUNCTION app.fn_actualizar_marca_temporal();


-- =============================================================================
-- 10. Vista del directorio
-- Lo que ve el público, y sólo eso. Que la vista exista evita que una consulta
-- descuidada acabe sacando el correo de un profesor a la página.
--
-- Aquí se calcula el nombre público: «Lucía C.» a partir de nombre y apellidos.
-- =============================================================================
CREATE OR REPLACE VIEW app.v_directorio AS
SELECT
  p.id,
  p.slug,
  p.nombre || ' ' || LEFT(SPLIT_PART(TRIM(p.apellidos), ' ', 1), 1) || '.' AS nombre_publico,
  c.slug          AS colegio_slug,
  COALESCE(c.nombre_corto, c.nombre, p.colegio_otro) AS colegio_nombre,
  p.titulacion,
  p.universidad,
  p.curso_actual,
  p.titulacion_finalizada,
  p.puntos_fuertes,
  p.modalidad,
  COALESCE(z.nombre, p.zona_otra) AS zona,
  p.creado_en
FROM app.profesores p
LEFT JOIN catalogo.colegios c ON c.id = p.colegio_id
LEFT JOIN catalogo.zonas    z ON z.id = p.zona_id
WHERE p.estado = 'activo'
  AND p.disponible = TRUE;

COMMENT ON VIEW app.v_directorio IS
  'Lo que se publica. No incluye correo ni apellidos completos, a propósito.';
