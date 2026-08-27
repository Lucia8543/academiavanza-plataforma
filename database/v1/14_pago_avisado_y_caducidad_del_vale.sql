-- =============================================================================
-- DOS AGUJEROS QUE SE ABREN EL DÍA QUE FUNCIONE EL CORREO
--
-- 1 · LA FAMILIA QUE PAGA Y NADIE SE ENTERA
--
-- Confirmar el Bizum es manual, así que entre que una familia paga y Lucía lo
-- comprueba pueden pasar horas o días. Durante ese rato la solicitud sigue en
-- «aceptada», indistinguible de una en la que nadie ha pagado nada. Y las
-- tareas automáticas la tratan como tal: a los dos días le reclaman el pago a
-- quien ya pagó, y a los siete le cierran la solicitud y le dicen al profesor
-- que la familia no ha seguido adelante.
--
-- Hoy no pasa, y por un motivo incómodo: el correo está apagado, así que el
-- recordatorio nunca sale y el reloj del cierre nunca arranca. Es decir, que
-- esto está en pie gracias a una avería. El día que se verifique el dominio se
-- convierte en un fallo de cobro de los que pierden a una familia para siempre.
--
-- `pago_avisado_en` es la familia diciendo «ya lo he hecho». No abre ningún
-- teléfono ni se fía de nadie: sólo apaga la maquinaria que la estaba tratando
-- como morosa. Mentir ahí no sirve de nada, porque sin el Bizum confirmado no
-- se abre ningún contacto.
--
-- 2 · EL VALE QUE NUNCA CADUCA
--
-- El código daba por hecho que un vale muere con su solicitud a los noventa
-- días. Es falso: la limpieza no borra las solicitudes pagadas, las anonimiza,
-- y no toca `vale_concedido`. Así que el vale seguía siendo canjeable para
-- siempre mientras un correo avisaba de una caducidad que no existía.
--
-- Se le pone fecha propia. Un vale sin fecha es una deuda abierta sin plazo, y
-- además obligaba a deducir su caducidad de la fecha de otra cosa.
-- =============================================================================

BEGIN;

ALTER TABLE app.contactos
  ADD COLUMN IF NOT EXISTS pago_avisado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vale_caduca_en  TIMESTAMPTZ;

COMMENT ON COLUMN app.contactos.pago_avisado_en IS
  'Cuándo dijo la familia que había hecho el Bizum. No es un pago confirmado: eso sigue siendo pagada_en. Sirve para no reclamarle ni cerrarle la solicitud a quien ya ha pagado.';
COMMENT ON COLUMN app.contactos.vale_caduca_en IS
  'Hasta cuándo se puede gastar el contacto gratis. Se comprueba al crear una solicitud con vale.';

-- Avisar de que se ha pagado sólo tiene sentido si hay algo que pagar. Sin esto,
-- una fila podría decir que avisó del pago de una solicitud que el profesor
-- todavía no ha aceptado, y el panel enseñaría un cobro que no existe.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_aviso_pago_coherente;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_aviso_pago_coherente CHECK (
  pago_avisado_en IS NULL OR aceptada_en IS NOT NULL
);

-- Y una fecha de caducidad sólo tiene sentido si hay vale. Al gastarlo, el vale
-- se apaga y la fecha se borra con él.
ALTER TABLE app.contactos DROP CONSTRAINT IF EXISTS contacto_vale_con_caducidad;
ALTER TABLE app.contactos ADD CONSTRAINT contacto_vale_con_caducidad CHECK (
  vale_caduca_en IS NULL OR vale_concedido
);

-- Los vales que ya existan se quedan sin fecha, y sin fecha no se pueden gastar.
-- Es deliberado: hoy no hay ninguno en producción, y si lo hubiera, preferimos
-- que una familia escriba a que un vale sin plazo siga vivo por descuido.
-- Si algún día hay que rellenarlos, se hace a mano y sabiendo a quién.

-- Para que el panel encuentre de un vistazo los pagos avisados y sin confirmar,
-- que es lo primero que Lucía tiene que mirar cada día.
CREATE INDEX IF NOT EXISTS idx_contactos_pago_avisado
  ON app.contactos (pago_avisado_en)
  WHERE pago_avisado_en IS NOT NULL AND estado = 'aceptada';

-- Para la tarea diaria que avisa de los vales a punto de caducar.
CREATE INDEX IF NOT EXISTS idx_contactos_vale_caduca
  ON app.contactos (vale_caduca_en)
  WHERE vale_concedido AND vale_caduca_en IS NOT NULL;

COMMIT;
