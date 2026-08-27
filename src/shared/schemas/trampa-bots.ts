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
 * Se llama `apellido2` y no `honeypot` a propósito: un nombre sospechoso es una
 * pista para quien esté mirando el código de la página.
 */
export const CAMPO_TRAMPA = 'apellido2';

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

export function oler(formulario: {
  get(campo: string): FormDataEntryValue | null;
}): Sospecha {
  const senuelo = String(formulario.get(CAMPO_TRAMPA) ?? '').trim();
  if (senuelo) return 'trampa';

  const inicio = Number(String(formulario.get(CAMPO_INICIO) ?? ''));

  // Sin marca de tiempo no se rechaza: puede ser un navegador raro, o alguien
  // con JavaScript desactivado. Se prefiere colar a un guion antes que perder a
  // una persona.
  if (!Number.isFinite(inicio) || inicio <= 0) return null;

  const segundos = (Date.now() - inicio) / 1000;
  return segundos < SEGUNDOS_MINIMOS ? 'demasiado-rapido' : null;
}
