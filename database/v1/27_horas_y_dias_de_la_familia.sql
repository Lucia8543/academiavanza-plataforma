-- =============================================================================
-- 27 · Cuántas horas por semana y qué días le vienen bien a la familia
-- =============================================================================
--
-- Lo pidió una profesora, y tenía razón. Hasta ahora, cuando le llegaba una
-- propuesta sólo veía el curso, la zona y el texto libre que hubiera escrito la
-- familia. Con eso no se puede saber si el horario encaja, y **el profesor sólo
-- tiene un momento para decir que sí o que no**: el de aceptar, que es el que
-- hace que la familia pague.
--
-- El riesgo no es que conteste mal, es lo que hace cuando no puede decidir. O
-- rechaza una propuesta que le habría venido bien, o le pide el teléfono a la
-- familia antes de aceptar para poder preguntárselo. Lo segundo se salta lo
-- único que cobra la plataforma, y por un motivo perfectamente razonable. Es el
-- mismo agujero que abrió en su día la zona cuando se perdía sin dar error.
--
-- LAS DOS SON OPCIONALES, Y ES DELIBERADO
--
-- Una familia que escribe en septiembre muchas veces no sabe todavía cuántas
-- horas va a necesitar: depende de cómo arranque el curso. Obligar a contestar
-- convertiría un dato útil en un dato inventado, que es peor que no tenerlo,
-- porque el profesor decidiría sobre algo falso.
--
-- POR QUÉ HORAS EN TEXTO Y NO UN NÚMERO
--
-- Porque «todavía no lo sé» es una respuesta legítima y un entero no la puede
-- representar. Un NULL diría lo mismo, pero no distingue a quien lo pensó y no
-- lo sabe de quien pasó del campo. Para el profesor esa diferencia importa: la
-- primera es una conversación pendiente y la segunda es un silencio.
--
-- POR QUÉ LOS DÍAS SIN FRANJA HORARIA
--
-- Las franjas ya las declara el profesor en su rejilla. Pedirle a una madre que
-- rellene una rejilla de siete días por tres franjas en el móvil es perder
-- solicitudes, y el CLAUDE.md deja el calendario fuera de alcance. Con los días
-- basta para descartar lo imposible, que es de lo que se trata: lo concreto lo
-- acuerdan ellos cuando hablen.
-- =============================================================================

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS horas_semana TEXT;

COMMENT ON COLUMN app.contactos.horas_semana IS
  'Horas de clase por semana que estima la familia. Nulo si no contestó; '
  '«no-lo-se» si contestó que todavía no lo sabe. No son lo mismo.';

ALTER TABLE app.contactos
  DROP CONSTRAINT IF EXISTS contacto_horas_semana_valida;

ALTER TABLE app.contactos
  ADD CONSTRAINT contacto_horas_semana_valida
  CHECK (
    horas_semana IS NULL
    OR horas_semana IN ('1', '2', '3', 'mas-de-3', 'no-lo-se')
  );

-- Los días, como una lista corta de números de 1 a 7, igual que
-- `profesor_disponibilidad.dia_semana`. Se guardan en un array y no en una
-- tabla aparte porque no hay nada que consultar por día: es un dato que se
-- enseña entero al profesor y nunca se filtra ni se agrega.
ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS dias_preferidos SMALLINT[];

COMMENT ON COLUMN app.contactos.dias_preferidos IS
  'Días de la semana que le vendrían bien a la familia, de 1 (lunes) a 7 '
  '(domingo). Nulo o vacío si le da igual o no contestó.';

-- Un array con un día repetido o con un 9 dentro no es un despiste de formato:
-- es un envío hecho a mano. Que lo pare la base de datos y no sólo el
-- formulario, que es la única barrera que nadie puede saltarse.
--
-- POR QUÉ ESTO ES UNA FUNCIÓN Y NO UN `CHECK` A SECAS
--
-- Porque la primera versión lo era y PostgreSQL la rechazó:
--
--     ERROR: 0A000: cannot use subquery in check constraint
--
-- Y la negativa es razonable. Un `CHECK` tiene que poder decidirse mirando sólo
-- la fila que se está guardando; en cuanto lleva un `SELECT` dentro, deja de
-- estar garantizado que dé siempre la misma respuesta para los mismos datos, y
-- una restricción que puede cambiar de opinión no restringe nada.
--
-- Aquí el `SELECT` era sobre `unnest()` de la propia columna, o sea que sólo
-- miraba la fila, pero el motor no distingue esos casos y no va a hacerlo.
-- Declararlo como una función `IMMUTABLE` es decirle explícitamente lo que él no
-- puede deducir: esto depende de su argumento y de nada más.
CREATE OR REPLACE FUNCTION app.dias_preferidos_validos(dias SMALLINT[])
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    dias IS NULL
    OR (
      coalesce(array_length(dias, 1), 0) <= 7
      AND dias <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::SMALLINT[]
      -- Sin repetidos: tantos elementos como valores distintos.
      AND coalesce(array_length(dias, 1), 0) = (
        SELECT count(DISTINCT d) FROM unnest(dias) AS d
      )
    );
$$;

COMMENT ON FUNCTION app.dias_preferidos_validos(SMALLINT[]) IS
  'Vigila la columna contactos.dias_preferidos. Existe como función y no dentro '
  'del CHECK porque PostgreSQL no admite subconsultas ahí, ni siquiera sobre la '
  'propia fila.';

ALTER TABLE app.contactos
  DROP CONSTRAINT IF EXISTS contacto_dias_preferidos_validos;

ALTER TABLE app.contactos
  ADD CONSTRAINT contacto_dias_preferidos_validos
  CHECK (app.dias_preferidos_validos(dias_preferidos));
