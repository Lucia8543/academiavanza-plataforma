import { z } from 'zod';

/**
 * Teléfonos españoles, escritos como los escribe la gente.
 *
 * Vive aparte porque lo usan los dos lados del trato: la familia al escribir a
 * un profesor y el profesor al darse de alta. Y porque la regla de qué es un
 * teléfono válido tiene que ser una sola: si un formulario acepta lo que el
 * otro rechaza, tarde o temprano hay dos personas que no se pueden llamar.
 */

/**
 * Quita espacios, guiones, puntos, paréntesis y el prefijo de España.
 *
 * Nadie teclea su número de la misma manera, y rechazar «+34 600 12 34 56» por
 * los espacios es una forma tonta de perder a alguien. Se limpia primero y se
 * comprueba después.
 */
export function normalizarTelefono(valor: string): string {
  return valor.replace(/[\s.\-()]/g, '').replace(/^(\+34|0034)/, '');
}

/** Nueve cifras empezando por 6, 7, 8 o 9: móviles y fijos españoles. */
export const telefonoEspanol = z
  .string()
  .trim()
  .transform(normalizarTelefono)
  .refine((v) => /^[6789]\d{8}$/.test(v), {
    message: 'Escribe un teléfono español de nueve cifras',
  });

/** Para enseñarlo: 600 123 456 se lee mejor que 600123456. */
export function formatearTelefono(valor: string): string {
  const limpio = normalizarTelefono(valor);
  if (!/^\d{9}$/.test(limpio)) return valor;
  return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}`;
}
