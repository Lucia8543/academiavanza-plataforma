import { db } from './cliente';

/**
 * Consultas sobre fichas de profesor para el panel de administración.
 */

const FICHA_COMPLETA = {
  id: true,
  slug: true,
  nombre: true,
  apellidos: true,
  email: true,
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
    orderBy: [{ dia_semana: 'asc' as const }, { hora_inicio: 'asc' as const }],
  },
} as const;

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

export async function contarPendientes() {
  return db.profesores.count({ where: { estado: 'pendiente' } });
}
