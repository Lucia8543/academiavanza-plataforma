'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/backend/repositories/cliente';
import { tokenDelPanel } from '@/backend/services/acceso-profesor';
import { enviar } from '@/backend/services/correo';
import {
  correoFichaPublicada,
  correoFichaRechazada,
} from '@/backend/services/plantillas-correo';
import {
  abrirSesion,
  cerrarSesion,
  claveCorrecta,
  haySesion,
} from '@/backend/services/sesion-admin';

/**
 * Acciones del panel de administración.
 *
 * Todas comprueban la sesión antes de tocar nada. No basta con esconder los
 * botones: si alguien descubriera la dirección de una acción, tiene que
 * encontrarse con una puerta cerrada y no con una ficha publicándose.
 */

async function exigirSesion() {
  if (!(await haySesion())) {
    throw new Error('Sin sesión');
  }
}

export async function entrar(
  _previo: { error?: string },
  formulario: FormData,
): Promise<{ error?: string }> {
  const clave = String(formulario.get('clave') ?? '');

  // La espera tras un fallo la aplica el propio servicio, y crece con los
  // intentos fallidos seguidos.
  if (!(await claveCorrecta(clave))) {
    return { error: 'Contraseña incorrecta' };
  }

  await abrirSesion();
  redirect('/admin');
}

export async function salir() {
  await cerrarSesion();
  redirect('/admin/entrar');
}

export async function aprobar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  const profesor = await db.profesores.update({
    where: { id },
    data: {
      estado: 'activo',
      aprobado_en: new Date(),
      motivo_rechazo: null,
      // Publicar cuenta como confirmar que está disponible: el reloj del
      // recordatorio trimestral empieza a contar aquí.
      disponibilidad_confirmada_en: new Date(),
    },
    select: { id: true, nombre: true, email: true, slug: true },
  });

  // Y ahora se lo decimos. Sin esto, quien se dio de alta esperó dos días y no
  // se enteró nunca de que su ficha había salido.
  await enviar(
    correoFichaPublicada({
      para: profesor.email,
      nombreProfesor: profesor.nombre,
      slug: profesor.slug,
      tokenPanel: await tokenDelPanel(profesor.id),
    }),
  );

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/profesores');
}

export async function rechazar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));
  const motivo =
    String(formulario.get('motivo') ?? '').trim() ||
    'La ficha no cumple los requisitos';

  const profesor = await db.profesores.update({
    where: { id },
    data: { estado: 'rechazado', motivo_rechazo: motivo },
    select: { nombre: true, email: true },
  });

  // Decirle por qué, y en sus palabras, no en las nuestras. Un rechazo mudo
  // deja a alguien esperando indefinidamente algo que no va a llegar.
  await enviar(
    correoFichaRechazada({
      para: profesor.email,
      nombreProfesor: profesor.nombre,
      motivo,
    }),
  );

  revalidatePath('/admin');
}

/** Retira del directorio una ficha ya publicada, sin borrarla. */
export async function retirar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  /*
   * Retirar es pausar, no devolver a la cola.
   *
   * Antes dejaba la ficha en `pendiente`, así que volvía a la lista de «por
   * revisar» y, al aprobarla de nuevo, se le mandaba otra vez el correo de «tu
   * ficha está publicada» a alguien que ya lo había recibido.
   *
   * Con `disponible = false` desaparece del directorio igual, pero sigue
   * aprobada: reactivarla es un botón y no genera ningún correo. Es además lo
   * mismo que hace el profesor cuando se pausa a sí mismo, así que hay un solo
   * mecanismo y no dos.
   */
  await db.profesores.update({
    where: { id },
    data: { disponible: false },
  });

  revalidatePath('/admin');
  revalidatePath('/');
}

/**
 * Borra una ficha para siempre, con todo lo que cuelga de ella.
 * Se usa sobre todo para limpiar pruebas.
 */
export async function borrar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  /*
   * Una ficha con contactos cobrados no se borra: se retira.
   *
   * Borrarla se lleva por delante sus solicitudes, y con ellas la página de
   * seguimiento de una familia que pagó y el único registro de que ese dinero
   * entró. Nadie va a acordarse de eso a las once de la noche revisando
   * fichas, así que lo impide el código y no la memoria.
   *
   * Retirar hace lo que se buscaba —desaparece del directorio— y no destruye
   * nada.
   */
  const cobrados = await db.contactos.count({
    where: { profesor_id: id, estado: { in: ['pagada', 'devuelta'] } },
  });

  if (cobrados > 0) {
    await db.profesores.update({
      where: { id },
      data: { estado: 'inactivo', disponible: false },
    });
  } else {
    await db.profesores.delete({ where: { id } });
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/profesores');
}
