import { db } from './cliente';

/**
 * Lectura de los catálogos: colegios, asignaturas, niveles, zonas y
 * certificaciones de idiomas.
 *
 * Son datos que cambian muy poco, así que se leen enteros y se ordenan por el
 * campo `orden_visual`, que es el que decide cómo aparecen en los desplegables.
 */

/**
 * Entradas del catálogo que no son colegios de verdad, sino comodines que
 * venían del diseño anterior. En una lista alfabética aparecían entre los
 * centros reales, y «Otro centro» por la O no significa nada para quien busca
 * el suyo. Quien no encuentre el suyo lo escribe en el buscador.
 */
const NO_SON_COLEGIOS = ['otro', 'publico-otro'];

export async function listarColegios() {
  const colegios = await db.colegios.findMany({
    where: {
      activo: true,
      slug: { notIn: NO_SON_COLEGIOS },
      // Sólo Madrid: es donde están las familias, y el badge sólo tiene
      // sentido si alguien puede reconocer el colegio.
      provincia: 'Madrid',
    },
    select: {
      id: true,
      nombre: true,
      nombre_corto: true,
      municipio: true,
      destacado: true,
    },
  });

  // Orden alfabético por el nombre que se ve en la lista, no por el nombre
  // largo. Se ordena aquí y no en la base de datos porque `localeCompare` con
  // el idioma español coloca bien los acentos y la eñe: «Ángel» junto a «Ana»,
  // y no al final de todo como haría un orden por códigos de carácter.
  //
  // El Montpellier se queda arriba del todo: es el colegio de casi la mitad de
  // los profesores, así que obligar a buscarlo entre ochenta y uno más sería
  // hacer trabajar a la mayoría para ordenar la lista de la minoría.
  const etiqueta = (c: (typeof colegios)[number]) => c.nombre_corto ?? c.nombre;

  return colegios.sort((a, b) => {
    if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
    return etiqueta(a).localeCompare(etiqueta(b), 'es', {
      sensitivity: 'base',
    });
  });
}

export async function listarAsignaturas() {
  return db.asignaturas.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, categoria: true },
    orderBy: [{ orden_visual: 'asc' }, { nombre: 'asc' }],
  });
}

export async function listarNiveles() {
  return db.niveles.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, etapa: true },
    orderBy: { orden_visual: 'asc' },
  });
}

export async function listarCertificaciones() {
  return db.certificaciones_idioma.findMany({
    where: { activa: true },
    select: { id: true, idioma: true, nombre: true, nivel_mcer: true },
    orderBy: [{ orden_visual: 'asc' }, { nombre: 'asc' }],
  });
}

/** Todo de una vez, para no encadenar cinco consultas al pintar el formulario. */
export async function cargarCatalogos() {
  const [colegios, asignaturas, niveles, certificaciones] = await Promise.all([
    listarColegios(),
    listarAsignaturas(),
    listarNiveles(),
    listarCertificaciones(),
  ]);

  return { colegios, asignaturas, niveles, certificaciones };
}

export type Catalogos = Awaited<ReturnType<typeof cargarCatalogos>>;
