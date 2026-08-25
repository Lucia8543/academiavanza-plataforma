-- =============================================================================
-- Datos iniciales: colegios
-- =============================================================================
-- El Montpellier arranca como destacado por razones históricas del negocio: es
-- de donde procede la mayor parte de la red actual de profesores.
--
-- Los logos se suben a Supabase Storage (bucket `colegios`) y se referencian
-- aquí. Ver docs/05-migracion/informe-migracion.md, apartado de logos.
-- =============================================================================
-- BLOQUE 1 · Lista original (provisional)
--
-- Sólo `montpellier` y `highlands` aparecen en los datos históricos. El resto
-- (Pilar, San Patricio, Brains, Mirabal, Ramón y Cajal) se mantienen porque son
-- centros del entorno que pueden llegar, pero hoy no tienen ningún profesor ni
-- familia detrás. Si se quiere un selector que refleje sólo la realidad, son los
-- candidatos a retirar.
-- =============================================================================

INSERT INTO catalogo.colegios
  (slug, nombre, nombre_corto, municipio, destacado, orden_visual) VALUES
  ('montpellier',        'Colegio Montpellier',              'Montpellier',   'Madrid', TRUE,  1),
  ('nuestra-senora-pilar','Colegio Nuestra Señora del Pilar','Pilar',         'Madrid', FALSE, 10),
  ('san-patricio',       'Colegio San Patricio',             'San Patricio',  'Madrid', FALSE, 11),
  ('brains',             'Brains International School',      'Brains',        'Madrid', FALSE, 12),
  ('mirabal',            'Colegio Mirabal',                  'Mirabal',       'Boadilla del Monte', FALSE, 13),
  ('highlands',          'Highlands School',                 'Highlands',     'Madrid', FALSE, 14),
  ('ramon-y-cajal',      'Colegio Ramón y Cajal',            'Ramón y Cajal', 'Madrid', FALSE, 15),
  ('publico-otro',       'Instituto público',                'Público',       'Madrid', FALSE, 90),
  ('otro',               'Otro centro',                      'Otro',          NULL,     FALSE, 99)
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- BLOQUE 2 · Centros que aparecen realmente en los datos históricos
--
-- Extraídos de las columnas de texto libre «¿Has estudiado en el Montpellier?
-- (Si no, escribe en cuál)» (profesores) y «Colegio del alumno» (familias), en
-- los dos formularios de Google y en las hojas PADRES y PROFESORES del Excel.
--
-- 91 cadenas distintas se reducen a los 73 centros de abajo. La reducción
-- consistió en: separar las respuestas que citan varios centros, unificar
-- mayúsculas y acentos, fundir variantes del mismo centro («IES Villablanca» /
-- «ÍES Villablanca», «Ramiro de Maeztu» / «IES Ramiro de Maeztu», «Higlands» /
-- «Highlands») y descartar las respuestas que no nombran un centro (ver el
-- bloque de incidencias al final).
--
-- El municipio y la provincia se han rellenado sólo cuando la propia respuesta
-- los indicaba o el centro es inequívoco; en el resto quedan a NULL, para
-- completarlos al verificar el colegio, no antes.
-- =============================================================================

INSERT INTO catalogo.colegios
  (slug, nombre, nombre_corto, municipio, provincia, destacado, orden_visual) VALUES
  ('menesiano',                            'Colegio Menesiano',                              'Menesiano',                      'Madrid',                   'Madrid',       FALSE, 20),
  ('joyfe',                                'Colegio Joyfe',                                  'Joyfe',                          'Madrid',                   'Madrid',       FALSE, 21),
  ('ramiro-de-maeztu',                     'IES Ramiro de Maeztu',                           'Ramiro de Maeztu',               'Madrid',                   'Madrid',       FALSE, 22),
  ('gredos-san-diego',                     'Gredos San Diego',                               'GSD',                            NULL,                       'Madrid',       FALSE, 23),
  ('gredos-san-diego-las-suertes',         'Gredos San Diego Las Suertes',                   'GSD Las Suertes',                'Getafe',                   'Madrid',       FALSE, 24),
  ('gredos-san-diego-guadarrama',          'Gredos San Diego Guadarrama',                    'GSD Guadarrama',                 'Guadarrama',               'Madrid',       FALSE, 25),
  ('santo-angel-british-school',           'Santo Ángel British School',                     'Santo Ángel',                    NULL,                       'Madrid',       FALSE, 26),
  ('retamar',                              'Colegio Retamar',                                'Retamar',                        'Pozuelo de Alarcón',       'Madrid',       FALSE, 27),
  ('mater-inmaculata',                     'Colegio Mater Inmaculata',                       'Mater Inmaculata',               'Alcobendas',               'Madrid',       FALSE, 28),
  ('senara',                               'Colegio Senara',                                 'Senara',                         'Madrid',                   'Madrid',       FALSE, 29),
  ('casa-de-la-virgen',                    'Colegio Casa de la Virgen',                      'Casa de la Virgen',              'Madrid',                   'Madrid',       FALSE, 30),
  ('arturo-soria',                         'Colegio Arturo Soria',                           'Arturo Soria',                   'Madrid',                   'Madrid',       FALSE, 31),
  ('el-valle-valdebernardo',               'Colegio El Valle Valdebernardo',                 'El Valle Valdebernardo',         'Madrid',                   'Madrid',       FALSE, 32),
  ('el-valle-las-tablas',                  'Colegio El Valle Las Tablas',                    'El Valle Las Tablas',            'Madrid',                   'Madrid',       FALSE, 33),
  ('jesus-maria',                          'Colegio Jesús María',                            'Jesús María',                    'Madrid',                   'Madrid',       FALSE, 34),
  ('santa-ana-y-san-rafael',               'Colegio Santa Ana y San Rafael',                 'Santa Ana y San Rafael',         'Madrid',                   'Madrid',       FALSE, 35),
  ('aldovea',                              'Colegio Aldovea',                                'Aldovea',                        'Alcobendas',               'Madrid',       FALSE, 36),
  ('el-prado',                             'Colegio El Prado',                               'El Prado',                       'Madrid',                   'Madrid',       FALSE, 37),
  ('internacional-aravaca',                'Colegio Internacional Aravaca',                  'Internacional Aravaca',          'Madrid',                   'Madrid',       FALSE, 38),
  ('maria-teresa-alcobendas',              'Colegio María Teresa',                           'María Teresa',                   'Alcobendas',               'Madrid',       FALSE, 39),
  ('las-irlandesas-el-soto',               'Colegio Las Irlandesas El Soto',                 'Las Irlandesas',                 'Boadilla del Monte',       'Madrid',       FALSE, 40),
  ('la-salle-maravillas',                  'Colegio La Salle Maravillas',                    'La Salle Maravillas',            'Madrid',                   'Madrid',       FALSE, 41),
  ('la-salle-san-jose',                    'Colegio La Salle San José',                      'La Salle San José',              'Madrid',                   'Madrid',       FALSE, 42),
  ('liceo-sorolla',                        'Liceo Sorolla',                                  'Liceo Sorolla',                  'Pozuelo de Alarcón',       'Madrid',       FALSE, 43),
  ('los-sauces-la-moraleja',               'Colegio Los Sauces La Moraleja',                 'Los Sauces',                     'Alcobendas',               'Madrid',       FALSE, 44),
  ('los-robles',                           'Colegio Los Robles',                             'Los Robles',                     NULL,                       'Madrid',       FALSE, 45),
  ('colegio-zola-las-rozas',               'Colegio Zola Las Rozas',                         'Zola Las Rozas',                 'Las Rozas de Madrid',      'Madrid',       FALSE, 46),
  ('san-gabriel-alcala',                   'Colegio San Gabriel',                            'San Gabriel',                    'Alcalá de Henares',        'Madrid',       FALSE, 47),
  ('sagrado-corazon-capuchinos',           'Colegio Sagrado Corazón (Capuchinos)',           'Sagrado Corazón',                'Madrid',                   'Madrid',       FALSE, 48),
  ('sagrada-familia',                      'Colegio Sagrada Familia',                        'Sagrada Familia',                NULL,                       'Madrid',       FALSE, 49),
  ('nuestra-senora-de-la-merced',          'Colegio Nuestra Señora de la Merced',            'La Merced',                      'Madrid',                   'Madrid',       FALSE, 50),
  ('nuestra-senora-del-buen-consejo',      'Colegio Nuestra Señora del Buen Consejo',        'Buen Consejo',                   'Madrid',                   'Madrid',       FALSE, 51),
  ('stella-maris-fesd',                    'Colegio Stella Maris (FESD)',                    'Stella Maris',                   'Madrid',                   'Madrid',       FALSE, 52),
  ('litterator-aranjuez',                  'Colegio Litterator',                             'Litterator',                     'Aranjuez',                 'Madrid',       FALSE, 53),
  ('ceip-nuestra-senora-de-la-natividad',  'CEIP Nuestra Señora de la Natividad',            'Ntra. Sra. de la Natividad',     'Cedillo del Condado',      'Toledo',       FALSE, 54),
  ('virgen-de-la-caridad-illescas',        'Colegio Virgen de la Caridad',                   'Virgen de la Caridad',           'Illescas',                 'Toledo',       FALSE, 55),
  ('ies-fortuny',                          'IES Fortuny',                                    'Fortuny',                        'Madrid',                   'Madrid',       FALSE, 60),
  ('ies-carlos-camo',                      'IES Carlos Camo',                                'Carlos Camo',                    NULL,                       'Madrid',       FALSE, 61),
  ('ies-cervantes',                        'IES Cervantes',                                  'Cervantes',                      'Madrid',                   'Madrid',       FALSE, 62),
  ('ies-juan-de-la-cierva',                'IES Juan de la Cierva',                          'Juan de la Cierva',              'Madrid',                   'Madrid',       FALSE, 63),
  ('ies-san-juan-bautista',                'IES San Juan Bautista',                          'San Juan Bautista',              'Madrid',                   'Madrid',       FALSE, 64),
  ('ies-villablanca',                      'IES Villablanca',                                'Villablanca',                    'Madrid',                   'Madrid',       FALSE, 65),
  ('ies-antonio-machado',                  'IES Antonio Machado',                            'Antonio Machado',                NULL,                       'Madrid',       FALSE, 66),
  ('ies-gerardo-diego',                    'IES Gerardo Diego',                              'Gerardo Diego',                  NULL,                       'Madrid',       FALSE, 67),
  ('ies-profesor-julio-perez',             'IES Profesor Julio Pérez',                       'Julio Pérez',                    'Rivas-Vaciamadrid',        'Madrid',       FALSE, 68),
  ('ies-cardenal-cisneros',                'IES Cardenal Cisneros',                          'Cardenal Cisneros',              'Madrid',                   'Madrid',       FALSE, 69),
  ('ies-carmen-martin-gaite',              'IES Carmen Martín Gaite',                        'Carmen Martín Gaite',            'Moralzarzal',              'Madrid',       FALSE, 70),
  ('ies-diego-velazquez',                  'IES Diego Velázquez',                            'Diego Velázquez',                'Torrelodones',             'Madrid',       FALSE, 71),
  ('ies-rey-pastor',                       'IES Rey Pastor',                                 'Rey Pastor',                     'Madrid',                   'Madrid',       FALSE, 72),
  ('ceip-el-sol',                          'CEIP El Sol',                                    'El Sol',                         'Madrid',                   'Madrid',       FALSE, 73),
  ('ccp-palomeras',                        'Colegio Palomeras',                              'Palomeras',                      'Madrid',                   'Madrid',       FALSE, 74),
  ('cesur-madrid-ii',                      'Cesur Madrid II',                                'Cesur',                          'Madrid',                   'Madrid',       FALSE, 75),
  ('trinity-college',                      'Trinity College',                                'Trinity',                        NULL,                       'Madrid',       FALSE, 76),
  ('claret-askartza',                      'Colegio Claret Askartza',                        'Claret Askartza',                'Leioa',                    'Bizkaia',      FALSE, 80),
  ('blanca-de-castilla-burgos',            'Colegio Blanca de Castilla (Jesuitinas)',        'Blanca de Castilla',             'Burgos',                   'Burgos',       FALSE, 81),
  ('sagrado-corazon-pamplona',             'Colegio Sagrado Corazón',                        'Sagrado Corazón',                'Pamplona',                 'Navarra',      FALSE, 82),
  ('maristas-jaen',                        'Colegio Maristas',                               'Maristas',                       'Jaén',                     'Jaén',         FALSE, 83),
  ('ies-ciudad-de-jaen',                   'IES Ciudad de Jaén',                             'Ciudad de Jaén',                 'Madrid',                   'Madrid',       FALSE, 84),
  ('colegio-obradoiro',                    'Colegio Obradoiro',                              'Obradoiro',                      'A Coruña',                 'A Coruña',     FALSE, 85),
  ('ies-rosalia-de-castro',                'IES Rosalía de Castro',                          'Rosalía de Castro',              'Santiago de Compostela',   'A Coruña',     FALSE, 86),
  ('compania-de-maria',                    'Colegio Compañía de María',                      'Compañía de María',              NULL,                       NULL,           FALSE, 87),
  ('ies-german-sanchez-ruiperez',          'IES Germán Sánchez Ruipérez',                    'Germán Sánchez Ruipérez',        'Guijuelo',                 'Salamanca',    FALSE, 88),
  ('ies-doctor-alarcon-santon',            'IES Doctor Alarcón Santón',                      'Doctor Alarcón Santón',          NULL,                       NULL,           FALSE, 89),
  ('ies-salduba',                          'IES Salduba',                                    'Salduba',                        'San Pedro de Alcántara',   'Málaga',       FALSE, 90),
  ('ies-playamar',                         'IES Playamar',                                   'Playamar',                       'Torremolinos',             'Málaga',       FALSE, 91),
  ('ceip-sancti-petri',                    'CEIP Sancti Petri',                              'Sancti Petri',                   'Chiclana de la Frontera',  'Cádiz',        FALSE, 92),
  ('jesus-maria-valencia',                 'Colegio Jesús María Fernando el Católico',       'Jesús María Valencia',           'Valencia',                 'Valencia',     FALSE, 93),
  ('san-luis-gonzaga',                     'Colegio San Luis Gonzaga',                       'San Luis Gonzaga',               NULL,                       NULL,           FALSE, 94),
  ('real-instituto-jovellanos',            'Real Instituto de Jovellanos',                   'Jovellanos',                     'Gijón',                    'Asturias',     FALSE, 95),
  ('trilce-surco',                         'Colegio Trilce Surco',                           'Trilce',                         'Lima',                     'Perú',         FALSE, 96),
  ('colegio-zazuar',                       'Colegio Zazuar',                                 'Zazuar',                         'Madrid',                   'Madrid',       FALSE, 97),
  ('colegio-montserrat',                   'Colegio Montserrat',                             'Montserrat',                     'Madrid',                   'Madrid',       FALSE, 98),
  ('ievc-blanch-londres',                  'IEVC Blanch',                                    'Blanch',                         NULL,                       NULL,           FALSE, 99);

ON CONFLICT (slug) DO NOTHING;

-- El ON CONFLICT va aparte para que un slug repetido no anule la inserción
-- completa si se vuelve a ejecutar el guion.


-- =============================================================================
-- BLOQUE 3 · Incidencias de normalización
--
-- Respuestas que NO nombran un centro y que hay que resolver a mano durante la
-- migración. No se descartan en silencio: quedan aquí anotadas.
--
--   «Sí» (16 respuestas)
--       Es la respuesta afirmativa a «¿Has estudiado en el Montpellier?».
--       Mapea a 'montpellier'. Es la incidencia más numerosa y la más fácil.
--
--   «Otro» (7 respuestas)
--       Mapea a 'otro'. Habrá que preguntar al profesor al validar su perfil.
--
--   «No he dado clases a través de academias» (1 respuesta)
--       El profesor respondió a otra pregunta. Sin colegio.
--
--   «Universidad Complutense actualmente» (1 respuesta)
--       Va acompañada del Real Instituto de Jovellanos, que sí es el colegio.
--
--   «Valladolid» (1 respuesta)
--       Nombra una ciudad, no un centro. Pendiente de preguntar.
--
--   «Guillermo» (1 respuesta, hoja PADRES)
--       Fila descuadrada: el nombre del alumno cayó en la columna de colegio.
--       Ver el apartado de calidad de datos del informe de migración.
--
-- Además, dos respuestas describen una trayectoria en dos centros
-- («En el Montpellier hasta segundo de la ESO y en el IES Fortuny»). El modelo
-- guarda un único colegio de procedencia por profesor, así que hay que elegir
-- uno al validar. El criterio razonable es el centro donde cursó Bachillerato,
-- que es el temario que va a impartir.
-- =============================================================================
