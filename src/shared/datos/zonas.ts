/**
 * Dónde vive la familia, para que el profesor pueda decidir.
 *
 * Antes no se preguntaba, y el profesor aceptaba a ciegas. Aceptar es lo que
 * dispara que la familia pague, así que descubrir después que viven a una hora
 * significaba diez euros cobrados por un contacto que no iba a ninguna parte,
 * un vale que devolver y dos personas descontentas. La distancia es lo segundo
 * que pregunta cualquiera que da clase a domicilio, justo detrás del curso.
 *
 * **Es una lista cerrada y no un campo de texto**, y esa es la decisión
 * importante. En un hueco libre la gente escribe su dirección: es lo natural
 * cuando te preguntan dónde vives. Y una calle con número, guardada al lado del
 * curso de una menor, es un dato que no necesitamos para nada y que no
 * queremos tener. Con «Chamberí» el profesor decide igual de bien.
 *
 * Por eso tampoco hay opción de escribir «otra zona» a mano: el hueco libre
 * volvería por la puerta de atrás. Quien no se vea en la lista elige el último
 * apartado, que cubre el resto de la Comunidad.
 *
 * Se guarda el texto tal cual, no un código. Lucía consulta la base de datos
 * con su propio usuario, y `Chamberí` se entiende sin traducir; un `zona_id`
 * apuntando a otra tabla, no. Es el mismo criterio del
 * [ADR 0003](../../../docs/adr/0003-esquema-base-datos-en-espanol.md).
 */

/** Los 21 distritos de Madrid capital, en el orden oficial del Ayuntamiento. */
const DISTRITOS = [
  'Centro',
  'Arganzuela',
  'Retiro',
  'Salamanca',
  'Chamartín',
  'Tetuán',
  'Chamberí',
  'Fuencarral-El Pardo',
  'Moncloa-Aravaca',
  'Latina',
  'Carabanchel',
  'Usera',
  'Puente de Vallecas',
  'Moratalaz',
  'Ciudad Lineal',
  'Hortaleza',
  'Villaverde',
  'Villa de Vallecas',
  'Vicálvaro',
  'San Blas-Canillejas',
  'Barajas',
] as const;

/**
 * Municipios del área metropolitana, por orden alfabético.
 *
 * No están los 179 de la Comunidad: están aquellos desde los que alguien se
 * plantearía ir a dar una clase de una hora. Una lista de 179 no se lee, se
 * abandona. El resto entra por «Otro municipio de Madrid».
 */
const MUNICIPIOS = [
  'Alcalá de Henares',
  'Alcobendas',
  'Alcorcón',
  'Boadilla del Monte',
  'Collado Villalba',
  'Coslada',
  'Fuenlabrada',
  'Getafe',
  'Las Rozas',
  'Leganés',
  'Majadahonda',
  'Móstoles',
  'Parla',
  'Pinto',
  'Pozuelo de Alarcón',
  'Rivas-Vaciamadrid',
  'San Fernando de Henares',
  'San Sebastián de los Reyes',
  'Torrejón de Ardoz',
  'Tres Cantos',
  'Villanueva de la Cañada',
  'Villaviciosa de Odón',
] as const;

/** La salida para quien no está en ninguna de las dos listas. */
export const OTRA_ZONA = 'Otro municipio de Madrid';

/**
 * Cómo se pinta el desplegable: en dos grupos, porque una lista corrida de
 * cuarenta y tres entradas mezclando distritos y municipios no se recorre.
 */
export const GRUPOS_DE_ZONAS = [
  { titulo: 'Madrid capital', zonas: DISTRITOS },
  { titulo: 'Otros municipios', zonas: [...MUNICIPIOS, OTRA_ZONA] },
] as const;

/** Todo lo que se acepta como zona, para validar en el servidor. */
export const ZONAS: readonly string[] = [
  ...DISTRITOS,
  ...MUNICIPIOS,
  OTRA_ZONA,
];

/** Si el valor recibido es una de las zonas de la lista. */
export function esZonaValida(valor: string): boolean {
  return ZONAS.includes(valor);
}
