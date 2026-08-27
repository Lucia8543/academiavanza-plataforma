'use server';

import { db } from '@/backend/repositories/cliente';
import { guardarAparato, type Suscripcion } from '@/backend/services/avisos';

/**
 * Alta del permiso de avisos.
 *
 * Quien pide el alta tiene que demostrar de algún modo que es ese profesor, y
 * aquí no hay contraseñas. Vale cualquiera de estas dos pruebas:
 *
 *   - El token de una solicitud suya. Le llegó a él y a nadie más.
 *   - El token que se le da al terminar el alta, en esa misma pantalla.
 *
 * Sin una de las dos no se guarda nada. Si no se comprobara, cualquiera podría
 * apuntar su propio móvil a los avisos de otro profesor y enterarse de que una
 * familia le ha escrito.
 */

export type ResultadoAlta = { ok: boolean; mensaje?: string };

export async function activarAvisos(
  token: string,
  suscripcion: Suscripcion,
): Promise<ResultadoAlta> {
  if (!token || !suscripcion?.endpoint || !suscripcion.keys?.p256dh) {
    return { ok: false, mensaje: 'Faltan datos para activar los avisos.' };
  }

  const profesorId = await profesorDelToken(token);

  if (!profesorId) {
    return {
      ok: false,
      mensaje: 'Ese enlace ya no vale. Pide uno nuevo desde tu ficha.',
    };
  }

  try {
    await guardarAparato(profesorId, suscripcion);
    return { ok: true };
  } catch (error) {
    console.error('[avisos] no se ha podido guardar el aparato:', error);
    return {
      ok: false,
      mensaje: 'No hemos podido activarlos. Inténtalo otra vez.',
    };
  }
}

async function profesorDelToken(token: string): Promise<string | null> {
  // 1. Token de una solicitud: le llegó al profesor en su aviso.
  const solicitud = await db.contactos.findUnique({
    where: { token_profesor: token },
    select: { profesor_id: true },
  });

  if (solicitud) return solicitud.profesor_id;

  // 2. Token de recién registrado, guardado en `app.accesos`. Caduca, para que
  //    un enlace olvidado en el historial de un ordenador compartido no sirva
  //    dentro de seis meses.
  const acceso = await db.accesos.findFirst({
    where: {
      token_hash: token,
      proposito: 'avisos',
      expira_en: { gt: new Date() },
    },
    select: { profesor_id: true },
  });

  return acceso?.profesor_id ?? null;
}
