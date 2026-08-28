/**
 * Lo que AcademiAvanza dice que NO ha comprobado.
 *
 * Está aquí, en un fichero propio y con nombre propio, porque es el texto que
 * sostiene la posición legal del servicio y no puede depender de que alguien se
 * acuerde de copiarlo en la pantalla siguiente. El `prd-00` §3.2 lo fija palabra
 * por palabra y añade una condición sobre dónde va: «un aviso permanente y
 * visible, **no escondido en el pie**».
 *
 * Una familia va a dejar a un desconocido a solas con su hijo. La diferencia
 * entre poner en contacto a dos personas y responder de la idoneidad de una de
 * ellas es exactamente lo que diga aquí, y dónde se lea. Por eso el aviso va
 * junto al colegio —que es lo que la familia está mirando cuando decide— y no al
 * final de la página.
 *
 * Si alguna vez hay que cambiar la redacción, se cambia también el `prd-00`: el
 * documento y la pantalla dicen lo mismo o no dice nada ninguno de los dos.
 */

/** El colegio lo declara el profesor y nadie llama al centro a confirmarlo. */
export const COLEGIO_DECLARADO =
  'El colegio que figura en el perfil lo declara el profesor. AcademiAvanza ' +
  'revisa que la declaración sea coherente, pero no la contrasta con el centro.';

/** Lo que no se comprueba, dicho sin rodeos. */
export const SIN_COMPROBAR_IDONEIDAD =
  'AcademiAvanza no comprueba antecedentes penales ni ninguna otra idoneidad ' +
  'más allá de los datos académicos declarados.';

/**
 * Las dos frases juntas, que es como las pide el prd-00.
 *
 * Se exporta el array además del texto seguido para poder pintarlas en dos
 * párrafos sin partir la cadena por la mitad en la pantalla.
 */
export const LO_QUE_NO_COMPROBAMOS = [
  COLEGIO_DECLARADO,
  SIN_COMPROBAR_IDONEIDAD,
] as const;

/**
 * El descargo general del servicio.
 *
 * Distinto del anterior: éste explica qué hace la plataforma, no qué deja de
 * comprobar. Se leen bien seguidos, pero no son lo mismo y por eso no se juntan.
 */
export const NO_INTERVENIMOS =
  'AcademiAvanza pone en contacto a familias y profesores y no interviene en ' +
  'nada más. El precio, los horarios y la forma de pago los acordáis ' +
  'directamente entre vosotros.';
