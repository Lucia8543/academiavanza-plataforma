'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  actualizarOferta,
  cambiarCupo,
  cambiarDisponibilidad,
  confirmarDisponibilidad,
} from '@/backend/repositories/mi-ficha';
import { profesorDelPanel } from '@/backend/services/acceso-profesor';
import { darDeBaja } from '@/backend/services/baja-profesor';
import {
  detectarDatosSensibles,
  mensajeDeAvisoProfesor,
} from '@/shared/schemas/datos-sensibles';
import { interpretarFranja } from '@/shared/schemas/profesor';
import { normalizarTelefono, telefonoEspanol } from '@/shared/schemas/telefono';
import { esCupoOPausa } from '@/shared/reglas/cupo';

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
  if (!esCupoOPausa(cupo)) return;

  await cambiarCupo(id, cupo);
  revalidatePath('/mi-ficha', 'layout');
  revalidatePath('/profesores');
}

export type EstadoBaja = { error?: string };

/**
 * Darse de baja. No se puede deshacer, y por eso pide escribir una palabra.
 *
 * La confirmación no es por desconfianza: es el único freno que hay entre un
 * botón y un borrado sin vuelta atrás, en una página que se abre desde un
 * enlace de correo y que alguien puede pulsar sin querer desde el móvil.
 *
 * Al terminar se va a `/baja`, y no de vuelta al panel, porque el enlace del
 * panel ya no vale: recargarlo daría un 404 y parecería un error.
 */
export async function darseDeBaja(
  _previo: EstadoBaja,
  formulario: FormData,
): Promise<EstadoBaja> {
  const id = await profesor(formulario);
  if (!id) return { error: 'Este enlace ya no vale.' };

  const confirmacion = String(formulario.get('confirmacion') ?? '')
    .trim()
    .toUpperCase();

  if (confirmacion !== 'BAJA') {
    return { error: 'Escribe BAJA en el recuadro para confirmar.' };
  }

  const resultado = await darDeBaja(id);

  revalidatePath('/mi-ficha', 'layout');
  revalidatePath('/profesores');
  revalidatePath('/profesor', 'layout');

  redirect(`/baja?cerradas=${resultado.solicitudesCerradas}`);
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
  const notaDisponibilidad = String(
    formulario.get('notaDisponibilidad') ?? '',
  ).trim();
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

  if (notaDisponibilidad.length > 120) {
    return { error: 'La nota de horario no puede pasar de 120 caracteres.' };
  }

  /*
   * El mismo filtro que en el alta, porque ésta es la otra puerta a los mismos
   * campos. Aquí no pasa por `esquemaRegistroProfesor`: el panel valida a mano,
   * así que sin estas líneas bastaba con darse de alta limpio y editar después.
   *
   * La nota de horario entra en la lista por el mismo motivo que los puntos
   * fuertes: se publica. Y tiene un riesgo propio, porque invita a concretar
   * («llámame y lo vemos») justo donde el teléfono no puede aparecer.
   */
  for (const texto of [puntosFuertes, notaDisponibilidad]) {
    const sensible = detectarDatosSensibles(texto);
    if (sensible) {
      return { error: mensajeDeAvisoProfesor(sensible) };
    }
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
    notaDisponibilidad,
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
