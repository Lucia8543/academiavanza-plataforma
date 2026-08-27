-- =============================================================================
-- PRECIOS DE REFERENCIA POR CURSO
--
-- Hasta ahora la web no decía nada de cuánto cuesta una clase, y ése era el
-- hueco más caro que quedaba: una familia pagaba el contacto, llamaba, y
-- descubría una tarifa que no podía permitirse. Sin clases, sin acuerdo, y una
-- devolución.
--
-- No es un precio impuesto. Es la referencia de lo que se ha venido cobrando,
-- para que las dos partes empiecen la conversación desde el mismo sitio. El
-- precio final lo acuerdan ellos, y la web lo dice en cada pantalla donde
-- aparece un importe.
--
-- Viven en el catálogo y no en el código por el mismo motivo que la tarifa del
-- match: cambiar un precio no puede exigir un despliegue.
-- =============================================================================

BEGIN;

ALTER TABLE catalogo.niveles
  ADD COLUMN IF NOT EXISTS precio_referencia NUMERIC(6,2);

COMMENT ON COLUMN catalogo.niveles.precio_referencia IS
  'Euros por hora orientativos para este curso. NULL si no hay referencia. Lo acordado entre familia y profesor manda.';

ALTER TABLE catalogo.niveles DROP CONSTRAINT IF EXISTS nivel_precio_valido;
ALTER TABLE catalogo.niveles ADD CONSTRAINT nivel_precio_valido CHECK (
  precio_referencia IS NULL
  OR (precio_referencia > 0 AND precio_referencia <= 200)
);

-- Primaria
UPDATE catalogo.niveles SET precio_referencia = 15.00
 WHERE etapa = 'primaria';

-- ESO
UPDATE catalogo.niveles SET precio_referencia = 16.00
 WHERE etapa = 'eso';

-- Bachillerato, por curso: segundo cuesta más porque es el año de la EvAU.
UPDATE catalogo.niveles SET precio_referencia = 17.00 WHERE slug = 'bach-1';
UPDATE catalogo.niveles SET precio_referencia = 18.00 WHERE slug = 'bach-2';

-- La preparación de la EvAU son los mismos alumnos de segundo y el mismo
-- temario, así que va al mismo precio. Si se quisiera distinto, se cambia aquí.
UPDATE catalogo.niveles SET precio_referencia = 18.00 WHERE slug = 'evau';

-- Universidad y «otros» se quedan sin referencia a propósito: son casos muy
-- desiguales y poner un número sería inventárselo.

COMMIT;
