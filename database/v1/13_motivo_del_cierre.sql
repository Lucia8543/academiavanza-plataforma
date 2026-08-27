-- =============================================================================
-- POR QUÉ NO SIGUIÓ
--
-- Hasta ahora, cuando una familia se iba, el profesor no se enteraba de por qué.
-- Y con frecuencia el motivo no tenía nada que ver con él: el horario, la
-- distancia, o que encontraron a alguien antes. Un profesor que sólo ve que le
-- han dejado se lleva a casa la peor explicación posible, que es la que se
-- inventa él solo.
--
-- Esta columna guarda el motivo, elegido de una lista cerrada. Cerrada por dos
-- razones: un campo de texto libre en un formulario que rellenan familias con
-- hijos menores acaba conteniendo el nombre del niño o su diagnóstico, y además
-- un vocabulario común es lo único que permite contar. Seis familias diciendo
-- «el precio no me encajaba» no hablan de seis profesores: hablan de que los
-- precios de referencia están mal.
--
-- Convive con motivo_vale y no lo sustituye. Aquél dice qué pasó a efectos del
-- vale —si hubo contacto o no, que es lo que puede pausar una ficha—; éste dice
-- por qué, y también se rellena en solicitudes que nunca llegaron a pagarse y
-- que por tanto no tienen vale ninguno.
-- =============================================================================

BEGIN;

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS motivo_cierre    TEXT,
  ADD COLUMN IF NOT EXISTS motivo_cierre_en TIMESTAMPTZ;

COMMENT ON COLUMN app.contactos.motivo_cierre IS
  'Por qué la familia no siguió con este profesor. Lista cerrada; el vocabulario vive en src/shared/textos/motivos-cierre.ts y las dos listas tienen que coincidir.';
COMMENT ON COLUMN app.contactos.motivo_cierre_en IS
  'Cuándo lo contestó. Distingue el silencio de la negativa: sin fecha es que no se le llegó a preguntar.';

-- La lista tiene que ser la misma que la de motivos-cierre.ts. Si aquí se añade
-- un valor y allí no, el panel del profesor enseñará un motivo en blanco; si se
-- añade allí y aquí no, el formulario reventará al guardar. Se tocan las dos.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_motivo_cierre_valido;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_motivo_cierre_valido CHECK (
  motivo_cierre IS NULL OR motivo_cierre IN (
    'sin-contacto',
    'coste-contacto',
    'precio-clases',
    'horarios',
    'distancia',
    'perfil',
    'otra-persona',
    'no-encajamos',
    'ya-no-hace-falta'
  )
);

-- El motivo y su fecha van juntos o no van. Un motivo sin fecha impediría saber
-- si es de esta semana o de hace dos años, y la página del profesor sólo enseña
-- los recientes.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_motivo_cierre_con_fecha;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_motivo_cierre_con_fecha CHECK (
  (motivo_cierre IS NULL) = (motivo_cierre_en IS NULL)
);

-- Para la página del profesor, que pide los motivos de un profesor concreto y
-- ordenados por fecha. Sin esto haría un recorrido completo de la tabla cada vez
-- que alguien abre su ficha.
CREATE INDEX IF NOT EXISTS idx_contactos_motivo_cierre
  ON app.contactos (profesor_id, motivo_cierre_en DESC)
  WHERE motivo_cierre IS NOT NULL;

COMMIT;
