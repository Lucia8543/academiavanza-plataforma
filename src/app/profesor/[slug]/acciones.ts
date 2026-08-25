'use server';

import { registrarContacto } from '@/backend/services/contacto-familia';
import { esquemaContacto } from '@/shared/schemas/contacto';

/**
 * Recibe el formulario con el que una familia escribe a un profesor.
 */

export type EstadoContacto = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  valores?: Record<string, string>;
};

export async function enviarContacto(
  _previo: EstadoContacto,
  formulario: FormData,
): Promise<EstadoContacto> {
  const cadena = (campo: string) => String(formulario.get(campo) ?? '');
  const slug = cadena('slug');

  const enviado = {
    nombreFamilia: cadena('nombreFamilia'),
    telefono: cadena('telefono'),
    nivelId: cadena('nivelId'),
    mensaje: cadena('mensaje'),
    esTutorLegal: formulario.get('esTutorLegal') === 'on',
    aceptaPrivacidad: formulario.get('aceptaPrivacidad') === 'on',
  };

  // Lo escrito, para devolverlo si algo falla. Las casillas no se devuelven:
  // un consentimiento se marca cada vez, no se hereda de un intento anterior.
  const valores = {
    nombreFamilia: enviado.nombreFamilia,
    telefono: enviado.telefono,
    nivelId: enviado.nivelId,
    mensaje: enviado.mensaje,
  };

  const validado = esquemaContacto.safeParse(enviado);

  if (!validado.success) {
    const errores: Record<string, string> = {};
    for (const problema of validado.error.issues) {
      const campo = String(problema.path[0] ?? 'general');
      errores[campo] ??= problema.message;
    }
    return { ok: false, mensaje: 'Revisa lo marcado.', errores, valores };
  }

  const resultado = await registrarContacto(slug, validado.data);

  if (!resultado.ok) {
    return {
      ok: false,
      mensaje:
        resultado.motivo === 'no-disponible'
          ? 'Este profesor ya no está disponible. Prueba con otro del directorio.'
          : 'Algo ha fallado por nuestra parte. Inténtalo de nuevo en un rato.',
      valores,
    };
  }

  return { ok: true };
}
