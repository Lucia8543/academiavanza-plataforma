import type { Prisma } from '@prisma/client';
import { db } from './cliente';

/**
 * Consultas sobre fichas de profesor para el panel de administración.
 *
 * A diferencia del directorio, aquí sí se lee el correo: hace falta para poder
 * escribir a quien se da de alta si algo de su ficha no cuadra.
 */

const FICHA_COMPLETA = {
  id: true,
  slug: true,
  nombre: true,
  apellidos: true,
  email: true,
  telefono: true,
  colegio_otro: true,
  titulacion: true,
  universidad: true,
  curso_actual: true,
  titulacion_finalizada: true,
  puntos_fuertes: true,
  modalidad: true,
  zona_otra: true,
  estado: true,
  disponible: true,
  motivo_rechazo: true,
  creado_en: true,
  colegios: { select: { nombre: true, nombre_corto: true, municipio: true } },
  profesor_asignaturas: { select: { asignaturas: { select: { nombre: true } } } },
  profesor_niveles: { select: { niveles: { select: { nombre: true } } } },
  profesor_certificaciones: {
    select: {
      certificaciones_idioma: {
        select: { idioma: true, nombre: true, nivel_mcer: true },
      },
    },
  },
  profesor_disponibilidad: {
    select: { dia_semana: true, hora_inicio: true },
    orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
  },
  // `satisfies` y no `as const`: comprueba el objeto contra el tipo de Prisma
  // sin convertirlo en sólo lectura, que es lo que hacía fallar la consulta.
} satisfies Prisma.profesoresSelect;

/**
 * Fichas que se han despublicado solas.
 *
 * Ocurre cuando dos familias distintas dicen que no han conseguido hablar con
 * ese profesor. Es lo correcto —cada familia que le escriba a partir de ahí
 * pierde tiempo y dinero— pero deja a alguien fuera del directorio sin haberlo
 * pedido, y probablemente sin saberlo.
 *
 * Se le avisa por correo y por el móvil, pero ninguno de los dos está
 * garantizado: el correo puede caer en spam y el aviso al móvil sólo lo tiene
 * quien lo activó. Esta lista es la tercera red, la que se mira con los ojos.
 *
 * No es urgente ni hay que actuar cada día. Es para que, cuando el directorio
 * parezca más corto de lo que debería, se sepa por qué.
 */
export async function listarPausadasSolas() {
  return db.profesores.findMany({
    where: { pausada_auto_en: { not: null }, disponible: false },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      email: true,
      telefono: true,
      pausada_auto_en: true,
    },
    orderBy: { pausada_auto_en: 'desc' },
  });
}

/** Fichas esperando revisión. Las más antiguas primero: no se deja a nadie atrás. */
export async function listarPendientes() {
  return db.profesores.findMany({
    where: { estado: 'pendiente' },
    select: FICHA_COMPLETA,
    orderBy: { creado_en: 'asc' },
  });
}

/** El resto, para poder retirar una ficha ya publicada si hiciera falta. */
export async function listarRevisadas() {
  return db.profesores.findMany({
    where: { estado: { not: 'pendiente' } },
    select: FICHA_COMPLETA,
    orderBy: { creado_en: 'desc' },
  });
}

export type Ficha = Awaited<ReturnType<typeof listarPendientes>>[number];

