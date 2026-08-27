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

export const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    // Sin decimales: son cifras redondas y «15 €» se lee mejor que «15,00 €».
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

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
