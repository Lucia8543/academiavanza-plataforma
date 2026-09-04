/**
 * Cuántos alumnos trae una solicitud, y cómo se dice.
 *
 * Vive aquí y no dentro del formulario porque lo mismo aparece en cinco sitios:
 * la pregunta que elige la madre, el correo del profesor, la pantalla donde
 * acepta, su panel y el de cobros. Escrito a mano en cada uno, dentro de un año
 * dicen cinco cosas parecidas y distintas.
 */

/**
 * El tope, y es una decisión de producto, no un límite técnico.
 *
 * Tres. Cada hermano añade dos preguntas al formulario, y un formulario que
 * crece mientras se rellena en el móvil es gente que lo abandona. Una familia
 * con cuatro hijos lo cuenta en el texto libre y lo hablan por teléfono, que es
 * lo que iba a pasar de todas formas.
 */
export const MAXIMO_HERMANOS = 3;

export const CUANTOS_ALUMNOS = [
  { valor: 1, etiqueta: 'Para un alumno' },
  { valor: 2, etiqueta: 'Para dos hermanos' },
  { valor: 3, etiqueta: 'Para tres hermanos' },
] as const;

/**
 * Lo que se le dice a la familia en cuanto marca que son hermanos.
 *
 * Es la frase que faltaba el día que esto se rompió. La madre no sabía que el
 * contacto se paga una vez por profesor y no una vez por hijo, y como nadie se
 * lo decía, escribió a varios por si acaso.
 *
 * Se dice en el formulario y no sólo en la ayuda, porque el momento en que
 * alguien decide a cuántos profesores escribe es éste.
 */
export const UN_CONTACTO_AUNQUE_SEAN_VARIOS =
  'Aunque sean varios, el contacto se paga una sola vez: lo que se paga es ' +
  'poder hablar con este profesor. Se lo cuentas cuando habléis.';

/**
 * «Dos hermanos», «Tres hermanos», o nada si es uno solo.
 *
 * Devuelve cadena vacía para un alumno a propósito, no «Un alumno». Quien lee
 * esto es el profesor, y en el caso normal —que es el de siempre— una línea
 * diciendo que hay un alumno no le informa de nada y le hace leer más.
 */
export function cuantosEnPalabras(cuantos: number): string {
  if (cuantos === 2) return 'Dos hermanos';
  if (cuantos >= 3) return 'Tres hermanos';
  return '';
}
