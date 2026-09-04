import { DIAS } from '@/shared/schemas/profesor';

/**
 * Cómo se dicen las horas y los días que pide una familia.
 *
 * Este dato aparece en cinco sitios: el formulario donde se elige, el correo
 * que recibe el profesor, la pantalla donde acepta, su panel y el de cobros.
 * Escribir «Más de 3 horas» a mano en cada uno es la forma más rápida de que
 * dentro de un año digan cinco cosas parecidas pero distintas, y de que
 * cambiar una opción obligue a buscarla por todo el proyecto.
 *
 * Los valores guardados son los que valida la restricción CHECK de la
 * migración 27. Si se añade uno aquí, hay que añadirlo también allí y en el
 * enum del esquema: son las tres barreras del mismo dato y ninguna sobra.
 */

export const HORAS_SEMANA = [
  { valor: '1', etiqueta: '1 hora' },
  { valor: '2', etiqueta: '2 horas' },
  { valor: '3', etiqueta: '3 horas' },
  { valor: '4', etiqueta: '4 horas' },
  /*
   * Aquí se corta la lista, y el tope es «5 o más» y no «más de 3».
   *
   * Lo de antes tapaba lo mismo tres horas y media que ocho, y esa es justo la
   * diferencia que decide si a un profesor con la tarde medio llena le cabe. Lo
   * destapó una familia con dos hijos: tres horas para una y dos para el otro.
   *
   * Y se corta en cinco a propósito. Lo que tiene que hacer esta lista es que
   * el profesor sepa **de qué tamaño es el encargo** antes de contestar, no
   * cuadrarle la semana. Que si son seis o siete, y si una clase es de hora y
   * media, se habla por teléfono: eso no cabe en ningún desplegable y cada
   * opción de más es una madre leyendo siete líneas en el móvil.
   */
  { valor: '5-o-mas', etiqueta: '5 horas o más' },
  /*
   * «Todavía no lo sé» es una opción de verdad, no un hueco.
   *
   * Una familia que escribe en septiembre a menudo no lo sabe, porque depende
   * de cómo arranque el curso. Sin esta opción se inventaría un número, y el
   * profesor decidiría sobre algo falso. Diciéndolo, sabe que eso está por
   * hablar y lo pregunta en la primera llamada.
   */
  { valor: 'no-lo-se', etiqueta: 'Todavía no lo sé' },
] as const;

export type HorasSemana = (typeof HORAS_SEMANA)[number]['valor'];

/**
 * Valores que ya no se ofrecen pero siguen guardados en filas antiguas.
 *
 * `mas-de-3` fue el tope hasta la migración 28. Las solicitudes de entonces
 * siguen en la tabla, y sus profesores siguen abriendo su panel. Si esto no
 * estuviera, `horasEnPalabras` devolvería cadena vacía para esas filas y el
 * dato desaparecería de la pantalla sin que nadie viera un error: el fallo
 * silencioso de siempre, ahora por retirar una opción de una lista.
 */
const HORAS_HISTORICAS: Record<string, string> = {
  'mas-de-3': 'Más de 3 horas',
};

/**
 * La etiqueta de un valor guardado, o cadena vacía si no hay nada que decir.
 *
 * Devuelve vacío y no un guión: quien llama decide si pinta la línea o la
 * omite, y en un correo una línea que pone «Horas por semana: —» ocupa lo
 * mismo que una que informa y no informa de nada.
 */
export function horasEnPalabras(valor: string | null | undefined): string {
  if (!valor) return '';
  return (
    HORAS_SEMANA.find((h) => h.valor === valor)?.etiqueta ??
    HORAS_HISTORICAS[valor] ??
    ''
  );
}

/**
 * «Lunes, miércoles y viernes» a partir de [1, 3, 5].
 *
 * Con la conjunción al final y en minúsculas, porque va dentro de una frase.
 * Los siete días seguidos se dicen «cualquier día»: enumerarlos entero ocupa
 * dos líneas para decir que da igual.
 */
export function diasEnPalabras(dias: readonly number[] | null | undefined): string {
  if (!dias || dias.length === 0) return '';
  if (dias.length === 7) return 'Cualquier día';

  /*
   * El `: string | undefined` del `map` no es adorno.
   *
   * `DIAS` es `as const`, así que `etiqueta` no es una cadena cualquiera sino la
   * unión de los siete nombres. Sin ensanchar ahí, el `filter` de debajo intenta
   * afirmar que algo de ese tipo estrecho «es string» y TypeScript lo rechaza,
   * porque un predicado sólo puede estrechar y esto ensancha.
   */
  const nombres = [...dias]
    .sort((a, b) => a - b)
    .map((n): string | undefined => DIAS.find((d) => d.numero === n)?.etiqueta)
    .filter((n): n is string => n !== undefined);

  // Con `at()` y no con `nombres[i]`: el proyecto tiene activado que acceder por
  // índice devuelva también `undefined`, y así se comprueba una vez en vez de
  // tener que convencer al compilador en cada línea.
  const primero = nombres.at(0);
  const ultimo = nombres.at(-1);
  if (primero === undefined || ultimo === undefined) return '';
  if (nombres.length === 1) return primero;

  /*
   * Todos en minúscula menos el primero.
   *
   * La versión anterior sólo bajaba el último y dejaba los de en medio como
   * venían, así que tres días salían «Lunes, Miércoles y viernes». Se coló
   * porque con dos días —el caso que se mira siempre al probar a ojo— no hay
   * ninguno en medio y la frase parecía correcta.
   */
  const medio = nombres.slice(1, -1).map((n) => n.toLowerCase());
  const antes = [primero, ...medio].join(', ');

  return `${antes} y ${ultimo.toLowerCase()}`;
}
