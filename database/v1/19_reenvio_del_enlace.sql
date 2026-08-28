-- =============================================================================
-- EL PROFESOR QUE HA PERDIDO SU ENLACE
--
-- Aquí no hay contraseñas: el profesor entra a su ficha por un enlace largo que
-- le llega al correo, y ese enlace es su única llave. Está razonado en el
-- ADR 0005 y es una buena decisión, pero le faltaba la otra mitad: **qué pasa
-- cuando alguien lo pierde**.
--
-- Hasta hoy, nada automático. La página de «aquí no hay nada» le decía que
-- escribiera a info@academiavanza.es y que se lo mandaban a mano. Eso es una
-- persona buscando en la base de datos, uno por uno, cada vez. Con la dueña del
-- proyecto fuera de España durante meses, es exactamente el tipo de flujo que
-- este rediseño existe para eliminar.
--
-- La recuperación no necesita contraseña porque la llave ya es el correo: el
-- enlace se manda ahí y sólo ahí, así que quien controla ese buzón ya podía
-- leer el original. No se abre ninguna puerta que no estuviera abierta.
--
-- Esta columna es lo único que hacía falta, y no es para el profesor: es para
-- que nadie use ese formulario para llenarle el buzón a otro, ni para gastar el
-- cupo de correos a base de darle al botón.
-- =============================================================================

BEGIN;

ALTER TABLE app.profesores
  ADD COLUMN IF NOT EXISTS enlace_reenviado_en TIMESTAMPTZ;

COMMENT ON COLUMN app.profesores.enlace_reenviado_en IS
  'Último reenvío del enlace del panel a su correo. Sirve de freno: no se reenvía dos veces seguidas.';

COMMIT;
