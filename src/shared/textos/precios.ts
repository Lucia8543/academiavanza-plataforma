/**
 * Cómo se habla de los precios de las clases.
 *
 * Hay dos importes distintos en esta web y **no se pueden confundir nunca**:
 *
 *   - Los 10 € del contacto, que se pagan a AcademiAvanza una sola vez.
 *   - Lo que cuesta cada hora de clase, que se paga al profesor y no pasa por
 *     aquí.
 *
 * El segundo es orientativo. La plataforma no lo cobra, no lo impone y no
 * interviene si acuerdan otro. Decir un número sin esa aclaración sería
 * fijar un precio que no nos corresponde fijar; no decir ninguno era peor,
 * porque la familia se enteraba en la llamada, después de haber pagado.
 */

/**
 * El único sitio donde se decide cómo se escribe un importe.
 *
 * Los céntimos se enseñan sólo si los hay. Casi todos los importes de esta web
 * son redondos —10, 15, 16, 17— y «10,00 €» en una frase corrida se lee como
 * una factura, no como un precio; pero el precio del contacto se configura
 * desde el panel y nada impide ponerlo a 9,50, así que redondear a secas
 * mentiría. Con esto, 10 sale «10 €» y 9,5 sale «9,50 €».
 *
 * Esta función estuvo aquí sola mucho tiempo mientras nueve pantallas se
 * escribían su propia copia sin la regla, así que la portada, el directorio,
 * las guías, el panel y los correos enseñaban «10,00 €». Si hace falta un
 * formato distinto en algún sitio, se añade aquí con su nombre; no se hace
 * otra copia. Hay una prueba que lo comprueba.
 */
export const euros = (n: number) => {
  const decimales = Number.isInteger(n) ? 0 : 2;

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n);
};

/** «16 €/h». */
export function porHora(precio: number): string {
  return `${euros(precio)}/h`;
}

/** La aclaración corta, para donde va pegada a un número. */
export const PRECIO_ES_ORIENTATIVO =
  'Precio de referencia. Podéis acordar otro entre vosotros.';

/** La aclaración larga, para donde hay sitio para explicarse. */
export const PRECIO_EXPLICACION =
  'Son los precios que se han venido cobrando, para que empecéis la ' +
  'conversación desde el mismo sitio. No los cobramos nosotros ni los ' +
  'imponemos: si tú y el profesor acordáis otra cosa, perfecto.';

// -----------------------------------------------------------------------------
// Agrupar los cursos por precio
// -----------------------------------------------------------------------------

/**
 * Once filas para decir tres cosas.
 *
 * La ficha enseñaba cada curso con su precio al lado, y como el precio es el
 * mismo dentro de cada etapa salían seis líneas seguidas poniendo «15 €/h». Se
 * lee como una tarifa complicada cuando en realidad es sencilla.
 *
 * Así que los cursos seguidos que cuestan lo mismo se juntan en una línea. La
 * palabra importante es **seguidos**: se comparan los números de orden del
 * catálogo, no la posición en la lista del profesor. Quien da 1.º y 4.º de
 * Primaria y nada más no da «de 1.º a 4.º», y juntarlos le pondría en la ficha
 * dos cursos que no ha dicho que dé.
 *
 * Los sin precio —universidad, donde inventarse un número sería justo eso— se
 * agrupan igual, con «A convenir» en vez de importe.
 */
export type NivelConPrecio = {
  id: string;
  nombre: string;
  orden: number;
  precio: number | null;
};

export type TramoDePrecio = {
  clave: string;
  etiqueta: string;
  precio: number | null;
};

/**
 * «1.º Primaria» + «6.º Primaria» → «1.º a 6.º Primaria».
 *
 * Sólo si las dos puntas terminan con la misma palabra. Si no la comparten
 * —«4.º ESO» y «Preparación EVAU»— se escriben enteras, porque abreviar ahí
 * dejaría un rótulo que no significa nada.
 */
function rango(primero: string, ultimo: string): string {
  if (primero === ultimo) return primero;

  const dePrimero = primero.split(' ');
  const deUltimo = ultimo.split(' ');
  const etapa = dePrimero.slice(1).join(' ');

  if (etapa && etapa === deUltimo.slice(1).join(' ')) {
    return `${dePrimero[0]} a ${deUltimo[0]} ${etapa}`;
  }

  return `${primero} a ${ultimo}`;
}

/** Espera la lista ya ordenada por `orden`, que es como llega del catálogo. */
export function agruparPorPrecio(niveles: NivelConPrecio[]): TramoDePrecio[] {
  // Se acumulan los cursos de cada tramo y sólo al final se les pone etiqueta.
  // Sale más largo que ir formando el texto sobre la marcha, pero así lo que
  // se compara son siempre los niveles enteros.
  const tramos: NivelConPrecio[][] = [];

  for (const nivel of niveles) {
    const actual = tramos[tramos.length - 1];
    const anterior = actual?.[actual.length - 1];

    const continua =
      anterior !== undefined &&
      anterior.precio === nivel.precio &&
      anterior.orden + 1 === nivel.orden;

    if (continua && actual) actual.push(nivel);
    else tramos.push([nivel]);
  }

  return tramos.map((tramo) => {
    const primero = tramo[0];
    const ultimo = tramo[tramo.length - 1];

    return {
      clave: primero.id,
      etiqueta: rango(primero.nombre, ultimo.nombre),
      precio: primero.precio,
    };
  });
}
