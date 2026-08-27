-- =============================================================================
-- RECORDATORIOS DE PAGO Y DEVOLUCIONES · columnas
--
-- Segunda mitad de la migración. **Ejecuta antes 06_estados_nuevos.sql** y
-- espera a que termine: aquí se usan los estados `cancelada` y `devuelta`, y
-- PostgreSQL no deja usar un valor de enum recién creado hasta que la
-- transacción que lo creó ha terminado.
--
-- Por eso son dos ficheros y no uno: el editor de Supabase mete todo el guion
-- en una sola transacción, y juntos fallan con «unsafe use of new value».
-- =============================================================================

BEGIN;

ALTER TABLE app.contactos
  -- Recordatorio de pago
  ADD COLUMN IF NOT EXISTS recordatorio_pago_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS intencion_pago       TEXT,
  ADD COLUMN IF NOT EXISTS cancelada_en         TIMESTAMPTZ,
  -- Devolución
  ADD COLUMN IF NOT EXISTS devuelta_en          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS importe_devuelto     NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS motivo_devolucion    TEXT;

COMMENT ON COLUMN app.contactos.recordatorio_pago_en IS
  'Cuándo se le recordó a la familia que tenía un pago pendiente. Null si aún no se le ha recordado.';
COMMENT ON COLUMN app.contactos.intencion_pago IS
  'Qué contestó al recordatorio: si (va a pagar) o no (lo deja). Null si no ha contestado.';
COMMENT ON COLUMN app.contactos.importe_devuelto IS
  'Lo devuelto de verdad, que puede no coincidir con el importe si hubo un error al cobrar.';

ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_intencion_valida;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_intencion_valida CHECK (
  intencion_pago IS NULL OR intencion_pago IN ('si', 'no')
);

-- Cada estado con su fecha. Sin esto, una solicitud «devuelta» sin fecha de
-- devolución sería imposible de auditar, que es justo lo que veníamos a
-- arreglar.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_fechas_coherentes;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_fechas_coherentes CHECK (
      (estado <> 'aceptada'  OR aceptada_en  IS NOT NULL)
  AND (estado <> 'rechazada' OR rechazada_en IS NOT NULL)
  AND (estado <> 'pagada'    OR pagada_en    IS NOT NULL)
  AND (estado <> 'cancelada' OR cancelada_en IS NOT NULL)
  -- Sólo se devuelve lo que se cobró: una devolución sin pago previo sería un
  -- error de programación, no un caso de negocio.
  AND (estado <> 'devuelta'  OR (devuelta_en IS NOT NULL AND pagada_en IS NOT NULL))
);

-- Por aquí entra la tarea diaria que manda los recordatorios y caduca lo que
-- nadie contesta.
CREATE INDEX IF NOT EXISTS idx_contactos_pago_pendiente
  ON app.contactos (estado, aceptada_en)
  WHERE estado = 'aceptada';

COMMIT;
