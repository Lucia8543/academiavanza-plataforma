import { db } from '@/backend/repositories/cliente';
import { enviar } from '@/backend/services/correo';
import type { DatosContacto } from '@/shared/schemas/contacto';

/**
 * Una familia escribe a un profesor.
 *
 * El orden importa y es este: primero se guarda, después se avisa. Si se
 * hiciera al revés y el guardado fallara, habríamos avisado de un mensaje que
 * no existe. Así, como mucho, queda un mensaje guardado sin avisar, que se
 * puede recuperar desde el panel.
 */

export type Resultado =
  | { ok: true; avisado: boolean }
  | { ok: false; motivo: 'no-disponible' | 'error' };

export async function registrarContacto(
  slug: string,
  datos: DatosContacto,
): Promise<Resultado> {
  // Se busca por slug y no por identificador para que la dirección de la página
  // sea lo único que necesita el formulario. Y se exige que siga publicado: una
  // ficha retirada entre que se abrió la página y se envió el formulario no
  // debe recibir nada.
  const profesor = await db.profesores.findFirst({
    where: { slug, estado: 'activo', disponible: true },
    select: { id: true, nombre: true, email: true },
  });

  if (!profesor) return { ok: false, motivo: 'no-disponible' };

  try {
    const contacto = await db.contactos.create({
      data: {
        profesor_id: profesor.id,
        nombre_familia: datos.nombreFamilia,
        telefono_familia: datos.telefono,
        nivel_id: datos.nivelId,
        modalidad: datos.modalidad ?? null,
        mensaje: datos.mensaje || null,
        es_tutor_legal: datos.esTutorLegal,
        acepta_privacidad: datos.aceptaPrivacidad,
      },
      select: { id: true },
    });

    // El nombre del curso, para que el aviso diga «3.º de la ESO» y no un
    // identificador que no significa nada para quien lo lee.
    const nivel = await db.niveles.findUnique({
      where: { id: datos.nivelId },
      select: { nombre: true },
    });

    const avisado = await avisar(profesor, datos, nivel?.nombre ?? null);

    if (avisado) {
      await db.contactos.update({
        where: { id: contacto.id },
        data: { correo_entregado: true },
      });
    }

    return { ok: true, avisado };
  } catch (error) {
    console.error('[contacto] No se ha podido guardar:', error);
    return { ok: false, motivo: 'error' };
  }
}

async function avisar(
  profesor: { nombre: string; email: string },
  datos: DatosContacto,
  nivel: string | null,
): Promise<boolean> {
  const lineas = [
    `Hola ${profesor.nombre}:`,
    '',
    'Una familia ha visto tu ficha en AcademiAvanza y quiere hablar contigo.',
    '',
    `Nombre:   ${datos.nombreFamilia}`,
    `Teléfono: ${datos.telefono}`,
  ];

  if (nivel) lineas.push(`Curso:    ${nivel}`);

  if (datos.mensaje) {
    lineas.push('', 'Lo que te cuenta:', datos.mensaje);
  }

  lineas.push(
    '',
    'Llámala tú: ella no tiene tu teléfono ni tu correo, y no los va a tener.',
    '',
    'Si ya no puedes coger alumnos, entra en tu ficha y márcala como no',
    'disponible. Dejarás de recibir estos avisos y no aparecerás en el',
    'directorio hasta que la vuelvas a activar.',
    '',
    'AcademiAvanza',
  );

  return enviar({
    para: profesor.email,
    asunto: `Una familia quiere clases contigo — ${datos.nombreFamilia}`,
    cuerpo: lineas.join('\n'),
  });
}
