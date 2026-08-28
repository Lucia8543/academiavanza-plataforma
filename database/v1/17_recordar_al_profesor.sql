-- =============================================================================
-- LA FAMILIA QUE ESPERA A ALGUIEN QUE NO VA A CONTESTAR
--
-- Hasta ahora, cuando una familia escribía a un profesor pasaba esto: se le
-- mandaba un correo y un aviso al móvil, y **nunca más se le volvía a avisar**.
-- Si no contestaba, la solicitud se quedaba treinta días en «esperando al
-- profesor» y luego cambiaba sola a «caducada», **sin decirle nada a la
-- familia**.
--
-- Visto desde fuera, que es como hay que verlo: una madre escribe en septiembre
-- buscando clases de mates para su hija. No recibe respuesta. Durante un mes su
-- página de seguimiento le dice que todavía puede pasar algo. Al cabo de treinta
-- días cambia sola a «caducada» y nadie se lo cuenta. Para entonces hace tres
-- semanas que buscó en otro sitio, y lo que recuerda de AcademiAvanza es que
-- escribió y no le contestó nadie.
--
-- El plazo pasa a siete días, con dos recordatorios al profesor por el camino y
-- un correo a la familia al cerrar. Estas dos columnas son lo que permite mandar
-- el segundo recordatorio sin repetir el primero todos los días.
-- =============================================================================

BEGIN;

ALTER TABLE app.contactos
  -- Cuántas veces se le ha recordado. Va hasta dos y ahí se queda: insistir más
  -- no es un recordatorio, es acoso, y quien no contesta a dos no va a contestar
  -- al quinto.
  ADD COLUMN IF NOT EXISTS recordatorios_profesor SMALLINT NOT NULL DEFAULT 0,
  -- Cuándo fue el último. Es lo que evita mandar los dos el mismo día.
  ADD COLUMN IF NOT EXISTS recordatorio_profesor_en TIMESTAMPTZ;

COMMENT ON COLUMN app.contactos.recordatorios_profesor IS
  'Recordatorios enviados al profesor por no contestar. Máximo dos.';

COMMENT ON COLUMN app.contactos.recordatorio_profesor_en IS
  'Fecha del último recordatorio al profesor. NULL si todavía no se le ha insistido.';

-- La tarea diaria busca siempre lo mismo: solicitudes que siguen esperando al
-- profesor, ordenadas por cuándo se enviaron. Sin índice, esto crece con la
-- tabla entera; con él, sólo con las que están vivas.
CREATE INDEX IF NOT EXISTS idx_contactos_esperando_profesor
  ON app.contactos (enviado_en)
  WHERE estado = 'pendiente_profesor';

COMMIT;
