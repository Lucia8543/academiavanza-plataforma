'use server';

import { guardarIncidencia } from '@/backend/services/incidencias';
import { oler } from '@/shared/schemas/trampa-bots';

/**
 * El envío del buzón de fallos.
 *
 * Lleva la misma trampa antibots que los demás formularios abiertos: un campo
 * señuelo y un tiempo mínimo de relleno. Un buzón público sin freno se llena de
 * basura en una semana y deja de leerse, que es la manera más silenciosa de que
 * deje de servir para nada.
 *
 * Cuando la trampa salta **se responde que todo ha ido bien**. Decirle a un
 * guion automático que le hemos calado sólo sirve para que pruebe otra cosa.
 */

export type EstadoBuzon = { ok?: boolean; error?: string };

export async function enviarIncidencia(
  _previo: EstadoBuzon,
  formulario: FormData,
): Promise<EstadoBuzon> {
  if (oler(formulario)) return { ok: true };

  const resultado = await guardarIncidencia({
    texto: String(formulario.get('texto') ?? ''),
    pagina: String(formulario.get('pagina') ?? '') || null,
    email: String(formulario.get('email') ?? '') || null,
  });

  return resultado.ok ? { ok: true } : { error: resultado.motivo };
}
