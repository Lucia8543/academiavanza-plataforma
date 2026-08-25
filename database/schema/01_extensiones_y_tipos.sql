-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 01: Extensiones y tipos enumerados
-- Motor: PostgreSQL 15+ (Supabase)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensiones
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";        -- texto case-insensitive (emails)
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- búsquedas ignorando acentos
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- búsqueda por similitud de texto

-- -----------------------------------------------------------------------------
-- Esquemas lógicos
--   app        → tablas operativas del producto
--   catalogo   → tablas maestras de referencia (colegios, asignaturas, niveles)
--   legacy     → datos crudos importados del Excel histórico (solo lectura)
--   auditoria  → trazas de cambios y accesos
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS catalogo;
CREATE SCHEMA IF NOT EXISTS legacy;
CREATE SCHEMA IF NOT EXISTS auditoria;

COMMENT ON SCHEMA app       IS 'Tablas operativas de la plataforma';
COMMENT ON SCHEMA catalogo  IS 'Tablas maestras de referencia, mantenidas por administración';
COMMENT ON SCHEMA legacy    IS 'Volcado crudo del Excel histórico. Solo lectura tras la carga inicial.';
COMMENT ON SCHEMA auditoria IS 'Registro de cambios y accesos para trazabilidad';

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- Se usan ENUM en lugar de CHECK cuando el conjunto de valores es cerrado,
-- estable y consultado con frecuencia. Añadir un valor requiere ALTER TYPE,
-- que en PostgreSQL 12+ no bloquea la tabla.
-- -----------------------------------------------------------------------------

-- Rol del usuario dentro de la plataforma
CREATE TYPE app.rol_usuario AS ENUM (
  'familia',
  'profesor',
  'admin'
);

-- Ciclo de vida del perfil de un profesor
CREATE TYPE app.estado_profesor AS ENUM (
  'importado',      -- migrado del Excel, aún sin reclamar por el profesor
  'registrado',     -- se ha registrado pero no ha completado el perfil
  'pendiente',      -- perfil completo, esperando aprobación de administración
  'activo',         -- aprobado y visible en el directorio
  'pausado',        -- el profesor lo ha desactivado temporalmente
  'inactivo',       -- dado de baja
  'rechazado'       -- no aprobado por administración
);

-- Ciclo de vida de una propuesta de contacto (familia → profesor)
--
--   enviada ──> aceptada ──> pagada ──> (contacto revelado)
--      │            │
--      │            └──> caducada_pago   (aceptada pero la familia no pagó)
--      ├──> rechazada
--      └──> caducada                     (el profesor no respondió a tiempo)
--
CREATE TYPE app.estado_propuesta AS ENUM (
  'enviada',
  'aceptada',
  'rechazada',
  'caducada',
  'pagada',
  'caducada_pago',
  'cancelada'       -- retirada por la familia antes de respuesta
);

-- Modalidad de impartición
CREATE TYPE app.modalidad AS ENUM (
  'online',
  'presencial',
  'ambas'
);

-- Etapa educativa (agrupador de niveles)
CREATE TYPE catalogo.etapa_educativa AS ENUM (
  'primaria',
  'eso',
  'bachillerato',
  'evau',
  'universidad',
  'otros'
);

-- Estado de un pago
CREATE TYPE app.estado_pago AS ENUM (
  'pendiente',
  'completado',
  'fallido',
  'reembolsado'
);

-- Estado de moderación de una reseña
CREATE TYPE app.estado_resena AS ENUM (
  'pendiente',
  'publicada',
  'oculta'
);

-- Procedencia de un registro: sirve para saber qué datos vienen del Excel
-- y cuáles ha introducido el propio usuario.
CREATE TYPE app.origen_dato AS ENUM (
  'migracion',      -- cargado desde el Excel histórico
  'autoregistro',   -- introducido por el propio usuario
  'admin'           -- introducido manualmente por administración
);
