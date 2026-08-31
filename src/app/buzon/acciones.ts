'use server';

import { guardarIncidencia } from '@/backend/services/incidencias';
import { etiquetaDeSospecha } from '@/shared/schemas/trampa-bots';

/**
 * El envío del buzón de fallos.
 *
 * Lleva el mismo detector antibots que los demás formularios abiertos, un campo
 * señuelo y un tiempo mínimo de relleno, pero **ya no descarta nada**.
 *
 * Antes, cuando la trampa saltaba, se contestaba «recibido» y el mensaje se
 * tiraba. En un buzón de fallos eso es especialmente malo: quien escribe aquí
 * es alguien a quien la web le ha fallado, y perderle el aviso significa que el
 * fallo sigue ahí y encima ya nadie lo va a contar dos veces.
 *
 * Se guarda todo con su etiqueta. Si algún día llega basura de verdad, se ve
 * en el panel y se borra en un minuto, que cuesta mucho menos que un fallo que
 * nunca se llegó a leer.
 */

export type EstadoBuzon = { ok?: boolean; error?: string };

export async function enviarIncidencia(
  _previo: EstadoBuzon,
  formulario: FormData,
): Promise<EstadoBuzon> {
  const sospecha = etiquetaDeSospecha(formulario);
  if (sospecha) {
    console.warn(`[buzon] aviso marcado como sospechoso por ${sospecha}`);
  }

  const resultado = await guardarIncidencia({
    texto: String(formulario.get('texto') ?? ''),
    pagina: String(formulario.get('pagina') ?? '') || null,
    email: String(formulario.get('email') ?? '') || null,
    sospecha,
  });

  return resultado.ok ? { ok: true } : { error: resultado.motivo };
}
