-- =============================================================================
-- AcademiAvanza — Esquema de base de datos
-- Fichero 11: Vistas
-- =============================================================================
-- Dos familias de vistas:
--
--   1. Vistas de aplicación (app.v_*)     → consumidas por el producto
--   2. Vistas de gestión (app.gestion_*)  → pensadas para que Lucía consulte
--                                            desde un cliente SQL sin tener que
--                                            escribir JOINs de seis tablas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Directorio público de profesores
-- Consulta principal del producto. Devuelve sólo perfiles publicables.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW app.v_directorio_profesores AS
SELECT
  pr.id,
  pr.slug,
  pe.nombre,
  left(pe.apellidos, 1) || '.'          AS inicial_apellido,
  pe.avatar_url,

  c.id                                  AS colegio_id,
  c.nombre                              AS colegio_nombre,
  c.logo_url                            AS colegio_logo,
  pr.colegio_verificado,

  pr.titulacion,
  pr.universidad,
  pr.curso_actual,
  pr.titulacion_finalizada,

  CASE WHEN pr.notas_publicas THEN pr.nota_evau END          AS nota_evau,
  CASE WHEN pr.notas_publicas THEN pr.nota_bachillerato END  AS nota_bachillerato,

  pr.bio,
  pr.modalidad,
  z.nombre                              AS zona_nombre,
  pr.tarifa_hora_orientativa,

  pr.valoracion_media,
  pr.total_resenas,
  pr.total_matches,
  pr.clases_historicas,
  pr.acepta_nuevos_alumnos,

  -- Agregados para las tarjetas del listado
  ARRAY(
    SELECT DISTINCT a.nombre
    FROM   app.profesor_asignaturas pa
    JOIN   catalogo.asignaturas a ON a.id = pa.asignatura_id
    WHERE  pa.profesor_id = pr.id
    ORDER  BY a.nombre
  ) AS asignaturas,

  ARRAY(
    SELECT DISTINCT n.etapa::TEXT
    FROM   app.profesor_asignaturas pa
    JOIN   catalogo.niveles n ON n.id = pa.nivel_id
    WHERE  pa.profesor_id = pr.id
  ) AS etapas,

  ARRAY(
    SELECT ci.nombre
    FROM   app.profesor_certificaciones pc
    JOIN   catalogo.certificaciones_idioma ci ON ci.id = pc.certificacion_id
    WHERE  pc.profesor_id = pr.id
  ) AS certificaciones

FROM app.profesores pr
JOIN app.perfiles   pe ON pe.id = pr.id
LEFT JOIN catalogo.colegios c ON c.id = pr.colegio_id
LEFT JOIN catalogo.zonas    z ON z.id = pr.zona_id
WHERE pr.estado = 'activo'
  AND pe.eliminado_en IS NULL;

COMMENT ON VIEW app.v_directorio_profesores IS
  'Perfiles publicables con sus agregados. Nunca expone apellidos completos ni teléfono.';


-- -----------------------------------------------------------------------------
-- Propuestas con contexto completo
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW app.v_propuestas_detalle AS
SELECT
  p.id,
  p.referencia,
  p.estado,

  pf.nombre    AS familia_nombre,
  pf.apellidos AS familia_apellidos,
  pf.email     AS familia_email,
  pf.telefono  AS familia_telefono,

  al.nombre    AS alumno_nombre,
  nv.nombre    AS alumno_nivel,

  pp.nombre    AS profesor_nombre,
  pp.apellidos AS profesor_apellidos,
  pp.email     AS profesor_email,
  -- El teléfono del profesor sólo se expone si la propuesta está pagada.
  CASE WHEN p.estado = 'pagada' THEN pp.telefono END AS profesor_telefono,

  cl.nombre    AS profesor_colegio,

  p.asignaturas_solicitadas,
  p.modalidad_solicitada,
  p.tarifa_aplicada,

  p.creado_en,
  p.respondida_en,
  p.pagada_en,
  p.responder_antes_de,
  p.pagar_antes_de,

  EXTRACT(EPOCH FROM (p.respondida_en - p.creado_en)) / 3600 AS horas_hasta_respuesta,
  EXTRACT(EPOCH FROM (p.pagada_en     - p.respondida_en)) / 3600 AS horas_hasta_pago

FROM app.propuestas p
JOIN app.familias   f  ON f.id  = p.familia_id
JOIN app.perfiles   pf ON pf.id = f.id
JOIN app.alumnos    al ON al.id = p.alumno_id
JOIN catalogo.niveles nv ON nv.id = al.nivel_id
JOIN app.profesores pr ON pr.id = p.profesor_id
JOIN app.perfiles   pp ON pp.id = pr.id
LEFT JOIN catalogo.colegios cl ON cl.id = pr.colegio_id;

COMMENT ON VIEW app.v_propuestas_detalle IS
  'Propuestas con todas las partes resueltas. El teléfono del profesor sólo aparece si está pagada.';


-- =============================================================================
-- VISTAS DE GESTIÓN
-- Pensadas para consultarse directamente desde un cliente SQL.
-- =============================================================================

-- Panel de situación: una sola fila con el estado del negocio.
CREATE OR REPLACE VIEW app.gestion_resumen AS
SELECT
  (SELECT COUNT(*) FROM app.profesores WHERE estado = 'activo')                        AS profesores_activos,
  (SELECT COUNT(*) FROM app.profesores WHERE estado = 'pendiente')                     AS profesores_por_aprobar,
  (SELECT COUNT(*) FROM app.profesores WHERE estado = 'importado')                     AS profesores_sin_reclamar,
  (SELECT COUNT(*) FROM app.familias)                                                  AS familias_registradas,
  (SELECT COUNT(*) FROM app.propuestas WHERE estado = 'enviada')                       AS propuestas_esperando_profesor,
  (SELECT COUNT(*) FROM app.propuestas WHERE estado = 'aceptada')                      AS propuestas_esperando_pago,
  (SELECT COUNT(*) FROM app.propuestas WHERE estado = 'pagada')                        AS matches_totales,
  (SELECT COUNT(*) FROM app.propuestas
     WHERE estado = 'pagada' AND pagada_en >= date_trunc('month', NOW()))              AS matches_este_mes,
  (SELECT COALESCE(SUM(importe), 0) FROM app.pagos WHERE estado = 'completado')        AS ingresos_totales,
  (SELECT COALESCE(SUM(importe), 0) FROM app.pagos
     WHERE estado = 'completado' AND pagado_en >= date_trunc('month', NOW()))          AS ingresos_este_mes,
  (SELECT COUNT(*) FROM app.resenas WHERE estado = 'pendiente')                        AS resenas_por_moderar,
  (SELECT importe FROM app.fn_tarifa_vigente('match'))                                 AS tarifa_actual;

COMMENT ON VIEW app.gestion_resumen IS
  'Estado del negocio en una fila. Uso: SELECT * FROM app.gestion_resumen;';


-- Ingresos mes a mes.
CREATE OR REPLACE VIEW app.gestion_ingresos_mensuales AS
SELECT
  date_trunc('month', pagado_en)::DATE          AS mes,
  COUNT(*)                                      AS num_matches,
  SUM(importe)                                  AS ingresos_brutos,
  SUM(COALESCE(importe_reembolsado, 0))         AS reembolsos,
  SUM(importe) - SUM(COALESCE(importe_reembolsado, 0)) AS ingresos_netos,
  ROUND(AVG(importe), 2)                        AS ticket_medio
FROM app.pagos
WHERE estado IN ('completado', 'reembolsado')
  AND pagado_en IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW app.gestion_ingresos_mensuales IS
  'Ingresos agregados por mes. Uso: SELECT * FROM app.gestion_ingresos_mensuales;';


-- Rendimiento por profesor: quién convierte y quién no.
CREATE OR REPLACE VIEW app.gestion_rendimiento_profesores AS
SELECT
  pe.nombre || ' ' || pe.apellidos              AS profesor,
  c.nombre                                      AS colegio,
  pr.estado,
  pr.valoracion_media,
  pr.total_resenas,
  COUNT(p.id)                                                             AS propuestas_recibidas,
  COUNT(*) FILTER (WHERE p.estado IN ('aceptada','pagada'))                AS aceptadas,
  COUNT(*) FILTER (WHERE p.estado = 'rechazada')                           AS rechazadas,
  COUNT(*) FILTER (WHERE p.estado = 'caducada')                            AS sin_responder,
  COUNT(*) FILTER (WHERE p.estado = 'pagada')                              AS matches,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE p.estado IN ('aceptada','pagada'))
    / NULLIF(COUNT(p.id), 0), 1
  )                                                                        AS tasa_aceptacion_pct,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (p.respondida_en - p.creado_en)) / 3600)::NUMERIC, 1
  )                                                                        AS horas_medias_respuesta,
  pr.clases_historicas
FROM app.profesores pr
JOIN app.perfiles pe ON pe.id = pr.id
LEFT JOIN catalogo.colegios c ON c.id = pr.colegio_id
LEFT JOIN app.propuestas p ON p.profesor_id = pr.id
GROUP BY pe.nombre, pe.apellidos, c.nombre, pr.estado,
         pr.valoracion_media, pr.total_resenas, pr.clases_historicas
ORDER BY matches DESC NULLS LAST;

COMMENT ON VIEW app.gestion_rendimiento_profesores IS
  'Un profesor por fila con su embudo completo. Uso: SELECT * FROM app.gestion_rendimiento_profesores;';


-- Embudo de conversión global.
CREATE OR REPLACE VIEW app.gestion_embudo AS
WITH totales AS (
  SELECT
    COUNT(*)                                            AS enviadas,
    COUNT(*) FILTER (WHERE estado IN ('aceptada','pagada')) AS aceptadas,
    COUNT(*) FILTER (WHERE estado = 'pagada')           AS pagadas,
    COUNT(*) FILTER (WHERE estado = 'rechazada')        AS rechazadas,
    COUNT(*) FILTER (WHERE estado = 'caducada')         AS caducadas_sin_respuesta,
    COUNT(*) FILTER (WHERE estado = 'caducada_pago')    AS caducadas_sin_pago
  FROM app.propuestas
)
SELECT
  enviadas,
  aceptadas,
  pagadas,
  rechazadas,
  caducadas_sin_respuesta,
  caducadas_sin_pago,
  ROUND(100.0 * aceptadas / NULLIF(enviadas, 0), 1)  AS pct_aceptacion,
  ROUND(100.0 * pagadas   / NULLIF(aceptadas, 0), 1) AS pct_pago_tras_aceptar,
  ROUND(100.0 * pagadas   / NULLIF(enviadas, 0), 1)  AS pct_conversion_total
FROM totales;

COMMENT ON VIEW app.gestion_embudo IS
  'Conversión global del flujo. Uso: SELECT * FROM app.gestion_embudo;';


-- Perfiles migrados que aún no han sido reclamados por su titular.
CREATE OR REPLACE VIEW app.gestion_pendientes_validacion AS
SELECT
  pe.rol,
  pe.nombre || ' ' || pe.apellidos  AS persona,
  pe.email,
  pe.telefono,
  pe.creado_en                      AS importado_en,
  t.enviado_en                      AS invitacion_enviada,
  t.recordatorios,
  t.expira_en,
  CASE WHEN t.usado_en IS NOT NULL THEN 'reclamado'
       WHEN t.expira_en < NOW()    THEN 'token caducado'
       WHEN t.enviado_en IS NULL   THEN 'sin invitar'
       ELSE 'invitado, sin respuesta'
  END                               AS situacion
FROM app.perfiles pe
LEFT JOIN app.tokens_reclamacion t ON t.perfil_id = pe.id
WHERE pe.origen = 'migracion'
  AND pe.datos_validados = FALSE
  AND pe.eliminado_en IS NULL
ORDER BY pe.rol, pe.creado_en;

COMMENT ON VIEW app.gestion_pendientes_validacion IS
  'Perfiles importados del Excel que aún no ha validado su titular.';
