-- =============================================================================
-- 25 · La trampa antibots deja de borrar y pasa a etiquetar
-- =============================================================================
--
-- Hasta ahora, cuando la trampa saltaba, el formulario se tiraba a la basura y
-- a quien lo había enviado se le decía «recibido». Ni fila, ni correo, ni
-- registro. Costó fichas de profesoras reales, porque el campo señuelo se
-- llamaba `apellido2` y el autorrelleno del navegador lo completaba solo.
--
-- El nombre del campo ya se cambió, pero eso arreglaba el síntoma. El fallo de
-- fondo era el diseño: **una decisión automática e irreversible sobre algo que
-- no se puede recuperar**. Cualquier trampa se equivoca alguna vez; lo que no
-- puede pasar es que su equivocación sea invisible y definitiva.
--
-- A partir de aquí no se descarta nada. Lo que la trampa detecta se guarda
-- igual, con una etiqueta que dice por qué resultó sospechoso, y esa etiqueta
-- sale en el panel. La decisión de publicar una ficha ya la tomaba una persona;
-- ahora la toma con un dato más delante.
--
-- POR QUÉ UNA COLUMNA DE TEXTO Y NO UN «SÍ O NO». Porque «sospechoso» no es una
-- sola cosa. No es lo mismo un envío que llegó en medio segundo, que sólo puede
-- ser un guion automático, que un señuelo relleno, que casi siempre es el
-- navegador de una persona rellenando campos por ella. Con un booleano las dos
-- se leerían igual en el panel y la segunda haría desconfiar de gente real.
--
-- NULL es lo normal y significa que no hubo nada raro.
-- =============================================================================

BEGIN;

-- Los tres formularios abiertos al público. Los tres llevaban la misma trampa y
-- los tres la tenían con el mismo problema.
ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS sospecha_bot TEXT;

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS sospecha_bot TEXT;

ALTER TABLE app.incidencias
  ADD COLUMN IF NOT EXISTS sospecha_bot TEXT;

COMMENT ON COLUMN app.profesores.sospecha_bot IS
  'Por qué la trampa antibots desconfió de este envío, o NULL si no desconfió. '
  'No bloquea nada: sale en el panel para que quien revisa lo tenga en cuenta.';

COMMENT ON COLUMN app.contactos.sospecha_bot IS
  'Igual que en profesores. Una solicitud marcada se tramita con normalidad: '
  'la familia no puede quedarse sin respuesta por una sospecha nuestra.';

COMMENT ON COLUMN app.incidencias.sospecha_bot IS
  'Igual que en profesores. El buzón se lee entero, así que la etiqueta sólo '
  'sirve para saber por dónde empezar cuando llegan muchas de golpe.';

/*
 * Los dos únicos valores posibles, más NULL.
 *
 * La restricción está para que el día que alguien añada una tercera señal se
 * acuerde de pasar por aquí. Sin ella, una etiqueta mal escrita en el código
 * entraría en silencio y el filtro del panel dejaría de encontrarla, que es
 * exactamente la clase de fallo que este fichero viene a evitar.
 */
ALTER TABLE app.profesores DROP CONSTRAINT IF EXISTS prof_sospecha_conocida;
ALTER TABLE app.profesores ADD CONSTRAINT prof_sospecha_conocida CHECK (
  sospecha_bot IS NULL OR sospecha_bot IN ('trampa', 'demasiado-rapido')
);

ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS cont_sospecha_conocida;
ALTER TABLE app.contactos ADD CONSTRAINT cont_sospecha_conocida CHECK (
  sospecha_bot IS NULL OR sospecha_bot IN ('trampa', 'demasiado-rapido')
);

ALTER TABLE app.incidencias DROP CONSTRAINT IF EXISTS inci_sospecha_conocida;
ALTER TABLE app.incidencias ADD CONSTRAINT inci_sospecha_conocida CHECK (
  sospecha_bot IS NULL OR sospecha_bot IN ('trampa', 'demasiado-rapido')
);

/*
 * Índices parciales, que sólo ocupan lo que hay marcado.
 *
 * El panel filtra por «enséñame las sospechosas», y lo normal es que no haya
 * ninguna. Un índice completo sobre una columna casi siempre nula ocuparía
 * tanto como la tabla para no servir de nada; éste sólo guarda las filas que
 * de verdad se van a buscar.
 */
CREATE INDEX IF NOT EXISTS idx_profesores_sospecha
  ON app.profesores (creado_en DESC) WHERE sospecha_bot IS NOT NULL;

-- En `contactos` la fecha de alta se llama `enviado_en`, no `creado_en`.
CREATE INDEX IF NOT EXISTS idx_contactos_sospecha
  ON app.contactos (enviado_en DESC) WHERE sospecha_bot IS NOT NULL;

COMMIT;

-- Para ver de un vistazo cuántas hay marcadas y de qué tipo.
--
--   SELECT sospecha_bot, count(*) FROM app.profesores
--    WHERE sospecha_bot IS NOT NULL GROUP BY 1;
