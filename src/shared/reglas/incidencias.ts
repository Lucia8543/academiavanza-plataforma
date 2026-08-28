/**
 * De dónde viene quien escribe al buzón, sin llevarse su llave por delante.
 *
 * Está en `shared/reglas` y no en el servicio por el mismo motivo que las reglas
 * del cobro: son decisiones que se pueden probar sin levantar una base de datos,
 * y lo que no se puede probar barato acaba sin probarse.
 *
 * ⭐ **Aquí lo que se protege es el token.** Las direcciones privadas de esta
 * plataforma llevan la llave dentro —`/mi-ficha/<token>`, `/solicitud/<token>`,
 * `/aceptar/<token>`—, y la ruta que se guarda acaba en una tabla que se lee
 * desde el panel y que se exporta a un texto plano para pegarlo fuera. Un token
 * filtrado por aquí es acceso permanente al panel de un profesor, y no se vería:
 * la incidencia parecería una más.
 */

export type Quien = 'familia' | 'profesor' | 'visita';

/**
 * Secciones en las que el segundo tramo es siempre una llave.
 *
 * Aquí no se mira si «parece» un identificador: se tira siempre. Fiarse del
 * aspecto funciona con los tokens de 43 caracteres que se generan hoy, y dejaría
 * de funcionar el día que alguien acorte un token o invente una dirección corta,
 * sin que nadie se entere. La lista es corta y es la verdad del enrutado.
 */
const SECCIONES_PRIVADAS = ['mi-ficha', 'solicitud', 'aceptar'];

/** Se queda con la sección y descarta todo lo que pueda ser un identificador. */
export function rutaSegura(pagina: string | null | undefined): string | null {
  if (!pagina) return null;

  // Se quita el dominio si viene entero, y la consulta y el ancla siempre: el
  // token puede ir en cualquiera de los tres sitios.
  const sinOrigen = pagina.replace(/^https?:\/\/[^/]+/i, '');
  const limpia = sinOrigen.split('?')[0].split('#')[0];
  const tramos = limpia.split('/').filter(Boolean);

  if (tramos.length === 0) return '/';

  const primero = tramos[0].slice(0, 40);
  const segundo = tramos[1] ?? '';

  /*
   * El segundo tramo sólo se conserva si claramente no es un identificador.
   * Los tokens son de 43 caracteres y los slugs de profesor llevan sufijo, así
   * que el corte es generoso a propósito: ante la duda, se tira. Perder «desde
   * qué subpágina» es una molestia; guardar una llave, un problema.
   */
  const pareceIdentificador =
    SECCIONES_PRIVADAS.includes(primero) ||
    segundo.length > 12 ||
    /[A-Z0-9_-]{8,}/.test(segundo);

  return !segundo || pareceIdentificador
    ? `/${primero}`
    : `/${primero}/${segundo}`;
}

/**
 * Quién escribe, deducido de la página.
 *
 * No se le pregunta. Cada campo que se añade a un formulario de quejas es gente
 * que no lo rellena, y de dónde viene ya lo sabemos.
 */
export function quienEscribe(pagina: string | null | undefined): Quien {
  const ruta = rutaSegura(pagina) ?? '';
  if (ruta.startsWith('/mi-ficha')) return 'profesor';
  if (ruta.startsWith('/solicitud')) return 'familia';
  return 'visita';
}
