/**
 * Envío de correo.
 *
 * Hoy no hay dominio verificado, así que no sale ningún correo: la función deja
 * constancia en el registro del servidor y devuelve `false`. Quien la llama
 * tiene que estar preparado para eso y no dar el aviso por hecho.
 *
 * Está escrita así, y no como un hueco vacío pendiente de rellenar, porque el
 * día que exista la clave sólo hay que ponerla en las variables de entorno: no
 * se toca ni una línea de código. Y mientras tanto el sistema no miente a nadie
 * diciendo que ha avisado cuando no lo ha hecho.
 */

export type Correo = {
  para: string;
  asunto: string;
  /**
   * Versión en texto plano.
   *
   * Se manda siempre, aunque haya HTML. No es una reliquia: los filtros de
   * spam desconfían de los correos que sólo traen HTML, y hay quien los lee en
   * un reloj o con un lector de pantalla.
   */
  cuerpo: string;
  /** Versión con formato. Opcional. */
  html?: string;
  /** A dónde contesta quien recibe el correo, si pulsa «Responder». */
  responderA?: string;
};

const REMITENTE = process.env.EMAIL_REMITENTE;
const CLAVE = process.env.RESEND_API_KEY;

/**
 * A dónde va lo que conteste la gente.
 *
 * Los correos salen desde un subdominio técnico —`send.academiavanza.es`— que
 * existe para que enviar no toque el buzón de verdad. El problema es que ese
 * subdominio no tiene buzón: quien le dé a «Responder» estaría escribiéndole a
 * nadie, y encima sin enterarse de que su mensaje se ha perdido.
 *
 * Y responder es exactamente lo que hace la gente. Una madre que recibe «le
 * hemos preguntado a Diego si puede darte clase» y quiere añadir algo no busca
 * la web: contesta al correo, como contestaría a cualquier otro.
 *
 * Así que todo lo que sale lleva la respuesta apuntada al buzón que sí se lee.
 * Una plantilla puede poner el suyo si lo necesita; si no dice nada, va aquí.
 */
const RESPUESTAS = process.env.EMAIL_RESPUESTAS ?? 'info@academiavanza.es';

export function correoConfigurado(): boolean {
  return Boolean(CLAVE && REMITENTE);
}

/**
 * Devuelve `true` sólo si el correo ha salido de verdad.
 *
 * No lanza excepciones: un fallo de correo no debe tumbar la operación que lo
 * provocó. Si una familia escribe y el aviso no sale, el mensaje ya está
 * guardado y se puede reenviar; perder también el mensaje sería el doble de
 * malo.
 */
export async function enviar(correo: Correo): Promise<boolean> {
  if (!correoConfigurado()) {
    console.warn(
      `[correo] Sin enviar (falta RESEND_API_KEY o EMAIL_REMITENTE). ` +
        `Destinatario: ${correo.para} · Asunto: ${correo.asunto}`,
    );
    return false;
  }

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLAVE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [correo.para],
        subject: correo.asunto,
        text: correo.cuerpo,
        ...(correo.html ? { html: correo.html } : {}),
        reply_to: correo.responderA ?? RESPUESTAS,
      }),
    });

    if (!respuesta.ok) {
      console.error(
        `[correo] Rechazado (${respuesta.status}): ${await respuesta.text()}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('[correo] No se ha podido enviar:', error);
    return false;
  }
}
