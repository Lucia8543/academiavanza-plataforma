import type { Prisma } from '@prisma/client';
import { FRANJAS, type Franja } from '@/shared/schemas/profesor';
import type {
  Filtros,
  Modalidad,
  OpcionesFiltro,
  ProfesorPublico,
} from '@/shared/types/directorio';
import { db } from './cliente';

/**
 * El directorio público.
 *
 * Aquí se decide qué ve una familia, y por eso este fichero es más estricto que
 * el del panel: **nunca selecciona el correo del profesor**. No es que se filtre
 * después al pintar la página; es que no sale de la base de datos. Un dato que
 * no se ha pedido no se puede escapar por descuido en una plantilla.
 *
 * Lo que devuelve no tiene forma de tabla, sino de ficha: el tipo
 * `ProfesorPublico` vive en `shared` y es lo único que conoce el frontend.
 */

const CAMPOS = {
  id: true,
  slug: true,
  nombre: true,
  apellidos: true,
  titulacion: true,
  universidad: true,
  curso_actual: true,
  titulacion_finalizada: true,
  puntos_fuertes: true,
  modalidad: true,
  zona_otra: true,
  colegios: { select: { nombre: true, nombre_corto: true } },
  zonas: { select: { nombre: true } },
  profesor_asignaturas: { select: { asignaturas: { select: { nombre: true } } } },
  profesor_niveles: { select: { niveles: { select: { nombre: true } } } },
  profesor_certificaciones: {
    select: {
      certificaciones_idioma: { select: { idioma: true, nivel_mcer: true } },
    },
  },
  profesor_disponibilidad: {
    select: { dia_semana: true, hora_inicio: true },
    orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
  },
  // `satisfies` y no `as const`. Los dos comprueban el objeto, pero `as const`
  // además lo congela, y una lista de sólo lectura no encaja donde Prisma
  // espera una normal. Al rechazar el `select` entero, Prisma deja de saber qué
  // columnas se han pedido y da por inexistentes todas las relaciones: un error
  // real y veinticuatro de propina.
} satisfies Prisma.profesoresSelect;

/**
 * Sólo se publica lo aprobado y disponible.
 *
 * `disponible` es la casilla que el propio profesor apaga cuando no puede coger
 * más alumnos. Una ficha visible de alguien que no va a contestar es peor que
 * una ficha menos.
 */
function condiciones(f: Filtros): Prisma.profesoresWhereInput {
  const donde: Prisma.profesoresWhereInput = {
    estado: 'activo',
    disponible: true,
  };

  if (f.asignatura) {
    donde.profesor_asignaturas = { some: { asignatura_id: f.asignatura } };
  }

  if (f.nivel) {
    donde.profesor_niveles = { some: { nivel_id: f.nivel } };
  }

  // Quien da clase de las dos formas encaja en cualquiera de los dos filtros:
  // buscar «presencial» y no ver a quien también la da presencial sería un
  // resultado falso.
  if (f.modalidad === 'online') donde.modalidad = { in: ['online', 'ambas'] };
  if (f.modalidad === 'presencial') {
    donde.modalidad = { in: ['presencial', 'ambas'] };
  }

  if (f.colegio) donde.colegio_id = f.colegio;

  if (f.idioma) {
    donde.profesor_certificaciones = {
      some: { certificaciones_idioma: { idioma: f.idioma } },
    };
  }

  return donde;
}

/** Nombre público: «Lucía O.». Es lo único que se publica de la identidad. */
export function nombrePublico(nombre: string, apellidos: string): string {
  const primero = apellidos.trim().split(/\s+/)[0] ?? '';
  const inicial = primero ? `${primero[0].toUpperCase()}.` : '';
  return `${nombre.trim()} ${inicial}`.trim();
}

/** De la hora guardada en la base de datos a la franja con la que se eligió. */
function franjaDeHora(hora: Date): Franja | null {
  const hhmm = hora.toISOString().slice(11, 16);
  const encontrada = (Object.keys(FRANJAS) as Franja[]).find(
    (f) => FRANJAS[f].inicio === hhmm,
  );
  return encontrada ?? null;
}

/**
 * Baraja la lista.
 *
 * El orden del directorio es aleatorio a propósito. Cualquier orden fijo
 * —alfabético, por antigüedad, por número de clases— reparte visibilidad, y
 * repartir visibilidad es tomar partido. Con el azar, dos familias que buscan lo
 * mismo el mismo día ven cosas distintas, y a la larga todo el mundo aparece
 * arriba parecido número de veces.
 *
 * Se baraja en cada visita. No hay paginación que se descoloque porque la lista
 * entera cabe en una página.
 */
function barajar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export async function buscarProfesores(
  filtros: Filtros,
): Promise<ProfesorPublico[]> {
  const fichas = await db.profesores.findMany({
    where: condiciones(filtros),
    select: CAMPOS,
  });

  return barajar(fichas).map((f) => ({
    id: f.id,
    slug: f.slug,
    nombrePublico: nombrePublico(f.nombre, f.apellidos),
    colegio: f.colegios?.nombre_corto ?? f.colegios?.nombre ?? null,
    titulacion: f.titulacion,
    universidad: f.universidad,
    cursoActual: f.curso_actual,
    titulacionFinalizada: f.titulacion_finalizada,
    puntosFuertes: f.puntos_fuertes,
    modalidad: f.modalidad as Modalidad,
    zona: f.zonas?.nombre ?? f.zona_otra ?? null,
    asignaturas: f.profesor_asignaturas.map((a) => a.asignaturas.nombre),
    niveles: f.profesor_niveles.map((n) => n.niveles.nombre),
    idiomas: f.profesor_certificaciones.map((c) =>
      `${c.certificaciones_idioma.idioma} ${c.certificaciones_idioma.nivel_mcer ?? ''}`.trim(),
    ),
    disponibilidad: f.profesor_disponibilidad.flatMap((d) => {
      const franja = franjaDeHora(d.hora_inicio);
      // Una franja rara —de un dato migrado, por ejemplo— se descarta en vez de
      // pintar una hora suelta que nadie sabría interpretar.
      return franja ? [{ dia: d.dia_semana, franja }] : [];
    }),
  }));
}

/**
 * Una ficha concreta, por su dirección.
 *
 * Devuelve null si no existe o no está publicada. Que una ficha retirada
 * responda igual que una que nunca existió es deliberado: por la dirección de
 * una página nadie debería poder deducir quién se dio de baja.
 */
export async function buscarPorSlug(
  slug: string,
): Promise<ProfesorPublico | null> {
  const f = await db.profesores.findFirst({
    where: { slug, estado: 'activo', disponible: true },
    select: CAMPOS,
  });

  if (!f) return null;

  return {
    id: f.id,
    slug: f.slug,
    nombrePublico: nombrePublico(f.nombre, f.apellidos),
    colegio: f.colegios?.nombre_corto ?? f.colegios?.nombre ?? null,
    titulacion: f.titulacion,
    universidad: f.universidad,
    cursoActual: f.curso_actual,
    titulacionFinalizada: f.titulacion_finalizada,
    puntosFuertes: f.puntos_fuertes,
    modalidad: f.modalidad as Modalidad,
    zona: f.zonas?.nombre ?? f.zona_otra ?? null,
    asignaturas: f.profesor_asignaturas.map((a) => a.asignaturas.nombre),
    niveles: f.profesor_niveles.map((n) => n.niveles.nombre),
    idiomas: f.profesor_certificaciones.map((c) =>
      `${c.certificaciones_idioma.idioma} ${c.certificaciones_idioma.nivel_mcer ?? ''}`.trim(),
    ),
    disponibilidad: f.profesor_disponibilidad.flatMap((d) => {
      const franja = franjaDeHora(d.hora_inicio);
      return franja ? [{ dia: d.dia_semana, franja }] : [];
    }),
  };
}

/**
 * Los cursos que da un profesor, con su identificador.
 *
 * Hace falta para el desplegable del formulario de contacto: la familia elige
 * el curso de su hijo entre los que ese profesor da, no entre los veinte del
 * catálogo.
 */
export async function nivelesDe(profesorId: string) {
  const filas = await db.profesor_niveles.findMany({
    where: { profesor_id: profesorId },
    select: { niveles: { select: { id: true, nombre: true, orden_visual: true } } },
  });

  return filas
    .map((f) => f.niveles)
    .sort((a, b) => a.orden_visual - b.orden_visual)
    .map((n) => ({ id: n.id, nombre: n.nombre }));
}

/**
 * Opciones de los filtros.
 *
 * Sólo se ofrecen las que devuelven a alguien. Un desplegable con ochenta y dos
 * colegios de los que setenta y nueve no tienen profesor es una colección de
 * callejones sin salida.
 */
export async function opcionesDeFiltro(): Promise<OpcionesFiltro> {
  const publicado = {
    some: { profesores: { estado: 'activo' as const, disponible: true } },
  };

  const [asignaturas, niveles, colegios, idiomas] = await Promise.all([
    db.asignaturas.findMany({
      where: { activa: true, profesor_asignaturas: publicado },
      select: { id: true, nombre: true },
      orderBy: [{ orden_visual: 'asc' }, { nombre: 'asc' }],
    }),
    db.niveles.findMany({
      where: { activo: true, profesor_niveles: publicado },
      select: { id: true, nombre: true },
      orderBy: { orden_visual: 'asc' },
    }),
    db.colegios.findMany({
      where: {
        activo: true,
        profesores: { some: { estado: 'activo', disponible: true } },
      },
      select: { id: true, nombre: true, nombre_corto: true },
    }),
    db.certificaciones_idioma.findMany({
      where: { activa: true, profesor_certificaciones: publicado },
      select: { idioma: true },
      distinct: ['idioma'],
      orderBy: { idioma: 'asc' },
    }),
  ]);

  return {
    asignaturas,
    niveles,
    colegios: colegios
      .map((c) => ({ id: c.id, nombre: c.nombre_corto ?? c.nombre }))
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
      ),
    idiomas: idiomas.map((c) => c.idioma),
  };
}

/** Cuántas fichas hay publicadas en total, sin filtrar. */
export async function contarPublicadas(): Promise<number> {
  return db.profesores.count({ where: { estado: 'activo', disponible: true } });
}
