-- =============================================================================
-- 21 · El barrio, dentro del distrito
-- =============================================================================
--
-- La 20 dejó el distrito, y en la mayor parte de Madrid con eso basta para que
-- un profesor decida si le compensa ir. Donde no basta es en los distritos
-- grandes: Fuencarral-El Pardo llega desde Tetuán hasta la sierra, y Latina y
-- Carabanchel son enormes. Saber que la familia vive «en Latina» no resuelve
-- nada.
--
-- Va en columna aparte y no pegado al distrito en la misma celda. Así se puede
-- contar cuántas solicitudes vienen de cada distrito sin tener que partir
-- cadenas, y una familia que sólo diga el distrito no obliga a inventar un
-- valor de relleno.
--
-- **Es opcional a propósito.** Mucha gente no sabe el nombre oficial de su
-- barrio: quien vive en Ríos Rosas dice «Chamberí» antes que «Vallehermoso»,
-- que es el de al lado. Obligar a acertar convertiría un formulario que se
-- rellena en uno que se abandona.
--
-- La lista de qué barrio pertenece a qué distrito vive en
-- `src/shared/datos/zonas.ts` y se valida allí, igual que las zonas.
-- =============================================================================

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS barrio TEXT;

COMMENT ON COLUMN app.contactos.barrio IS
  'Barrio dentro del distrito, opcional. Vacío si la familia no lo precisó o '
  'si vive fuera de Madrid capital. Nunca una dirección.';

-- El barrio sin distrito no significa nada, y sería un dato huérfano imposible
-- de interpretar seis meses después. Que lo impida la base de datos y no sólo
-- el formulario: es la única barrera que no se puede saltar.
ALTER TABLE app.contactos
  DROP CONSTRAINT IF EXISTS contacto_barrio_exige_zona;

ALTER TABLE app.contactos
  ADD CONSTRAINT contacto_barrio_exige_zona
  CHECK (barrio IS NULL OR zona IS NOT NULL);
