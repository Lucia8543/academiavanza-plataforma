/**
 * Las dos reglas del cobro que no pueden estar equivocadas.
 *
 * Están aquí, sueltas y sin base de datos, porque las dos han fallado ya y las
 * dos fallaron por lo mismo: la decisión estaba metida dentro de una consulta o
 * de un `if` en medio de otra cosa, donde nadie la lee y nadie la prueba.
 *
 * Lo que decide si se abre un teléfono o si se cobra a alguien tiene que poder
 * leerse en diez líneas y probarse sin levantar nada.
 */

/**
 * Qué precio se aplica, dadas la tarifa vigente y la última que hubo.
 *
 * Devuelve `null` cuando no hay ninguna de las dos, que es el caso en el que
 * quien llama debe fallar en vez de seguir.
 *
 * **Nunca devuelve cero por defecto**, y ése era el fallo. La versión anterior
 * lo hacía razonando que es mejor regalar un contacto que cobrar una cantidad
 * que nadie ha fijado. Leído solo, se sostiene. Pero un importe de cero es la
 * señal de «esto ya está pagado» —así funcionan los vales— y por tanto abría
 * los teléfonos de las dos partes sin que nadie pagara. Bastaba con cerrar una
 * tarifa desde el panel y no abrir la siguiente.
 *
 * Una tarifa caducada es peor que una vigente y mejor que nada: es un precio
 * que puso una persona.
 */
export function precioAplicable(
  vigente: number | null,
  ultima: number | null,
): number | null {
  if (vigente !== null && vigente > 0) return vigente;
  if (ultima !== null && ultima > 0) return ultima;
  return null;
}

/**
 * ¿Este contacto se abre solo al aceptar el profesor, sin Bizum de por medio?
 *
 * Sólo si viene de un vale. Nadie hace un Bizum de cero euros, así que un
 * contacto pagado con vale tiene que abrirse solo o el vale dejaría de servir
 * para lo que existe: no depender de nadie.
 *
 * **Se pregunta por el vale, no por el importe.** Preguntar por el importe era
 * lo mismo el 99 % de las veces y catastrófico el 1 % restante: cualquier cosa
 * que dejara el precio a cero convertía todas las solicitudes en contactos
 * gratis que se abrían solos.
 */
export function seAbreSinPagar(solicitud: { valeDe: string | null }): boolean {
  return solicitud.valeDe !== null;
}

/**
 * Los tres plazos que cierran una solicitud aceptada y sin pagar.
 *
 * Se declaran juntos porque su relación es la regla: el plazo de quien dice
 * haber pagado tiene que ser **el más largo de los tres**. Si alguien lo acorta
 * por debajo de los otros, se le estaría cerrando la puerta antes a quien sí ha
 * puesto dinero que a quien no ha hecho nada.
 */
export const PLAZOS_DE_CIERRE = {
  /** Días tras el recordatorio de pago. El camino normal. */
  trasRecordatorio: 5,
  /** Días desde que el profesor aceptó. La red para cuando el correo falla. */
  desdeAceptada: 14,
  /**
   * Días desde que la familia dijo que había hecho el Bizum.
   *
   * El más largo, porque es el único caso donde puede haber dinero de verdad
   * esperando a que alguien lo mire. Pero no infinito, que es lo que era: el
   * botón no comprueba nada, así que sin plazo cualquiera podía dejar una
   * solicitud viva para siempre pulsándolo sin pagar.
   */
  desdeAvisoDePago: 30,
} as const;
