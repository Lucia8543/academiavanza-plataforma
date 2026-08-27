import webpush from 'web-push';
import { db } from '@/backend/repositories/cliente';
import { enviar, type Correo } from '@/backend/services/correo';

/**
 * Avisar a un profesor.
 *
 * Dos canales, y los dos siempre. La notificación al móvil llega en el momento
 * y se contesta desde el autobús; el correo llega más tarde pero se queda ahí
 * hasta que alguien lo abre. Se mandan los dos porque fallan de maneras
 * distintas, y lo que no puede pasar es que una solicitud se quede parada
 * porque nadie se enteró.
 *
 * Nada de esto lanza excepciones. Un aviso que falla no puede tumbar la
 * solicitud que lo provocó: la solicitud ya está guardada y se puede reintentar,
 * pero perderla no se arregla.
 */

let configurado = false;

function configurar(): boolean {
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const asunto = process.env.VAPID_ASUNTO ?? 'mailto:info@academiavanza.es';

  if (!publica || !privada) return false;
  if (configurado) return true;

  webpush.setVapidDetails(asunto, publica, privada);
  configurado = true;
  return true;
}


export type Aviso = {
  titulo: string;
  cuerpo: string;
  /** A dónde lleva al tocarla. */
  url: string;
  etiqueta?: string;
};

export type ResultadoAviso = { push: boolean; correo: boolean };

/**
 * Manda el aviso por los dos canales, siempre.
 *
 * El correo no es una red de emergencia: sale también cuando la notificación ha
 * llegado. Puede parecer redundante y lo es a propósito, porque una
 * notificación se descarta de un manotazo sin leerla, se pierde entre otras
 * veinte, o llega a un móvil que estaba en silencio en un cajón. El correo se
 * queda ahí hasta que alguien lo abre.
 *
 * El coste de repetirse es que un profesor reciba dos avisos de lo mismo. El
 * coste de no repetirse es una familia esperando a alguien que nunca se enteró.
 * No hay comparación.
 *
 * Los dos se lanzan a la vez: el correo tarda, y no tiene sentido que la
 * familia espere por él.
 *
 * Devuelve por qué canales ha salido, y eso se guarda en la solicitud. Cuando
 * una solicitud lleve tres días parada, la pregunta será «¿se enteró?», y sin
 * esto no hay forma de responderla.
 */
export async function avisar(
  profesorId: string,
  aviso: Aviso,
  correoDeAviso: Correo,
): Promise<ResultadoAviso> {
  const [push, correo] = await Promise.all([
    avisarAlMovil(profesorId, aviso),
    enviar(correoDeAviso),
  ]);

  return { push, correo };
}

/** Devuelve true si al menos un aparato ha recibido el aviso. */
async function avisarAlMovil(
  profesorId: string,
  aviso: Aviso,
): Promise<boolean> {
  if (!configurar()) return false;

  const aparatos = await db.suscripciones_push.findMany({
    where: { profesor_id: profesorId, fallo_en: null },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (aparatos.length === 0) return false;

  const contenido = JSON.stringify(aviso);
  let alguno = false;

  // Se avisa a todos los aparatos, no sólo al primero: no hay forma de saber
  // cuál tiene el profesor en la mano.
  for (const aparato of aparatos) {
    try {
      await webpush.sendNotification(
        {
          endpoint: aparato.endpoint,
          keys: { p256dh: aparato.p256dh, auth: aparato.auth },
        },
        contenido,
      );

      alguno = true;
      await db.suscripciones_push.update({
        where: { id: aparato.id },
        data: { usado_en: new Date() },
      });
    } catch (error) {
      await anotarFallo(aparato.id, error);
    }
  }

  return alguno;
}

/**
 * Un aparato que ya no existe.
 *
 * Un 404 o un 410 significan que esa dirección de entrega está muerta: móvil
 * formateado, permiso retirado, navegador reinstalado. Se marca y se deja de
 * intentar, porque insistir contra una dirección muerta es gastar tiempo en
 * cada solicitud para siempre.
 *
 * Los demás errores —un corte de red, el servicio caído— no se marcan: eso se
 * arregla solo y borrar la suscripción por un fallo pasajero dejaría al
 * profesor incomunicado sin que él haya hecho nada.
 */
async function anotarFallo(id: string, error: unknown): Promise<void> {
  const codigo =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode: unknown }).statusCode)
      : 0;

  if (codigo === 404 || codigo === 410) {
    await db.suscripciones_push.update({
      where: { id },
      data: {
        fallo_en: new Date(),
        motivo_fallo: `El navegador ya no acepta avisos (${codigo})`,
      },
    });
    return;
  }

  console.error('[avisos] fallo al notificar, se reintentará:', error);
}

// -----------------------------------------------------------------------------
// Alta de aparatos
// -----------------------------------------------------------------------------

export type Suscripcion = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * Guarda el permiso que acaba de dar un profesor.
 *
 * Si vuelve a dar permiso desde el mismo navegador llega el mismo `endpoint`,
 * así que se actualiza en vez de duplicarse. Y se limpia cualquier fallo
 * anterior: si estaba marcado como muerto y ha vuelto, es que ya no lo está.
 */
export async function guardarAparato(
  profesorId: string,
  suscripcion: Suscripcion,
): Promise<void> {
  await db.suscripciones_push.upsert({
    where: { endpoint: suscripcion.endpoint },
    create: {
      profesor_id: profesorId,
      endpoint: suscripcion.endpoint,
      p256dh: suscripcion.keys.p256dh,
      auth: suscripcion.keys.auth,
    },
    update: {
      profesor_id: profesorId,
      p256dh: suscripcion.keys.p256dh,
      auth: suscripcion.keys.auth,
      fallo_en: null,
      motivo_fallo: null,
    },
  });
}

