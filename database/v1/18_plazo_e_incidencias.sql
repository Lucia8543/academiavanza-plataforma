-- =============================================================================
-- DOS COSAS QUE VIENEN DE ESCUCHAR A QUIEN USA ESTO
--
-- 1. EL PLAZO LO ELIGE LA FAMILIA
--
-- Hasta ahora todas las solicitudes caducaban al mismo número de días, y ese
-- número no podía estar bien para todo el mundo: quien busca clases para el
-- examen del jueves y quien busca profesor para octubre no esperan lo mismo. A
-- la primera, un mes la deja tirada; a la segunda, una semana le cierra una
-- solicitud que no tenía ninguna prisa.
--
-- Lo elige quien lo sabe, que es la familia, y se le dice a las dos partes desde
-- el primer correo. Un plazo que sólo conoce el servidor no es un plazo.
--
-- 2. UN SITIO DONDE CONTAR QUE ALGO NO FUNCIONA
--
-- No hay ninguno. Quien se atasca cierra la pestaña y no se entera nadie, y son
-- justamente los fallos más caros: los que hacen que alguien se vaya sin
-- escribir a ningún profesor. Un correo a info@ no vale, porque exige que
-- alguien lea el correo y lo apunte en algún sitio.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Para cuándo lo necesita la familia
-- -----------------------------------------------------------------------------

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS urgencia TEXT NOT NULL DEFAULT 'ya';

-- Vocabulario cerrado. Los días que corresponden a cada valor viven en
-- `shared/reglas/cobro.ts` y no aquí: cambiarlos es una decisión de producto y
-- no debe exigir una migración.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_urgencia_valida;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_urgencia_valida
  CHECK (urgencia IN ('ya', 'semanas', 'adelante'));

COMMENT ON COLUMN app.contactos.urgencia IS
  'Para cuándo necesita la familia las clases. Decide en cuántos días caduca la solicitud si el profesor no contesta.';

-- Las solicitudes que ya existen se quedan en 'ya' por el DEFAULT, que es el
-- plazo más corto. Es deliberado: son de antes de que esto existiera y llevan
-- esperando desde entonces.

-- -----------------------------------------------------------------------------
-- El buzón de fallos
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app.incidencias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quién escribe, hasta donde se sepa. No se le pregunta: se deduce de la
  -- página desde la que abrió el buzón. Preguntarlo sería una barrera más en un
  -- formulario que existe para que la gente se moleste en escribirlo.
  quien       TEXT NOT NULL DEFAULT 'visita',

  -- Lo que cuenta. Es el campo que importa y el único obligatorio.
  texto       TEXT NOT NULL,

  -- Desde qué página escribió. Sirve para reproducir el fallo sin tener que
  -- preguntarle. Se guarda sólo la ruta, nunca la dirección completa: las de
  -- esta plataforma llevan el token dentro y ése es la llave de alguien.
  pagina      TEXT,

  -- Por si quiere que le contesten. Opcional a propósito.
  email       TEXT,

  estado      TEXT NOT NULL DEFAULT 'nueva',
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resuelto_en TIMESTAMPTZ,

  CONSTRAINT incidencia_texto_util
    CHECK (char_length(btrim(texto)) BETWEEN 10 AND 2000),
  CONSTRAINT incidencia_quien_valido
    CHECK (quien IN ('familia', 'profesor', 'visita')),
  CONSTRAINT incidencia_estado_valido
    CHECK (estado IN ('nueva', 'vista', 'resuelta')),
  -- Una incidencia resuelta tiene fecha de resolución, igual que en `contactos`.
  -- Una fila a medias no puede existir.
  CONSTRAINT incidencia_fechas_coherentes
    CHECK (estado <> 'resuelta' OR resuelto_en IS NOT NULL),
  -- Sin token en la ruta, por si alguna vez se guardara la dirección entera.
  CONSTRAINT incidencia_pagina_sin_token
    CHECK (pagina IS NULL OR char_length(pagina) <= 120)
);

COMMENT ON TABLE app.incidencias IS
  'Fallos y sugerencias que cuentan familias, profesores y visitantes. No contiene datos de menores ni de contacto salvo el correo que la persona dé voluntariamente.';

-- La consulta del panel es siempre la misma: las nuevas primero.
CREATE INDEX IF NOT EXISTS idx_incidencias_pendientes
  ON app.incidencias (creado_en DESC)
  WHERE estado <> 'resuelta';

COMMIT;
