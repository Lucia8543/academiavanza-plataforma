import type { Franja } from '@/shared/schemas/profesor';

/**
 * La forma de una ficha tal y como la ve una familia.
 *
 * Este tipo existe para que el frontend no dependa de cómo estén hechas las
 * tablas. Lo que sale de la base de datos tiene la forma de la base de datos:
 * relaciones anidadas, fechas, columnas en español. Lo que llega a la pantalla
 * tiene esta otra, pensada para pintarse.
 *
 * El detalle importante no es de estilo, sino de seguridad: **aquí no hay
 * correo, ni apellidos completos, ni teléfono**. No se filtran al pintar; es que
 * el tipo no tiene sitio donde meterlos. Si un día alguien intenta enseñar el
 * correo de un profesor en el directorio, el error salta al compilar y no en
 * producción.
 */

export type Modalidad = 'online' | 'presencial' | 'ambas';

export type FranjaLibre = {
  /** 1 = lunes … 7 = domingo */
  dia: number;
  franja: Franja;
};

export type ProfesorPublico = {
  id: string;
  slug: string;
  /** Nombre de pila y la inicial del primer apellido: «Lucía O.» */
  nombrePublico: string;
  /** Nombre corto del colegio, o null si no está en el catálogo. */
  colegio: string | null;
  titulacion: string | null;
  universidad: string | null;
  cursoActual: number | null;
  titulacionFinalizada: boolean;
  puntosFuertes: string | null;
  modalidad: Modalidad;
  /** Zona donde da clase presencial. Null si sólo da online. */
  zona: string | null;
  asignaturas: string[];
  niveles: string[];
  /** Ya compuestos: «Inglés C1». */
  idiomas: string[];
  disponibilidad: FranjaLibre[];
};

export type Filtros = {
  asignatura?: string;
  nivel?: string;
  modalidad?: string;
  colegio?: string;
  idioma?: string;
};

export type OpcionesFiltro = {
  asignaturas: { id: string; nombre: string }[];
  niveles: { id: string; nombre: string }[];
  colegios: { id: string; nombre: string }[];
  idiomas: string[];
};
