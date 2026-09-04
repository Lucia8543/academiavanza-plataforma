-- ¿Cuánta gente ha metido ya un teléfono en un texto libre?
--
-- Se escribió para contestar a una pregunta concreta: el filtro de
-- `shared/schemas/datos-de-contacto` se añadió porque el mensaje de la familia
-- viaja al profesor antes de que nadie pague, y quien escribiera ahí su número
-- conseguía gratis lo único que cobra la plataforma. La pregunta era si eso ya
-- había estado pasando o si se ha llegado a tiempo.
--
-- Es de sólo lectura. No cambia ni una fila.
--
-- REPRODUCE EXACTAMENTE LA REGLA DEL CÓDIGO, y por eso está escrita así de
-- larga en vez de con un `~ '[0-9]{9}'` de una línea. Si las dos no dicen lo
-- mismo, el número que salga de aquí no mide el filtro que hay puesto, mide
-- otro. Los tres pasos son los mismos:
--
--   1. Trocear por cifras, espacios, puntos y guiones. Cualquier letra corta.
--   2. Quitar el prefijo internacional y quedarse con los trozos de nueve
--      cifras exactas.
--   3. Que la primera sea de 6 a 9.
--
-- UN AVISO SOBRE LO QUE NO PUEDE VERSE AQUÍ
--
-- La limpieza de los noventa días vacía el mensaje y el nombre de las
-- solicitudes viejas. Así que esto sólo ve los últimos tres meses, y lo que
-- pasara antes ya no se puede contar. El número que salga es un suelo, no un
-- total.
--
-- Y NO SE SACA EL TEXTO DEL MENSAJE. Sólo el trozo de cifras y el código de la
-- solicitud. Ahí dentro hay mensajes de familias sobre menores, y para
-- responder a esta pregunta no hace ninguna falta leerlos.

WITH trozos AS (
  SELECT
    c.codigo,
    'mensaje'  AS campo,
    m.partes[1] AS trozo
  FROM app.contactos c,
       LATERAL regexp_matches(c.mensaje, '[0-9][0-9 .-]*[0-9]', 'g') AS m(partes)
  WHERE c.mensaje IS NOT NULL AND c.mensaje <> ''

  UNION ALL

  -- El nombre entra porque el profesor también lo ve en la pantalla donde
  -- decide, igual que el mensaje. Es la misma puerta con otro cartel.
  SELECT
    c.codigo,
    'nombre'   AS campo,
    m.partes[1]
  FROM app.contactos c,
       LATERAL regexp_matches(c.nombre_familia, '[0-9][0-9 .-]*[0-9]', 'g') AS m(partes)
  WHERE c.nombre_familia IS NOT NULL AND c.nombre_familia <> ''
),

soloCifras AS (
  SELECT codigo, campo, trozo,
         regexp_replace(trozo, '\D', '', 'g') AS cifras
  FROM trozos
),

sinPrefijo AS (
  SELECT codigo, campo, trozo,
         CASE
           WHEN cifras LIKE '0034%'                        THEN substr(cifras, 5)
           WHEN cifras LIKE '34%' AND length(cifras) = 11  THEN substr(cifras, 3)
           WHEN cifras LIKE '0%'  AND length(cifras) = 10  THEN substr(cifras, 2)
           ELSE cifras
         END AS cifras
  FROM soloCifras
)

SELECT codigo, campo, trozo AS lo_encontrado
FROM sinPrefijo
WHERE length(cifras) = 9
  AND cifras ~ '^[6-9]'
ORDER BY codigo;


-- Y el total sobre el que se mide, que sin él la cifra de arriba no dice nada.
-- Cinco de diez es una fuga; cinco de mil doscientas es una anécdota.

SELECT
  count(*)                                                  AS solicitudes_con_mensaje,
  min(enviado_en)::date                                     AS la_mas_antigua_que_queda
FROM app.contactos
WHERE mensaje IS NOT NULL AND mensaje <> '';


-- Lo mismo en los textos del profesor, que es la fuga peor de las dos: lo suyo
-- no va en un correo a una persona, se publica en una página que ve cualquiera.

WITH trozos AS (
  SELECT p.slug, 'puntos fuertes' AS campo, m.partes[1] AS trozo
  FROM app.profesores p,
       LATERAL regexp_matches(p.puntos_fuertes, '[0-9][0-9 .-]*[0-9]', 'g') AS m(partes)
  WHERE p.puntos_fuertes IS NOT NULL

  UNION ALL

  SELECT p.slug, 'nota de horario', m.partes[1]
  FROM app.profesores p,
       LATERAL regexp_matches(p.nota_disponibilidad, '[0-9][0-9 .-]*[0-9]', 'g') AS m(partes)
  WHERE p.nota_disponibilidad IS NOT NULL

  UNION ALL

  SELECT p.slug, 'colegio escrito a mano', m.partes[1]
  FROM app.profesores p,
       LATERAL regexp_matches(p.colegio_otro, '[0-9][0-9 .-]*[0-9]', 'g') AS m(partes)
  WHERE p.colegio_otro IS NOT NULL
),

soloCifras AS (
  SELECT slug, campo, trozo, regexp_replace(trozo, '\D', '', 'g') AS cifras
  FROM trozos
),

sinPrefijo AS (
  SELECT slug, campo, trozo,
         CASE
           WHEN cifras LIKE '0034%'                        THEN substr(cifras, 5)
           WHEN cifras LIKE '34%' AND length(cifras) = 11  THEN substr(cifras, 3)
           WHEN cifras LIKE '0%'  AND length(cifras) = 10  THEN substr(cifras, 2)
           ELSE cifras
         END AS cifras
  FROM soloCifras
)

SELECT slug, campo, trozo AS lo_encontrado
FROM sinPrefijo
WHERE length(cifras) = 9
  AND cifras ~ '^[6-9]'
ORDER BY slug;


-- Y los correos y las arrobas, que en SQL sí caben en una línea porque no
-- tienen el problema de los separadores.

SELECT codigo, 'mensaje' AS campo
FROM app.contactos
WHERE mensaje ~ '[^[:space:]@]+@[^[:space:]@]+\.[A-Za-z]{2,}'
UNION ALL
SELECT slug, 'ficha del profesor'
FROM app.profesores
WHERE coalesce(puntos_fuertes, '') || ' ' || coalesce(nota_disponibilidad, '')
      ~ '[^[:space:]@]+@[^[:space:]@]+\.[A-Za-z]{2,}';
