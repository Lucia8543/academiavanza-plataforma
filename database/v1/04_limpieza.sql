-- =============================================================================
-- LIMPIEZA
--
-- Quita lo que quedó por el camino. Nada de esto es urgente para que la web
-- funcione, y precisamente por eso conviene hacerlo ahora: una columna muerta
-- no molesta hoy, molesta dentro de seis meses cuando alguien la vea y pierda
-- media hora averiguando si sirve para algo.
--
-- Ninguna de las tres tiene datos que importen. Aun así, esto BORRA cosas: si
-- algo de aquí te chirría, no lo ejecutes y pregunta.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1 · app.contactos.correo_entregado
--
-- Nació para saber si el aviso al profesor había salido. Lo sustituyeron
-- `avisado_push` y `avisado_correo`, que dicen lo mismo y además por qué canal.
-- Desde entonces no la escribe ni la lee nadie.
-- -----------------------------------------------------------------------------
ALTER TABLE app.contactos DROP COLUMN IF EXISTS correo_entregado;


-- -----------------------------------------------------------------------------
-- 2 · app.contactos.modalidad y app.contactos.zona
--
-- Estaban pensadas para que la familia dijera si quería clase online o
-- presencial y en qué zona. El formulario nunca lo pregunta: se decidió pedir
-- lo mínimo, y esas dos cosas se hablan en la primera llamada.
--
-- Si algún día se quieren, se añaden otra vez. Tenerlas vacías sólo hace creer
-- que el dato existe.
-- -----------------------------------------------------------------------------
ALTER TABLE app.contactos DROP COLUMN IF EXISTS modalidad;
ALTER TABLE app.contactos DROP COLUMN IF EXISTS zona;


-- -----------------------------------------------------------------------------
-- 3 · catalogo.zonas
--
-- Un catálogo cerrado de barrios de Madrid que nunca se usó: la zona del
-- profesor se guarda como texto libre en `profesores.zona_otra`, porque nadie
-- supo nunca dónde acaba Chamberí y empieza Almagro y no merece la pena
-- discutirlo.
--
-- Antes hay que rehacer la vista `v_directorio`, que une con `zonas` y por eso
-- impide borrar la columna. La aplicación no la usa —las consultas van por
-- Prisma— pero se mantiene porque es cómoda para mirar el directorio desde un
-- cliente SQL sin escribir seis JOIN.
--
-- La columna `zona_id` está a NULL en todas las filas.
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS app.v_directorio;

ALTER TABLE app.profesores DROP COLUMN IF EXISTS zona_id;
DROP TABLE IF EXISTS catalogo.zonas;

CREATE VIEW app.v_directorio AS
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
  p.zona_otra AS zona,
  p.creado_en
FROM app.profesores p
LEFT JOIN catalogo.colegios c ON c.id = p.colegio_id
WHERE p.estado = 'activo'
  AND p.disponible = TRUE;

COMMENT ON VIEW app.v_directorio IS
  'Lo que se publica. No incluye correo, ni teléfono, ni apellidos completos, a propósito.';

COMMIT;
