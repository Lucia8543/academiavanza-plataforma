/**
 * Cuánto hueco le queda a un profesor, y qué implica cada respuesta.
 *
 * Eran dos estados y ahora son tres, porque los dos primeros no cubrían el caso
 * más común al arrancar el curso: profesores que ya tenían todos sus alumnos
 * asignados del año anterior. «Voy justo» no es lo mismo que «no me cabe nadie
 * más», y meterlos en el mismo cajón tenía consecuencias en las dos
 * direcciones. O no se registraban —«¿para qué, si estoy lleno?»— y el
 * directorio enseñaba media academia; o se registraban como que iban justos y
 * les llegaban familias que **pagaban diez euros** por un contacto que no podía
 * dar clase.
 *
 * Los tres, y lo que significan de verdad:
 *
 * - `busca` · tiene hueco. Sale primero y se le puede escribir.
 * - `justo` · le queda poco. Sale después, con aviso, y se le puede escribir:
 *   la familia decide sabiendo que puede tardar o decir que no.
 * - `completo` · no le cabe nadie. **Sale, pero no se le puede escribir.**
 *
 * Ese último punto es la decisión importante y merece explicarse. La ficha
 * sigue publicada porque una academia con cuarenta profesores tiene que verse
 * con cuarenta profesores, y porque quien está lleno hoy tiene hueco en enero.
 * Pero el formulario de contacto se apaga: cobrarle a una familia por escribir
 * a alguien que ya ha dicho que no puede cogerla sería vender algo que sabemos
 * que no existe. La familia lo ve, entiende que la academia se mueve, y escribe
 * a otro.
 *
 * Este fichero no importa nada a propósito, igual que `cobro.ts`. Lo lee la
 * base de datos, el directorio, el panel y los dos formularios, y si importara
 * algo acabaría dando vueltas.
 */

export type Cupo = 'busca' | 'justo' | 'completo';

export const CUPOS: readonly Cupo[] = ['busca', 'justo', 'completo'];

/**
 * Lo que llega de un formulario o de la base de datos no es de fiar: puede ser
 * un valor viejo, una cadena vacía o algo enviado a mano. Todo lo que no sea
 * uno de los tres cuenta como `busca`, que es el estado por defecto y el menos
 * dañino: como mucho, alguien recibe una solicitud de más.
 */
export function normalizarCupo(valor: unknown): Cupo {
  return CUPOS.includes(valor as Cupo) ? (valor as Cupo) : 'busca';
}

/**
 * Si se le puede escribir.
 *
 * Es la única función que decide si el formulario de contacto aparece. Está
 * aquí y no repartida por las páginas para que no haya dos sitios que puedan
 * contestar cosas distintas.
 */
export function aceptaSolicitudes(cupo: Cupo): boolean {
  return cupo !== 'completo';
}

/**
 * En qué orden salen en el directorio.
 *
 * No premia a nadie por mérito ni por antigüedad: dentro de cada grupo el orden
 * sigue siendo aleatorio. Lo único que se antepone es poder coger al alumno,
 * que es lo que quieren las dos partes.
 */
export const ORDEN_CUPO: Record<Cupo, number> = {
  busca: 0,
  justo: 1,
  completo: 2,
};

/** La etiqueta de la tarjeta. `busca` no lleva ninguna: es lo normal. */
export const ETIQUETA_CUPO: Record<Cupo, string | null> = {
  busca: null,
  justo: 'Ya tiene alumnos, va justo',
  completo: 'Sin hueco por ahora',
};

/**
 * Lo que se le explica a la familia en la ficha del profesor.
 *
 * El de `completo` dice **por qué** no puede escribirle y qué hacer en su
 * lugar. Un formulario que desaparece sin explicación se lee como un fallo de
 * la web, y quien lo lee así se va.
 */
export const AVISO_CUPO: Record<Cupo, string | null> = {
  busca: null,
  justo:
    'Nos ha dicho que ya tiene alumnos y va justo de tiempo, así que puede ' +
    'tardar más en contestar o decir que no. No es desinterés, es que tiene ' +
    'la agenda casi llena. Si tienes prisa, escribe también a algún otro.',
  completo:
    'Ahora mismo no puede coger a nadie más, porque nos ha dicho que tiene la ' +
    'agenda llena. Por eso no te dejamos escribirle, para que no ' +
    'pagues por un contacto que no iba a salir adelante. Su ficha sigue aquí ' +
    'porque puede volver a tener hueco más adelante.',
};

/** Lo que ve el profesor al elegir, en su alta y en su panel. */
export const OPCIONES_CUPO: {
  valor: Cupo;
  titulo: string;
  texto: string;
}[] = [
  {
    valor: 'busca',
    titulo: 'Sí, busco alumnos',
    texto: 'Sales delante en el directorio y te pueden escribir familias.',
  },
  {
    valor: 'justo',
    titulo: 'Me queda poco hueco',
    texto:
      'Sales detrás de quien está buscando, con un aviso de que ya tienes ' +
      'alumnos. Te pueden escribir, pero la familia sabe que puedes decir que no.',
  },
  {
    valor: 'completo',
    titulo: 'No tengo más hueco por ahora',
    texto:
      'Tu ficha se publica igual y se te ve, pero nadie puede escribirte hasta ' +
      'que digas lo contrario. Es lo que hay que marcar si ya tienes todos tus ' +
      'alumnos.',
  },
];

/**
 * Lo que puede contestar un profesor cuando se le pregunta por su hueco.
 *
 * Incluye `ninguno`, que no es un estado de hueco sino pausar la ficha entera.
 * Va junto porque en la pantalla son cuatro botones seguidos y quien los pulsa
 * no distingue entre «no me cabe nadie» y «quitadme de ahí»: los dos son la
 * misma pregunta contestada con distinta intensidad.
 */
export type CupoOPausa = Cupo | 'ninguno';

/**
 * Comprueba y **estrecha el tipo** a la vez.
 *
 * El `is` de la firma es lo importante y no es adorno: sin él, TypeScript sigue
 * viendo una cadena cualquiera después del `if`, y la única salida sería un
 * `as` que apaga la comprobación justo donde hace falta. Con esto, lo que pasa
 * el filtro está garantizado y lo que no, no compila.
 */
export function esCupoOPausa(valor: string): valor is CupoOPausa {
  return valor === 'ninguno' || CUPOS.includes(valor as Cupo);
}
