-- =============================================================================
-- FICHAS DE PRUEBA
--
-- Seis profesores INVENTADOS para poder ver el directorio con contenido y
-- probar que los filtros hacen lo que dicen. Ninguno existe: los nombres, los
-- correos y los textos están escritos para esto y no se parecen a nadie real.
--
-- Ni un solo dato sale del histórico. Recortar personas reales para hacer
-- pruebas sería meter datos de menores por la puerta de atrás.
--
-- IMPORTANTE
-- Estas fichas se publican como si estuvieran aprobadas. NO PUEDEN QUEDARSE
-- cuando la web esté abierta: una familia les escribiría y nadie contestaría.
-- Se borran con el bloque del final de este mismo fichero.
--
-- Todos los correos acaban en @ejemplo.invalid, un dominio que por norma no
-- puede existir. Aunque el envío de correo estuviera encendido, no llegarían a
-- ninguna parte, y buscar por ese texto los encuentra a todos.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1 · Las fichas
-- -----------------------------------------------------------------------------
INSERT INTO app.profesores
  (slug, nombre, apellidos, email, colegio_id, titulacion, universidad,
   curso_actual, titulacion_finalizada, puntos_fuertes, modalidad, zona_otra,
   estado, disponible, acepta_publicacion, acepta_publicacion_en, aprobado_en)
VALUES
  ('prueba-marta-r', 'Marta', 'Ruiz Lozano', 'marta@ejemplo.invalid',
   (SELECT id FROM catalogo.colegios WHERE slug = 'montpellier'),
   'Matemáticas', 'Universidad Complutense de Madrid', 3, FALSE,
   'Tengo mucha paciencia con quien se ha atascado y cree que no se le dan las mates. Empiezo por lo que falla de verdad, aunque sea de dos cursos atrás.',
   'ambas', 'Chamberí', 'activo', TRUE, TRUE, NOW(), NOW()),

  ('prueba-diego-s', 'Diego', 'Serrano Vidal', 'diego@ejemplo.invalid',
   (SELECT id FROM catalogo.colegios WHERE slug = 'san-patricio'),
   'Medicina', 'Universidad Autónoma de Madrid', 4, FALSE,
   'Preparé la EvAU hace poco y me acuerdo de todo: de lo que cae, de cómo corrigen y de los nervios.',
   'online', NULL, 'activo', TRUE, TRUE, NOW(), NOW()),

  ('prueba-elena-b', 'Elena', 'Bermúdez Cano', 'elena@ejemplo.invalid',
   (SELECT id FROM catalogo.colegios WHERE slug = 'brains'),
   'Filología Inglesa', 'Universidad Complutense de Madrid', NULL, TRUE,
   'Doy clase hablando en inglés desde el primer día. Al principio cuesta y luego es lo que más se agradece.',
   'presencial', 'Pozuelo de Alarcón', 'activo', TRUE, TRUE, NOW(), NOW()),

  ('prueba-javier-m', 'Javier', 'Molina Peña', 'javier@ejemplo.invalid',
   (SELECT id FROM catalogo.colegios WHERE slug = 'nuestra-senora-pilar'),
   'Ingeniería Industrial', 'Universidad Politécnica de Madrid', 2, FALSE,
   'Se me da bien tratar con adolescentes que no quieren estar ahí. No les riño; busco por dónde entrarles.',
   'ambas', 'Salamanca', 'activo', TRUE, TRUE, NOW(), NOW()),

  ('prueba-lucia-t', 'Lucía', 'Tejada Ortiz', 'lucia.t@ejemplo.invalid',
   (SELECT id FROM catalogo.colegios WHERE slug = 'montpellier'),
   'Derecho y ADE', 'Universidad Carlos III', 5, FALSE,
   'Explico despacio y por escrito: al terminar la clase se queda un esquema hecho, no unos apuntes copiados.',
   'online', NULL, 'activo', TRUE, TRUE, NOW(), NOW()),

  ('prueba-nerea-g', 'Nerea', 'Gálvez Ibáñez', 'nerea@ejemplo.invalid',
   (SELECT id FROM catalogo.colegios WHERE slug = 'highlands'),
   'Historia', 'Universidad Autónoma de Madrid', NULL, TRUE,
   'Me gusta que entiendan por qué pasaron las cosas antes de aprenderse las fechas. Luego las fechas se quedan solas.',
   'presencial', 'Las Rozas', 'activo', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;


-- -----------------------------------------------------------------------------
-- 2 · Qué da cada uno
-- Se emparejan por slug para que el fichero se pueda leer sin descifrar UUIDs.
-- -----------------------------------------------------------------------------
INSERT INTO app.profesor_asignaturas (profesor_id, asignatura_id)
SELECT p.id, a.id
FROM app.profesores p
JOIN (VALUES
  ('prueba-marta-r',  'matematicas'),
  ('prueba-marta-r',  'fisica-y-quimica'),
  ('prueba-diego-s',  'biologia'),
  ('prueba-diego-s',  'quimica'),
  ('prueba-diego-s',  'matematicas'),
  ('prueba-elena-b',  'ingles'),
  ('prueba-javier-m', 'matematicas'),
  ('prueba-javier-m', 'fisica'),
  ('prueba-javier-m', 'dibujo-tecnico'),
  ('prueba-lucia-t',  'economia'),
  ('prueba-lucia-t',  'lengua'),
  ('prueba-nerea-g',  'historia'),
  ('prueba-nerea-g',  'geografia'),
  ('prueba-nerea-g',  'historia-del-arte')
) AS v(prof, asig) ON v.prof = p.slug
JOIN catalogo.asignaturas a ON a.slug = v.asig
ON CONFLICT DO NOTHING;


INSERT INTO app.profesor_niveles (profesor_id, nivel_id)
SELECT p.id, n.id
FROM app.profesores p
JOIN (VALUES
  ('prueba-marta-r',  'eso-1'),
  ('prueba-marta-r',  'eso-2'),
  ('prueba-marta-r',  'eso-3'),
  ('prueba-marta-r',  'eso-4'),
  ('prueba-diego-s',  'bach-1'),
  ('prueba-diego-s',  'bach-2'),
  ('prueba-diego-s',  'evau'),
  ('prueba-elena-b',  'primaria-4'),
  ('prueba-elena-b',  'primaria-5'),
  ('prueba-elena-b',  'primaria-6'),
  ('prueba-elena-b',  'eso-1'),
  ('prueba-javier-m', 'eso-3'),
  ('prueba-javier-m', 'eso-4'),
  ('prueba-javier-m', 'bach-1'),
  ('prueba-lucia-t',  'bach-1'),
  ('prueba-lucia-t',  'bach-2'),
  ('prueba-nerea-g',  'eso-2'),
  ('prueba-nerea-g',  'eso-3'),
  ('prueba-nerea-g',  'bach-1'),
  ('prueba-nerea-g',  'evau')
) AS v(prof, niv) ON v.prof = p.slug
JOIN catalogo.niveles n ON n.slug = v.niv
ON CONFLICT DO NOTHING;


-- Idiomas: sólo tres de los seis, para que el filtro sirva de algo.
INSERT INTO app.profesor_certificaciones (profesor_id, certificacion_id)
SELECT p.id, c.id
FROM app.profesores p
JOIN (VALUES
  ('prueba-elena-b',  'cambridge-c2'),
  ('prueba-diego-s',  'cambridge-b2'),
  ('prueba-lucia-t',  'delf-b2')
) AS v(prof, cert) ON v.prof = p.slug
JOIN catalogo.certificaciones_idioma c ON c.slug = v.cert
ON CONFLICT DO NOTHING;


-- -----------------------------------------------------------------------------
-- 3 · Disponibilidad
-- Las horas coinciden con las tres franjas del formulario: mañana 09-14,
-- tarde 16-20 y noche 20-22. Si no coincidieran, la rejilla de la ficha las
-- descartaría por no saber a qué franja pertenecen.
-- -----------------------------------------------------------------------------
INSERT INTO app.profesor_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin)
SELECT p.id, v.dia, v.inicio::TIME, v.fin::TIME
FROM app.profesores p
JOIN (VALUES
  ('prueba-marta-r',  1, '16:00', '20:00'),
  ('prueba-marta-r',  3, '16:00', '20:00'),
  ('prueba-marta-r',  5, '16:00', '20:00'),
  ('prueba-diego-s',  2, '20:00', '22:00'),
  ('prueba-diego-s',  4, '20:00', '22:00'),
  ('prueba-diego-s',  6, '09:00', '14:00'),
  ('prueba-elena-b',  1, '09:00', '14:00'),
  ('prueba-elena-b',  2, '09:00', '14:00'),
  ('prueba-elena-b',  4, '16:00', '20:00'),
  ('prueba-javier-m', 2, '16:00', '20:00'),
  ('prueba-javier-m', 4, '16:00', '20:00'),
  ('prueba-lucia-t',  3, '20:00', '22:00'),
  ('prueba-lucia-t',  7, '16:00', '20:00'),
  ('prueba-nerea-g',  5, '16:00', '20:00'),
  ('prueba-nerea-g',  6, '09:00', '14:00')
) AS v(prof, dia, inicio, fin) ON v.prof = p.slug
ON CONFLICT DO NOTHING;

COMMIT;


-- =============================================================================
-- PARA BORRARLAS
--
-- Ejecuta esto y desaparecen las seis con todo lo que cuelga de ellas:
-- asignaturas, cursos, idiomas, horarios y los mensajes que hayan recibido.
-- Lo hace el ON DELETE CASCADE del esquema.
--
-- Hazlo ANTES de abrir la web al público.
--
--   DELETE FROM app.profesores WHERE email LIKE '%@ejemplo.invalid';
--
-- Y para comprobar que no queda ninguna:
--
--   SELECT COUNT(*) FROM app.profesores WHERE email LIKE '%@ejemplo.invalid';
-- =============================================================================
