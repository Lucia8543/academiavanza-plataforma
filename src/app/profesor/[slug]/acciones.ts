'use server';

import { redirect } from 'next/navigation';
import { crearSolicitud } from '@/backend/services/solicitud';
import { esquemaContacto } from '@/shared/schemas/contacto';
import { oler } from '@/shared/schemas/trampa-bots';

/**
 * Recibe el formulario con el que una familia escribe a un profesor.
 *
 * Si todo va bien no devuelve nada: lleva a la familia a su página privada de
 * seguimiento. Esa página es su única referencia a partir de aquí, así que
 * conviene que la vea cuanto antes y no dentro de un mensaje de confirmación
 * que se cierra.
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
  // Igual que en el alta: al guion se le contesta que todo ha ido bien y se
  // descarta en silencio.
  const sospecha = oler(formulario);
  if (sospecha) {
    console.warn(`[contacto] solicitud descartada por ${sospecha}`);
    redirect('/profesores');
  }

  const cadena = (campo: string) => String(formulario.get(campo) ?? '');
  const slug = cadena('slug');

  const enviado = {
    nombreFamilia: cadena('nombreFamilia'),
    telefono: cadena('telefono'),
    email: cadena('email'),
    nivelId: cadena('nivelId'),
    // Para cuándo lo necesita. Sin esta línea el formulario pintaba las tres
    // opciones, el navegador las enviaba y aquí se tiraban: como el esquema
    // tiene valor por defecto, todo el mundo acababa con cinco días y nadie se
    // enteraba. Un fallo sin excepción y sin rastro en el registro.
    // `|| undefined` y no la cadena vacía: el esquema es un enum con valor por
    // defecto, y '' no es uno de los tres valores válidos. Sin esto, un envío
    // sin JavaScript fallaría la validación en vez de coger el plazo corto.
    urgencia: cadena('urgencia') || undefined,
    mensaje: cadena('mensaje'),
    esTutorLegal: formulario.get('esTutorLegal') === 'on',
    aceptaPrivacidad: formulario.get('aceptaPrivacidad') === 'on',
    vale: cadena('vale'),
  };

  // Lo escrito, para devolverlo si algo falla. Las casillas no se devuelven:
  // un consentimiento se marca cada vez, no se hereda de un intento anterior.
  const valores = {
    nombreFamilia: enviado.nombreFamilia,
    telefono: enviado.telefono,
    email: enviado.email,
    nivelId: enviado.nivelId,
    mensaje: enviado.mensaje,
    vale: enviado.vale,
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

  const resultado = await crearSolicitud(
    slug,
    validado.data,
    validado.data.vale || undefined,
  );

  if (!resultado.ok) {
    const mensaje =
      resultado.motivo === 'demasiadas'
        ? resultado.explicacion
        : resultado.motivo === 'no-disponible'
          ? 'Este profesor ya no está disponible. Prueba con otro del directorio.'
          : resultado.motivo === 'sin-hueco'
            ? // Pasa cuando la página se cargó antes de que él dijera que se
              // había llenado. Se explica el motivo: «no está disponible» a
              // secas, sobre una ficha que sí se ve, parece un fallo.
              'Este profesor acaba de decirnos que ya no tiene hueco, así que no podemos pasarle tu mensaje. No se te ha cobrado nada. Prueba con otro del directorio.'
            : 'Algo ha fallado por nuestra parte. Inténtalo de nuevo en un rato.';

    return { ok: false, mensaje, valores };
  }

  // `redirect` interrumpe la función lanzando: nada de lo de abajo se ejecuta.
  redirect(`/solicitud/${resultado.token}`);
}
