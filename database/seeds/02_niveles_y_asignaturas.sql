-- =============================================================================
-- Datos iniciales: niveles educativos y asignaturas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NIVELES
-- -----------------------------------------------------------------------------
INSERT INTO catalogo.niveles (slug, nombre, etapa, orden_visual) VALUES
  ('primaria-1', '1º Primaria',      'primaria',      1),
  ('primaria-2', '2º Primaria',      'primaria',      2),
  ('primaria-3', '3º Primaria',      'primaria',      3),
  ('primaria-4', '4º Primaria',      'primaria',      4),
  ('primaria-5', '5º Primaria',      'primaria',      5),
  ('primaria-6', '6º Primaria',      'primaria',      6),
  ('eso-1',      '1º ESO',           'eso',          11),
  ('eso-2',      '2º ESO',           'eso',          12),
  ('eso-3',      '3º ESO',           'eso',          13),
  ('eso-4',      '4º ESO',           'eso',          14),
  ('bach-1',     '1º Bachillerato',  'bachillerato', 21),
  ('bach-2',     '2º Bachillerato',  'bachillerato', 22),
  ('evau',       'Preparación EVAU', 'evau',         31),
  ('universidad','Universidad',      'universidad',  41)
ON CONFLICT (slug) DO NOTHING;


-- -----------------------------------------------------------------------------
-- ASIGNATURAS
-- -----------------------------------------------------------------------------
INSERT INTO catalogo.asignaturas (slug, nombre, categoria, orden_visual) VALUES
  ('matematicas',        'Matemáticas',              'ciencias',  1),
  ('fisica',             'Física',                   'ciencias',  2),
  ('quimica',            'Química',                  'ciencias',  3),
  ('fisica-y-quimica',   'Física y Química',         'ciencias',  4),
  ('biologia',           'Biología',                 'ciencias',  5),
  ('geologia',           'Geología',                 'ciencias',  6),
  ('tecnologia',         'Tecnología',               'ciencias',  7),
  ('dibujo-tecnico',     'Dibujo Técnico',           'ciencias',  8),

  ('lengua',             'Lengua Castellana',        'letras',   20),
  ('literatura',         'Literatura',               'letras',   21),
  ('historia',           'Historia',                 'letras',   22),
  ('geografia',          'Geografía',                'letras',   23),
  ('filosofia',          'Filosofía',                'letras',   24),
  ('latin',              'Latín',                    'letras',   25),
  ('griego',             'Griego',                   'letras',   26),
  ('economia',           'Economía',                 'letras',   27),
  ('historia-del-arte',  'Historia del Arte',        'letras',   28),

  ('ingles',             'Inglés',                   'idiomas',  40),
  ('frances',            'Francés',                  'idiomas',  41),
  ('aleman',             'Alemán',                   'idiomas',  42),

  ('tecnicas-estudio',   'Técnicas de estudio',      'otros',    60),
  ('apoyo-general',      'Apoyo escolar general',    'otros',    61)
ON CONFLICT (slug) DO NOTHING;


-- -----------------------------------------------------------------------------
-- CERTIFICACIONES DE IDIOMAS
-- -----------------------------------------------------------------------------
INSERT INTO catalogo.certificaciones_idioma
  (slug, idioma, nombre, nivel_mcer, organismo, orden_visual) VALUES
  ('cambridge-b1',  'Inglés',  'Cambridge B1 Preliminary (PET)',  'B1', 'Cambridge', 1),
  ('cambridge-b2',  'Inglés',  'Cambridge B2 First (FCE)',        'B2', 'Cambridge', 2),
  ('cambridge-c1',  'Inglés',  'Cambridge C1 Advanced (CAE)',     'C1', 'Cambridge', 3),
  ('cambridge-c2',  'Inglés',  'Cambridge C2 Proficiency (CPE)',  'C2', 'Cambridge', 4),
  ('trinity-b2',    'Inglés',  'Trinity ISE II',                  'B2', 'Trinity',   5),
  ('trinity-c1',    'Inglés',  'Trinity ISE III',                 'C1', 'Trinity',   6),
  ('toefl',         'Inglés',  'TOEFL iBT',                       NULL, 'ETS',       7),
  ('ielts',         'Inglés',  'IELTS',                           NULL, 'British Council', 8),
  ('delf-b2',       'Francés', 'DELF B2',                         'B2', 'France Éducation', 20),
  ('dalf-c1',       'Francés', 'DALF C1',                         'C1', 'France Éducation', 21),
  ('goethe-b2',     'Alemán',  'Goethe-Zertifikat B2',            'B2', 'Goethe-Institut',  30),
  ('goethe-c1',     'Alemán',  'Goethe-Zertifikat C1',            'C1', 'Goethe-Institut',  31)
ON CONFLICT (slug) DO NOTHING;


-- -----------------------------------------------------------------------------
-- TARIFA INICIAL
-- El importe es provisional: ver el análisis de precios en
-- docs/01-research/analisis-competitivo.md, apartado 4.3.
-- Se cambia desde el panel o con: SELECT app.fn_cambiar_tarifa(19.99, 'motivo');
-- -----------------------------------------------------------------------------
INSERT INTO app.tarifas (concepto, importe, moneda, motivo)
VALUES ('match', 14.99, 'EUR', 'Tarifa inicial de lanzamiento')
ON CONFLICT DO NOTHING;
