-- =============================================================================
-- EL BORRADO A LOS NOVENTA DÍAS NO PODÍA EJECUTARSE
--
-- La tabla exige que toda solicitud tenga al menos un canal de contacto: o
-- correo o teléfono. Es una regla correcta mientras la solicitud está viva,
-- porque una sin ninguna de las dos cosas no serviría para nada.
--
-- Pero la limpieza de los noventa días hace justo eso: a las solicitudes
-- pagadas les vacía el nombre, el teléfono, el correo y el mensaje, y deja las
-- fechas y el importe para que quede constancia de que ese dinero entró. Al
-- vaciar los dos canales, la restricción rechazaba la operación entera.
--
-- Consecuencia, y por eso esto no es un detalle: **los datos de las familias no
-- se habrían borrado nunca**. El fallo estaba dentro de una tarea que captura
-- sus propios errores para que un problema no tumbe a los demás, así que se
-- habría escrito en un registro de Vercel que no lee nadie y ahí se habría
-- quedado. Mientras tanto, la política de privacidad prometía por escrito que
-- los datos se borran solos a los noventa días.
--
-- Todavía no había pasado porque ninguna solicitud pagada tiene noventa días:
-- la plataforma se abrió esta semana. Lo ha encontrado una prueba automática
-- antes que una persona.
--
-- La regla se mantiene para todo lo demás. Sólo se exceptúa lo ya anonimizado,
-- que se reconoce porque su nombre es literalmente «(borrado)».
-- =============================================================================

BEGIN;

ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_algun_canal;

ALTER TABLE app.contactos ADD CONSTRAINT contacto_algun_canal CHECK (
  -- Una solicitud anonimizada no tiene canal, y es exactamente lo que se busca.
  nombre_familia = '(borrado)'
  -- El resto necesita al menos una forma de llegar a la familia.
  OR email_familia IS NOT NULL
  OR telefono_familia IS NOT NULL
);

COMMENT ON CONSTRAINT contacto_algun_canal ON app.contactos IS
  'Toda solicitud viva necesita correo o teléfono. Las anonimizadas a los noventa días no tienen ninguno de los dos, y por eso se exceptúan por el nombre.';

COMMIT;
