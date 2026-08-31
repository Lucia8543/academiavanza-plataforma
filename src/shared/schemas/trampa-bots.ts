/**
 * Dos trampas para guiones automáticos, sin guardar nada de nadie.
 *
 * La alternativa habitual es contar altas por dirección IP, y se descartó a
 * propósito: una IP es un dato personal, hay que guardarla para poder contarla,
 * y en una plataforma que presume de pedir lo mínimo eso desentona. Además es
 * mal instrumento: una IP la comparte un colegio entero y cambia al salir de
 * casa.
 *
 * Estas dos no guardan nada, no molestan a nadie y paran lo que de verdad
 * ataca un formulario abierto: guiones que rellenan campos y envían.
 *
 * No paran a una persona decidida a hacer daño a mano. Nada lo hace sin pedir
 * un SMS o un captcha, y las dos cosas tienen un coste que aquí no compensa.
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
 * también lee esos nombres: «segundo apellido» es uno de los campos que el
 * autorrelleno de Chrome y los gestores de contraseñas reconocen y completan
 * sin preguntar, sobre todo en el móvil.
 *
 * Así que a quien tuviera el autorrelleno puesto se le llenaba el señuelo sin
 * verlo, y su alta se descartaba enseñándole «Ficha recibida». Ni fila, ni
 * correo, ni forma de enterarse. Sólo se descubrió porque varios profesores
 * avisaron de que no les llegaba nada.
 *
 * Ahora se llama algo que ningún autorrelleno del mundo reconoce, y se refuerza
 * en el componente con `autoComplete="off"` y un nombre que no case con ningún
 * campo estándar. **La regla es que el señuelo no puede parecerse a nada que
 * una persona tenga guardado en su navegador.**
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
 * Se queda corto a propósito: es preferible dejar pasar a un guion rápido que
 * rechazar a una persona con el navegador rellenando campos por ella.
 */
const SEGUNDOS_MINIMOS = 3;

export type Sospecha = 'trampa' | 'demasiado-rapido' | null;

/**
 * Hacen falta **las dos señales**, y este cambio nace de un fallo caro.
 *
 * Antes bastaba con el señuelo relleno para descartar el alta. Y el señuelo lo
 * rellenaba el autorrelleno del navegador, así que se descartaron fichas de
 * profesores reales enseñándoles «Ficha recibida»: sin fila, sin correo y sin
 * que ni ellos ni nosotros pudiéramos enterarnos.
 *
 * La lección no es sólo del nombre del campo. Es que **una trampa que descarta
 * en silencio tiene que estar muy segura antes de disparar**, porque su falso
 * positivo no se ve por ningún sitio: no hay error, no hay registro que mirar y
 * la persona se va convencida de que ya está apuntada.
 *
 * Así que ahora hacen falta las dos cosas a la vez: el señuelo relleno **y** un
 * envío imposiblemente rápido. Un guion cumple las dos sin despeinarse. Un
 * navegador con autorrelleno cumple la primera y tarda un minuto largo en la
 * segunda, porque detrás hay una persona escribiendo veinte campos.
 *
 * Se pierde algo de defensa y se gana no perder gente. Con el volumen que
 * tiene esta plataforma, veinte fichas basura son un minuto de trabajo; un
 * profesor que se cree apuntado y no lo está no se recupera.
 */
export function oler(formulario: {
  get(campo: string): FormDataEntryValue | null;
}): Sospecha {
  const senuelo = String(formulario.get(CAMPO_TRAMPA) ?? '').trim() !== '';

  const inicio = Number(String(formulario.get(CAMPO_INICIO) ?? ''));

  // Sin marca de tiempo no se rechaza nada: puede ser un navegador raro, o
  // alguien con JavaScript desactivado. Se prefiere colar a un guion antes que
  // perder a una persona.
  if (!Number.isFinite(inicio) || inicio <= 0) return null;

  const segundos = (Date.now() - inicio) / 1000;
  const relampago = segundos < SEGUNDOS_MINIMOS;

  if (senuelo && relampago) return 'trampa';
  if (relampago) return 'demasiado-rapido';

  // Señuelo relleno pero con tiempo humano detrás. Casi seguro autorrelleno,
  // así que pasa. Queda anotado en el registro por si algún día hay que mirar
  // cuántos son.
  if (senuelo) {
    console.warn('[trampa] señuelo relleno con tiempo humano: se deja pasar');
  }

  return null;
}
