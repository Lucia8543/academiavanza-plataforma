-- =============================================================================
-- 23 · El enlace del panel deja de estar guardado en claro
-- =============================================================================
--
-- La columna se llama `token_hash` desde el primer día y su comentario decía
-- «el código original no se guarda en ningún sitio». No era verdad: el enlace
-- del panel se generaba al azar y se guardaba tal cual, y quien pudiera leer
-- esta tabla podía entrar en el panel de cualquier profesor, aceptar o rechazar
-- solicitudes en su nombre y ver el teléfono de una familia que ya había pagado.
--
-- A partir de ahora se guarda la huella SHA-256 en hexadecimal, y el enlace se
-- deriva de un secreto que vive fuera de la base de datos.
--
-- **A nadie se le rompe el enlace.** Los que ya están enviados siguen valiendo
-- porque aquí se calcula su huella sin necesitar el original: se hashea lo que
-- hay. Cuando alguien entre con su enlace de siempre, el servidor calculará esa
-- misma huella y lo encontrará.
--
-- La condición del WHERE es lo que hace que esto se pueda ejecutar dos veces sin
-- estropear nada: una huella hexadecimal de SHA-256 mide exactamente 64
-- caracteres, y los enlaces guardados en claro miden 43. Lo que ya está hasheado
-- no se vuelve a hashear.
--
-- ORDEN DE APLICACIÓN. Da igual si esto va antes o después del despliegue: el
-- código acepta durante un tiempo las dos formas, la huella y el enlace en
-- claro, justamente para que este paso no tenga que coordinarse con nada.
-- =============================================================================

BEGIN;

UPDATE app.accesos
   SET token_hash = encode(sha256(token_hash::bytea), 'hex')
 WHERE length(token_hash) <> 64;

COMMENT ON COLUMN app.accesos.token_hash IS
  'Huella SHA-256 en hexadecimal del enlace, 64 caracteres. El enlace original '
  'no se guarda: se deriva de ACCESO_SECRET y del identificador del profesor.';

COMMIT;

-- Comprobación posterior, para ejecutar a mano. Tiene que devolver cero.
--
--   SELECT count(*) FROM app.accesos WHERE length(token_hash) <> 64;
--
-- Cuando dé cero, se puede quitar del código la rama que todavía acepta el
-- enlace en claro, en `src/backend/services/acceso-profesor.ts`.
