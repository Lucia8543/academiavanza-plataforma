-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 04: Profesores y su oferta académica
-- =============================================================================

CREATE TABLE app.profesores (
  id                      UUID PRIMARY KEY REFERENCES app.perfiles(id) ON DELETE CASCADE,

  -- URL pública del perfil: /profesores/lucia-ordovas-a3f2
  slug                    TEXT NOT NULL UNIQUE,

  -- ---------------------------------------------------------------------------
  -- Procedencia académica: el diferencial del producto
  -- ---------------------------------------------------------------------------
  colegio_id              UUID REFERENCES catalogo.colegios(id) ON DELETE RESTRICT,

  -- Texto libre de respaldo cuando el colegio declarado no está en el catálogo.
  -- Administración lo revisa y, o bien lo da de alta en catalogo.colegios,
  -- o bien lo deja aquí. Nunca se muestra como badge verificado.
  colegio_otro            TEXT,

  -- El badge sólo se muestra si administración ha comprobado la procedencia.
  colegio_verificado      BOOLEAN NOT NULL DEFAULT FALSE,
  colegio_verificado_en   TIMESTAMPTZ,
  colegio_verificado_por  UUID REFERENCES app.perfiles(id),

  -- ---------------------------------------------------------------------------
  -- Titulación (campo obligatorio para publicar: es lo que da credibilidad)
  -- ---------------------------------------------------------------------------
  titulacion              TEXT,            -- 'Medicina'
  universidad             TEXT,            -- 'Universidad Autónoma de Madrid'
  curso_actual            SMALLINT,        -- 2 (año en curso); NULL si ya titulado
  titulacion_finalizada   BOOLEAN NOT NULL DEFAULT FALSE,
  otros_estudios          TEXT,

  -- ---------------------------------------------------------------------------
  -- Expediente académico
  -- Se guardan como NUMERIC, no como texto: el Excel los tenía en texto libre
  -- ("12,4 en la EVAU") y eso impide ordenar o filtrar.
  -- ---------------------------------------------------------------------------
  nota_evau               NUMERIC(4,2),
  nota_bachillerato       NUMERIC(4,2),
  -- La familia decide si su nota es visible públicamente.
  notas_publicas          BOOLEAN NOT NULL DEFAULT TRUE,

  logros_academicos       TEXT,

  -- ---------------------------------------------------------------------------
  -- Presentación pública
  -- ---------------------------------------------------------------------------
  bio                     TEXT,
  anos_experiencia        SMALLINT,

  -- ---------------------------------------------------------------------------
  -- Modalidad y ubicación
  -- ---------------------------------------------------------------------------
  modalidad               app.modalidad NOT NULL DEFAULT 'online',
  zona_id                 UUID REFERENCES catalogo.zonas(id),
  radio_desplazamiento_km SMALLINT,

  -- ---------------------------------------------------------------------------
  -- Precio orientativo por hora.
  -- La plataforma NO intermedia en este pago: se muestra sólo para que la
  -- familia sepa a qué atenerse antes de contactar. El acuerdo económico y el
  -- cobro son siempre directos entre familia y profesor.
  -- ---------------------------------------------------------------------------
  tarifa_hora_orientativa NUMERIC(6,2),

  -- ---------------------------------------------------------------------------
  -- Estado y capacidad
  -- ---------------------------------------------------------------------------
  estado                  app.estado_profesor NOT NULL DEFAULT 'registrado',
  max_propuestas_activas  SMALLINT NOT NULL DEFAULT 5,
  acepta_nuevos_alumnos   BOOLEAN NOT NULL DEFAULT TRUE,

  aprobado_en             TIMESTAMPTZ,
  aprobado_por            UUID REFERENCES app.perfiles(id),
  motivo_rechazo          TEXT,

  -- ---------------------------------------------------------------------------
  -- Métricas desnormalizadas.
  -- Se mantienen por disparador para que el listado del directorio no tenga que
  -- agregar sobre `resenas` y `propuestas` en cada carga de página.
  -- ---------------------------------------------------------------------------
  valoracion_media        NUMERIC(3,2),
  total_resenas           INTEGER NOT NULL DEFAULT 0,
  total_matches           INTEGER NOT NULL DEFAULT 0,
  tasa_aceptacion         NUMERIC(5,2),     -- % de propuestas que acepta
  horas_mediana_respuesta NUMERIC(6,2),

  -- Clases impartidas antes de la plataforma, traídas del Excel histórico.
  -- Se guarda separado de las métricas de la plataforma para no mezclar
  -- actividad medida con actividad declarada.
  clases_historicas       INTEGER NOT NULL DEFAULT 0,

  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ---------------------------------------------------------------------------
  -- Restricciones de integridad
  -- ---------------------------------------------------------------------------
  CONSTRAINT prof_slug_formato
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT prof_colegio_informado
    CHECK (colegio_id IS NOT NULL OR colegio_otro IS NOT NULL),
  CONSTRAINT prof_verificacion_coherente
    CHECK (colegio_verificado = FALSE OR (colegio_id IS NOT NULL AND colegio_verificado_en IS NOT NULL)),
  CONSTRAINT prof_nota_evau_rango
    CHECK (nota_evau IS NULL OR nota_evau BETWEEN 0 AND 14),
  CONSTRAINT prof_nota_bach_rango
    CHECK (nota_bachillerato IS NULL OR nota_bachillerato BETWEEN 0 AND 10),
  CONSTRAINT prof_valoracion_rango
    CHECK (valoracion_media IS NULL OR valoracion_media BETWEEN 1 AND 5),
  CONSTRAINT prof_presencial_con_zona
    CHECK (modalidad = 'online' OR zona_id IS NOT NULL),
  CONSTRAINT prof_tarifa_positiva
    CHECK (tarifa_hora_orientativa IS NULL OR tarifa_hora_orientativa > 0),

  -- Un profesor sólo puede estar 'activo' si tiene los mínimos publicables.
  -- Esta es la regla que garantiza que el directorio nunca muestra fichas vacías.
  CONSTRAINT prof_activo_requiere_datos_minimos
    CHECK (
      estado <> 'activo' OR (
        titulacion  IS NOT NULL AND
        universidad IS NOT NULL AND
        bio         IS NOT NULL AND
        length(bio) >= 100      AND
        colegio_id  IS NOT NULL
      )
    )
);

COMMENT ON TABLE app.profesores IS
  'Perfil especializado del profesor. Extiende app.perfiles 1:1.';
COMMENT ON COLUMN app.profesores.colegio_verificado IS
  'Sólo TRUE cuando administración ha comprobado la procedencia. Condición para mostrar el badge.';
COMMENT ON COLUMN app.profesores.clases_historicas IS
  'Clases impartidas antes de la plataforma, importadas del Excel. No se mezcla con total_matches.';
COMMENT ON CONSTRAINT prof_activo_requiere_datos_minimos ON app.profesores IS
  'Impide publicar un perfil incompleto en el directorio.';

CREATE INDEX idx_prof_estado_activo ON app.profesores (estado)
       WHERE estado = 'activo';
CREATE INDEX idx_prof_colegio       ON app.profesores (colegio_id)
       WHERE estado = 'activo' AND colegio_verificado;
CREATE INDEX idx_prof_modalidad     ON app.profesores (modalidad, zona_id)
       WHERE estado = 'activo';
CREATE INDEX idx_prof_valoracion    ON app.profesores (valoracion_media DESC NULLS LAST)
       WHERE estado = 'activo';
CREATE INDEX idx_prof_disponible    ON app.profesores (acepta_nuevos_alumnos)
       WHERE estado = 'activo' AND acepta_nuevos_alumnos;

CREATE TRIGGER trg_profesores_touch
  BEFORE UPDATE ON app.profesores
  FOR EACH ROW EXECUTE FUNCTION app.fn_touch_actualizado_en();


-- =============================================================================
-- RELACIONES N:M — Oferta académica del profesor
-- =============================================================================
-- El Excel guardaba "Asignaturas que quieres impartir" y "Cursos a los que
-- quieres dar clase" como dos listas independientes de texto libre. Eso obliga a
-- asumir que el profesor da todas sus asignaturas en todos sus niveles, lo cual
-- es falso: alguien puede dar Matemáticas hasta Bachillerato pero Física sólo
-- hasta 4º ESO. Aquí se modela el par (asignatura, nivel) explícitamente.
-- =============================================================================

CREATE TABLE app.profesor_asignaturas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id     UUID NOT NULL REFERENCES app.profesores(id)      ON DELETE CASCADE,
  asignatura_id   UUID NOT NULL REFERENCES catalogo.asignaturas(id) ON DELETE RESTRICT,
  nivel_id        UUID NOT NULL REFERENCES catalogo.niveles(id)     ON DELETE RESTRICT,

  -- Permite destacar en el perfil las combinaciones en las que es más fuerte.
  especialidad    BOOLEAN NOT NULL DEFAULT FALSE,

  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT prof_asig_nivel_unico UNIQUE (profesor_id, asignatura_id, nivel_id)
);

COMMENT ON TABLE app.profesor_asignaturas IS
  'Qué asignatura imparte el profesor y hasta qué nivel. Grano: par (asignatura, nivel).';

CREATE INDEX idx_prof_asig_profesor   ON app.profesor_asignaturas (profesor_id);
CREATE INDEX idx_prof_asig_busqueda   ON app.profesor_asignaturas (asignatura_id, nivel_id);


-- -----------------------------------------------------------------------------
-- Certificaciones de idiomas del profesor
-- -----------------------------------------------------------------------------
CREATE TABLE app.profesor_certificaciones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id         UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,
  certificacion_id    UUID NOT NULL REFERENCES catalogo.certificaciones_idioma(id) ON DELETE RESTRICT,

  ano_obtencion       SMALLINT,
  -- Justificante subido por el profesor y comprobado por administración.
  documento_url       TEXT,
  verificada          BOOLEAN NOT NULL DEFAULT FALSE,
  verificada_en       TIMESTAMPTZ,

  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT prof_certif_unica UNIQUE (profesor_id, certificacion_id),
  CONSTRAINT prof_certif_ano_valido
    CHECK (ano_obtencion IS NULL OR ano_obtencion BETWEEN 1980 AND 2100)
);

COMMENT ON TABLE app.profesor_certificaciones IS
  'Titulaciones de idiomas del profesor. El Excel las tenía como texto libre sin verificar.';

CREATE INDEX idx_prof_certif_profesor ON app.profesor_certificaciones (profesor_id);


-- -----------------------------------------------------------------------------
-- Disponibilidad horaria
--
-- Nota de migración: la disponibilidad del Excel NO se importa. Los datos son de
-- cursos anteriores y los horarios universitarios cambian cada cuatrimestre;
-- migrarlos produciría matches basados en información falsa. El profesor la
-- rellena de cero al validar su perfil.
-- -----------------------------------------------------------------------------
CREATE TABLE app.profesor_disponibilidad (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id     UUID NOT NULL REFERENCES app.profesores(id) ON DELETE CASCADE,

  dia_semana      SMALLINT NOT NULL,   -- ISO-8601: 1 = lunes ... 7 = domingo
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,

  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT disp_dia_valido    CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT disp_rango_valido  CHECK (hora_fin > hora_inicio),
  CONSTRAINT disp_franja_unica  UNIQUE (profesor_id, dia_semana, hora_inicio)
);

COMMENT ON TABLE app.profesor_disponibilidad IS
  'Franjas horarias declaradas. Deliberadamente NO se migra del Excel: dato caduco.';

CREATE INDEX idx_disp_profesor ON app.profesor_disponibilidad (profesor_id, dia_semana);
