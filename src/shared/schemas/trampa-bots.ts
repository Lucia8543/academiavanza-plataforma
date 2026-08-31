/**
 * Dos señales que hacen sospechar de un envío, sin guardar nada de nadie.
 *
 * La alternativa habitual es contar envíos por dirección IP, y se descartó a
 * propósito. Una IP es un dato personal, hay que guardarla para poder contarla,
 * y en una plataforma que presume de pedir lo mínimo eso desentona. Además es
 * mal instrumento, porque una IP la comparte un colegio entero y cambia al
 * salir de casa.
 *
 * Estas dos no guardan nada y detectan lo que de verdad ataca un formulario
 * abierto, que son guiones automáticos rellenando campos y enviando. No paran a
 * una persona decidida a hacer daño a mano. Nada lo hace sin pedir un SMS o un
 * captcha, y las dos cosas tienen un coste que aquí no compensa.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **ESTO NO DECIDE NADA. SÓLO ETIQUETA.**
 *
 * Es el cambio más importante de este fichero y conviene que quede escrito
 * donde no se pueda no leer. Durante meses, lo que aquí se marcaba como
 * sospechoso se tiraba a la basura, y a quien lo había enviado se le contestaba
 * «recibido». Sin fila, sin correo, sin registro y sin forma de enterarse.
 *
 * Costó fichas de profesoras reales, y no por un descuido tonto sino por un
 * fallo de diseño: **una decisión automática, irreversible e invisible sobre
 * algo que no se puede recuperar**. Cualquier detector se equivoca alguna vez.
 * Lo que no puede pasar es que su equivocación no la vea nadie.
 *
 * Ahora esta función devuelve una etiqueta, se guarda junto al envío y sale en
 * el panel. Lo que se hace con ella lo decide una persona. Si algún día alguien
 * vuelve a usar el valor de aquí como condición para no guardar algo, estará
 * repitiendo el mismo error, y hay una prueba en `tests/unit/` que lo impide.
 */

/**
 * El campo señuelo.
 *
 * Es un campo de texto real, invisible para quien mira la página y saltado por
 * el tabulador, pero presente en el HTML. Una persona nunca lo rellena porque
 * no lo ve. Un guion que rellena todo lo que encuentra, sí.
 *
 * **Se llamaba `apellido2`, y ese nombre costó fichas de verdad.**
 *
 * La idea era despistar a quien mirara el código de la página, porque un campo
 * llamado `honeypot` se salta solo. Lo que no se pensó es que el navegador
 * también lee esos nombres. «Segundo apellido» es uno de los campos que el
 * autorrelleno de Chrome y los gestores de contraseñas reconocen y completan
 * sin preguntar, sobre todo en el móvil.
 *
 * Así que a quien tuviera el autorrelleno puesto se le llenaba el señuelo sin
 * verlo. Ahora se llama algo que ningún autorrelleno reconoce, y se refuerza en
 * el componente con `autoComplete="new-password"`. **La regla es que el señuelo
 * no puede parecerse a nada que una persona tenga guardado en su navegador.**
 */
export const CAMPO_TRAMPA = 'confirmacion_zx';

/** Campo oculto con el momento en que se pintó el formulario. */
export const CAMPO_INICIO = 'iniciado';

/**
 * Segundos mínimos para rellenar un formulario.
 *
 * Nadie escribe su nombre, su teléfono, su correo y elige un curso en menos de
 * tres segundos. Un guion tarda cincuenta milisegundos.
 *
 * Se queda corto a propósito. Ahora que marcar no cuesta nada, la tentación es
 * subirlo para cazar más; no se hace, porque cada persona real marcada por
 * error es alguien de quien se va a desconfiar sin motivo al revisar su ficha.
 */
const SEGUNDOS_MINIMOS = 3;

/**
 * Lo que puede decir el detector.
 *
 * - `trampa` · el señuelo relleno **y** un envío instantáneo. Las dos a la vez
 *   no las produce ningún navegador: es un guion automático.
 * - `demasiado-rapido` · sólo la velocidad. Sospechoso, pero cabe que sea una
 *   pestaña que estuvo abierta con el reloj del ordenador descuadrado.
 * - `null` · nada raro, que es el caso de casi todo el mundo.
 *
 * Estos dos textos son también los dos únicos valores que acepta la base de
 * datos en la columna `sospecha_bot`. Si aquí apareciera un tercero sin pasar
 * por una migración, la fila se rechazaría al guardarla.
 */
export type Sospecha = 'trampa' | 'demasiado-rapido' | null;

/**
 * Mira un formulario y dice si tiene algo raro. **No rechaza nada.**
 *
 * El nombre lleva «etiqueta» a propósito, y antes se llamaba `oler`. Un verbo
 * como aquel invita a escribir `if (oler(x)) return`, que es exactamente la
 * línea que costó las fichas. Lo que esta función devuelve es un dato que se
 * guarda junto al envío, igual que el teléfono o el curso.
 *
 * El señuelo relleno **por sí solo no marca nada**. Casi siempre es el
 * autorrelleno de un navegador, o sea una persona real, y marcarla haría
 * desconfiar de ella al revisar su ficha. Queda anotado en el registro por si
 * algún día hay que contar cuántos son.
 */
export function etiquetaDeSospecha(formulario: {
  get(campo: string): FormDataEntryValue | null;
}): Sospecha {
  const senuelo = String(formulario.get(CAMPO_TRAMPA) ?? '').trim() !== '';

  const inicio = Number(String(formulario.get(CAMPO_INICIO) ?? ''));

  // Sin marca de tiempo no se marca nada. Puede ser un navegador raro, o
  // alguien con JavaScript desactivado, y una etiqueta puesta a ciegas sobre
  // gente real vale menos que ninguna.
  if (!Number.isFinite(inicio) || inicio <= 0) return null;

  const segundos = (Date.now() - inicio) / 1000;
  const relampago = segundos < SEGUNDOS_MINIMOS;

  if (senuelo && relampago) return 'trampa';
  if (relampago) return 'demasiado-rapido';

  if (senuelo) {
    console.warn(
      '[trampa] señuelo relleno con tiempo humano: casi seguro autorrelleno, ' +
        'no se marca',
    );
  }

  return null;
}

/**
 * Comprueba y **estrecha el tipo** a la vez.
 *
 * Lo que sale de la base de datos es un texto cualquiera, aunque la columna
 * tenga una restricción que sólo admite dos valores. Sin esta comprobación,
 * buscar la explicación de una etiqueta desconocida devolvería `undefined` y la
 * pantalla del panel reventaría entera por una fila rara, que es un precio
 * absurdo por un aviso informativo.
 */
export function esSospechaConocida(
  valor: string | null | undefined,
): valor is Exclude<Sospecha, null> {
  return valor === 'trampa' || valor === 'demasiado-rapido';
}

/** Lo que se le enseña a quien revisa, en el panel. */
export const EXPLICACION_SOSPECHA: Record<
  Exclude<Sospecha, null>,
  { titulo: string; texto: string }
> = {
  trampa: {
    titulo: 'Puede ser un envío automático',
    texto:
      'Se rellenó un campo que sólo está en el código y no se ve en la ' +
      'pantalla, y además se envió en menos de tres segundos. Las dos cosas a ' +
      'la vez no las hace un navegador. Míralo antes de publicarlo.',
  },
  'demasiado-rapido': {
    titulo: 'Se envió muy deprisa',
    texto:
      'Llegó en menos de tres segundos desde que se abrió el formulario. ' +
      'Suele ser un envío automático, aunque también pasa si el reloj del ' +
      'ordenador va descuadrado. Si el resto de la ficha tiene sentido, lo es.',
  },
};
