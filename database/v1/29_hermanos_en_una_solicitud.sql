-- =============================================================================
-- 29 · Una solicitud puede ser para varios hermanos
-- =============================================================================
--
-- EL CASO QUE LO PIDIÓ
--
-- Una madre quería tres horas a la semana para su hija y dos para su hijo, con
-- la misma profesora. El formulario sólo admitía un curso, así que tuvo que
-- elegir por cuál de los dos preguntaba, y como no sabía cuál encajaría mejor
-- acabó escribiendo a varios profesores a la vez. Salió un lío que hubo que
-- deshacer a mano, que es exactamente lo que este proyecto existe para no tener.
--
-- El fallo no era de la madre. Era que la plataforma no tenía forma de
-- representar «dos hermanos», y lo que no se puede decir se cuenta mal.
--
-- POR QUÉ UNA TABLA Y NO DOS COLUMNAS MÁS
--
-- La salida rápida era `nivel_id_2` y `horas_semana_2`. Se descartó por una
-- razón concreta y no por elegancia: **lo que viene después no cabe ahí.** La
-- familia puede decir que le vale con que el profesor coja a uno de los dos, y
-- entonces es él quien elige cuál. Para eso hace falta poder marcar la decisión
-- de cada hermano por separado, y una columna suelta no tiene dónde guardarla.
--
-- QUÉ SE GUARDA DE CADA HERMANO, Y QUÉ NO
--
-- El curso y las horas. Nada más. Ni nombre, ni edad, ni colegio, igual que
-- hasta ahora: son menores y para que dos adultos se pongan de acuerdo en una
-- primera llamada no hace falta. Un curso no identifica a nadie.
--
-- LA DUPLICIDAD QUE SE ASUME, Y POR QUÉ
--
-- `contactos.nivel_id` y `contactos.horas_semana` no se vacían. Siguen llevando
-- los del primer hermano, porque de ahí leen el panel de cobros, los correos,
-- la lista de «tus otras solicitudes» y el histórico entero. Vaciarlos habría
-- convertido esta migración en una reescritura de media plataforma el mismo día
-- que se toca el formulario.
--
-- Es un dato en dos sitios y eso siempre se paga. La regla que lo mantiene
-- honesto es una sola, y está escrita también en `services/solicitud.ts`:
--
--     manda `contacto_alumnos`; lo de `contactos` es un reflejo del primero y
--     se escribe en un único lugar, al crear la solicitud.
--
-- Si algún día se rompe, el síntoma será una solicitud que dice un curso en el
-- correo y otro en la pantalla. Hay una prueba que lo vigila.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app.contacto_alumnos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contacto_id UUID NOT NULL
    REFERENCES app.contactos (id) ON DELETE CASCADE,

  -- 1 es el primero, el que también se refleja en `contactos`. El orden es el
  -- de la pantalla, no una prioridad: la familia no ordena a sus hijos.
  orden       SMALLINT NOT NULL,

  -- `niveles` vive en `catalogo`, no en `app`. Es el catálogo de cursos, lo
  -- comparten todos y no lleva dato de nadie.
  nivel_id    UUID REFERENCES catalogo.niveles (id),

  -- Mismo vocabulario que `contactos.horas_semana`, incluido el histórico.
  -- Aquí no hace falta admitir `mas-de-3` para filas viejas —esta tabla nace
  -- después de la migración 28— pero se acepta igual, porque el día que alguien
  -- copie una solicitud antigua a este formato no queremos que reviente.
  horas_semana TEXT,

  /*
   * Qué ha decidido el profesor sobre este hermano en concreto.
   *
   * NULL mientras no ha contestado. TRUE si lo coge. FALSE si a éste no.
   *
   * Los tres valores hacen falta y no valen dos. Un booleano con `false` por
   * defecto diría «no lo coge» desde el primer segundo, y la pantalla de la
   * familia no podría distinguir «todavía no ha contestado» de «ha dicho que a
   * este niño no». Es la misma diferencia que ya existe entre no contestar a
   * las horas y contestar «todavía no lo sé».
   */
  aceptado    BOOLEAN,

  CONSTRAINT contacto_alumno_orden_valido
    CHECK (orden BETWEEN 1 AND 3),

  CONSTRAINT contacto_alumno_horas_validas
    CHECK (
      horas_semana IS NULL
      OR horas_semana IN ('1', '2', '3', '4', '5-o-mas', 'no-lo-se', 'mas-de-3')
    ),

  -- No puede haber dos hermanos en la misma posición. Es lo que impide que un
  -- envío repetido duplique filas en silencio.
  CONSTRAINT contacto_alumno_unico UNIQUE (contacto_id, orden)
);

COMMENT ON TABLE app.contacto_alumnos IS
  'Los alumnos de una solicitud, uno por fila. Sólo curso y horas: ningún dato '
  'que identifique al menor. La fila de orden 1 se refleja en contactos.nivel_id '
  'y contactos.horas_semana por compatibilidad, y esta tabla es la que manda.';

COMMENT ON COLUMN app.contacto_alumnos.aceptado IS
  'NULL mientras el profesor no contesta; TRUE si coge a este alumno; FALSE si a '
  'este no. Los tres valores son distintos y ninguno sobra.';

-- La consulta que se hace siempre: todos los alumnos de una solicitud, en orden.
CREATE INDEX IF NOT EXISTS idx_contacto_alumnos_solicitud
  ON app.contacto_alumnos (contacto_id, orden);

-- ---------------------------------------------------------------------------
-- Y la pregunta que hace posible que el profesor elija.
-- ---------------------------------------------------------------------------
--
-- «¿Necesitas que este profesor coja a los dos, o te vale con que coja a uno?»
--
-- Sin esto, un profesor que sólo puede con uno de los dos tiene que decir que
-- no a todo, y la familia se queda sin nadie teniendo media solución delante.
-- Con esto, decide él, que es el único que sabe cómo tiene la tarde.
--
-- Por defecto en falso: quien no conteste, o quien mande una solicitud de un
-- solo alumno, está pidiendo lo de siempre. La opción tiene que marcarse a
-- propósito porque cambia lo que el profesor puede hacer.
ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS vale_con_uno BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN app.contactos.vale_con_uno IS
  'La familia acepta que el profesor coja sólo a alguno de los hermanos. Falso '
  'en las solicitudes de un solo alumno, donde no significa nada.';

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------
--
-- Los privilegios por defecto del esquema ya cubren las tablas nuevas, pero
-- sólo si las crea el mismo rol que los configuró. Esto se ejecuta a mano desde
-- el editor de Supabase, así que se conceden explícitamente, igual que hizo la
-- migración 15 y por el mismo motivo.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academiavanza_app') THEN
    GRANT SELECT, INSERT, UPDATE ON app.contacto_alumnos TO academiavanza_app;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academiavanza_lectura') THEN
    GRANT SELECT ON app.contacto_alumnos TO academiavanza_lectura;
  END IF;
END $$;

COMMIT;
