-- =============================================================================
-- 20 · La zona de la familia
-- =============================================================================
--
-- El profesor decidía si aceptaba sin saber dónde vive la familia, y aceptar es
-- justo lo que hace que la familia pague. Si luego resultaba que estaban a una
-- hora, había diez euros cobrados por un contacto inútil, un vale que devolver
-- y dos personas descontentas.
--
-- Se guarda el nombre de la zona tal cual («Chamberí», «Getafe») y no un código
-- ni una clave hacia otra tabla. Son cuarenta y tres valores que no cambian, y
-- una tabla de catálogo para eso es una junta más que mantener. Además así la
-- columna se lee sin traducir desde un cliente SQL, que es como la consulta
-- Lucía.
--
-- La lista cerrada vive en `src/shared/datos/zonas.ts` y se valida allí. Aquí
-- **no** hay un CHECK contra los cuarenta y tres nombres a propósito: obligaría
-- a una migración cada vez que se añada un municipio, y el riesgo que corregimos
-- no es que alguien escriba una zona rara, es que escriba su calle. Eso lo
-- impide el desplegable, que no tiene hueco donde escribir.
--
-- Es NULL para todo lo que ya existe, y para las solicitudes a profesores que
-- sólo dan clase online, donde no se pregunta porque no sirve de nada.
-- =============================================================================

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS zona TEXT;

COMMENT ON COLUMN app.contactos.zona IS
  'Distrito de Madrid o municipio donde vive la familia. Lista cerrada, nunca '
  'una dirección. Vacío si el profesor sólo da clase online.';
