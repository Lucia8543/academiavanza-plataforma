'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/backend/repositories/cliente';
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

  await db.profesores.update({
    where: { id },
    data: { estado: 'activo', aprobado_en: new Date(), motivo_rechazo: null },
  });

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function rechazar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));
  const motivo = String(formulario.get('motivo') ?? '').trim();

  await db.profesores.update({
    where: { id },
    data: {
      estado: 'rechazado',
      motivo_rechazo: motivo || 'La ficha no cumple los requisitos',
    },
  });

  revalidatePath('/admin');
}

/** Retira del directorio una ficha ya publicada, sin borrarla. */
export async function retirar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  await db.profesores.update({
    where: { id },
    data: { estado: 'pendiente', aprobado_en: null },
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

  await db.profesores.delete({ where: { id } });

  revalidatePath('/admin');
  revalidatePath('/');
}
