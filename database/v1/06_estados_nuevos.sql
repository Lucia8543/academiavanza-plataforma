-- =============================================================================
-- RECORDATORIOS DE PAGO Y DEVOLUCIONES
--
-- Dos agujeros que quedaban abiertos:
--
--   1. Un profesor que acepta y una familia que no paga dejaban la solicitud
--      viva para siempre. El profesor se queda esperando una respuesta que no
--      llega y nadie le dice nunca que puede olvidarse.
--
--   2. Devolver 10 € por Bizum no dejaba rastro en ninguna parte. A los dos
--      meses no había forma de saber a quién se le devolvió ni por qué.
--
-- Los dos nuevos estados no se pueden crear dentro de una transacción junto con
-- lo que los usa, así que este fichero va en dos partes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Los estados nuevos
--
--   cancelada  la familia ha dicho expresamente que lo deja
--   devuelta   se le ha devuelto el dinero
--
-- «Cancelada» y «caducada» se separan a propósito: una familia que contesta
-- «déjalo» está siendo educada, y una que no contesta nada probablemente se
-- olvidó. Mezclarlas sería perder la única señal que distingue las dos cosas.
-- -----------------------------------------------------------------------------
ALTER TYPE app.estado_solicitud ADD VALUE IF NOT EXISTS 'cancelada';
ALTER TYPE app.estado_solicitud ADD VALUE IF NOT EXISTS 'devuelta';
