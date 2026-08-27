'use server';

import { revalidatePath } from 'next/cache';
import {
  actualizarOferta,
  cambiarCupo,
  cambiarDisponibilidad,
  confirmarDisponibilidad,
} from '@/backend/repositories/mi-ficha';
import { profesorDelPanel } from '@/backend/services/acceso-profesor';
import { interpretarFranja } from '@/shared/schemas/profesor';
import { normalizarTelefono, telefonoEspanol } from '@/shared/schemas/telefono';

/**
 * Acciones del panel del profesor.
 *
 * Todas empiezan resolviendo el token. No hay sesión ni cookie: el enlace es la
 * llave, y se comprueba en cada acción. Si el token no vale, no pasa nada y
 * tampoco se dice por qué.
 */

async function profesor(formulario: FormData): Promise<string | null> {
  return profesorDelPanel(String(formulario.get('token') ?? ''));
}

export async function pausar(formulario: FormData) {
  const id = await profesor(formulario);
  if (!id) return;

  await cambiarDisponibilidad(id, false);
  revalidatePath('/mi-ficha', 'layout');
  revalidatePath('/profesores');
}

export async function reactivar(formulario: FormData) {
  const id = await profesor(formulario);
  if (!id) return;

  await cambiarDisponibilidad(id, true);
  revalidatePath('/mi-ficha', 'layout');
  revalidatePath('/profesores');
}

/** «Sigo disponible», el botón del recordatorio trimestral. */
export async function confirmar(formulario: FormData) {
  const id = await profesor(formulario);
  if (!id) return;

  await confirmarDisponibilidad(id);
  revalidatePath('/mi-ficha', 'layout');
  revalidatePath('/profesores');
}

/** Cuánto sitio le queda, desde su propia ficha. */
export async function apuntarCupo(formulario: FormData) {
  const id = await profesor(formulario);
  if (!id) return;

  const cupo = String(formulario.get('cupo') ?? '');
  if (cupo !== 'busca' && cupo !== 'justo' && cupo !== 'ninguno') return;

  await cambiarCupo(id, cupo);
  revalidatePath('/mi-ficha', 'layout');
  revalidatePath('/profesores');
}

export type EstadoEdicion = { ok?: boolean; error?: string };

export async function guardarCambios(
  _previo: EstadoEdicion,
  formulario: FormData,
): Promise<EstadoEdicion> {
  const id = await profesor(formulario);
  if (!id) return { error: 'Este enlace ya no vale.' };

  const asignaturas = formulario.getAll('asignaturas').map(String);
  const niveles = formulario.getAll('niveles').map(String);
  const puntosFuertes = String(formulario.get('puntosFuertes') ?? '').trim();
  const modalidad = String(formulario.get('modalidad') ?? 'online');
  const zona = String(formulario.get('zona') ?? '').trim();

  if (asignaturas.length === 0) {
    return { error: 'Marca al menos una asignatura.' };
  }
  if (niveles.length === 0) {
    return { error: 'Marca al menos un curso.' };
  }
  if (puntosFuertes.length < 10) {
    return { error: 'Escribe algo que te distinga, aunque sea una frase.' };
  }
  if (modalidad !== 'online' && !zona) {
    return { error: 'Si das clase presencial, dinos en qué zona.' };
  }

  const telefono = telefonoEspanol.safeParse(
    String(formulario.get('telefono') ?? ''),
  );
  if (!telefono.success) {
    return { error: 'Ese teléfono no parece válido.' };
  }

  const email = String(formulario.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { error: 'Ese correo no parece válido.' };
  }

  const disponibilidad = formulario
    .getAll('disponibilidad')
    .map(String)
    .map(interpretarFranja)
    .filter((f): f is NonNullable<typeof f> => f !== null);

  // Vacío significa «no lo digo», no cero. Cero es «empiezo ahora».
  const anosCrudo = String(formulario.get('anosExperiencia') ?? '').trim();
  const anos = anosCrudo === '' ? null : Number(anosCrudo);

  if (anos !== null && (!Number.isInteger(anos) || anos < 0 || anos > 50)) {
    return { error: 'Los años dando clase tienen que ser un número entre 0 y 50.' };
  }

  await actualizarOferta(id, {
    asignaturas,
    niveles,
    certificaciones: formulario.getAll('certificaciones').map(String),
    disponibilidad,
    puntosFuertes,
    anosExperiencia: anos,
    telefono: normalizarTelefono(telefono.data),
    email,
    modalidad: modalidad as 'online' | 'presencial' | 'ambas',
    zona,
    desplazamientoFlexible:
      formulario.get('desplazamientoFlexible') === 'on',
  });

  revalidatePath('/mi-ficha', 'layout');
  revalidatePath('/profesores');
  revalidatePath(`/profesor`, 'layout');

  return { ok: true };
}
