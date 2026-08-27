-- =============================================================================
-- EL VALE, SIN QUE INTERVENGA NADIE
--
-- Hasta ahora el vale lo concedía Lucía a mano desde el panel. Eso convertía en
-- dependiente de una persona justo el momento en que una familia está enfadada:
-- ha pagado, no ha funcionado, y tiene que escribir un correo y esperar.
--
-- A partir de aquí lo pide la propia familia desde su página de seguimiento, y
-- se le concede al momento. Se guarda POR QUÉ lo pidió, que es el dato que de
-- verdad importa: distingue «el profesor no me cogió el teléfono» de «dimos dos
-- clases y no encajamos», y sólo el primero dice algo del profesor.
-- =============================================================================

BEGIN;

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS motivo_vale    TEXT,
  ADD COLUMN IF NOT EXISTS vale_pedido_en TIMESTAMPTZ;

COMMENT ON COLUMN app.contactos.motivo_vale IS
  'Por qué se pidió el vale: sin-contacto (no llegaron a hablar) o no-funciono (hablaron y no cuajó).';
COMMENT ON COLUMN app.contactos.vale_pedido_en IS
  'Cuándo lo pidió la familia. Sirve para ver si el problema se concentra en fechas o en profesores.';

-- Sólo dos motivos posibles, y sólo si hay vale. Un motivo suelto sin vale
-- concedido sería un dato que no significa nada.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_motivo_vale_valido;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_motivo_vale_valido CHECK (
  motivo_vale IS NULL OR motivo_vale IN ('sin-contacto', 'no-funciono')
);

-- Para contar rápido cuántas veces le ha pasado a un mismo profesor. Es lo que
-- dispara la pausa automática de su ficha.
CREATE INDEX IF NOT EXISTS idx_contactos_vales
  ON app.contactos (profesor_id, motivo_vale)
  WHERE motivo_vale IS NOT NULL;

COMMIT;
