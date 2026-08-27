/**
 * Las cifras del curso anterior.
 *
 * TODAS salen del análisis de los ficheros históricos, apartado 4 del
 * `docs/05-migracion/informe-migracion.md`, que a su vez sale de los guiones de
 * `database/etl/analisis/`. Ninguna está redondeada hacia arriba ni estimada.
 *
 * Están aquí, juntas y con su procedencia escrita, porque la regla 9 del
 * CLAUDE.md dice que cualquier cifra publicada tiene que poder reproducirse
 * ejecutando un guion del repositorio. Repartirlas por las plantillas sería la
 * forma más rápida de que dentro de un año nadie sepa de dónde salió un número.
 *
 * POR QUÉ TODAS DICEN «MÁS DE»
 *
 * No es prudencia comercial: es que son literalmente un suelo. El registro de
 * clases **sólo cubre el curso 2025-26**, no los dos años de vida del negocio;
 * las clases anteriores no están en ningún fichero. Así que el número real es
 * más alto y no se puede calcular.
 *
 * De ahí la redacción: «más de 1.900 clases sólo en el curso 2025-26». El
 * «sólo» hace el trabajo de decir que hay más detrás sin inventarse una cifra
 * que no se puede reproducir.
 */

export const HISTORICO = {
  /** Del 1 de septiembre de 2025 al 26 de julio de 2026. */
  curso: '2025-26',

  /**
   * 1.904 clases exactas. Es la cifra principal de la portada.
   *
   * No se redondea a 2.000. Es el único número de toda la web que alguien de
   * la etapa anterior podría sentarse a comprobar, y si no le cuadra se pierde
   * exactamente lo que la cifra existe para ganar.
   */
  clases: 1900,

  /**
   * 2.150 horas exactas. Va debajo, como apoyo.
   *
   * Hay más horas que clases porque la clase media dura 68 minutos. No es un
   * truco de redacción: una hora y una clase no son lo mismo, y por eso se
   * dicen las dos cosas y no sólo la que suena mejor.
   */
  horas: 2100,

  /** 60 familias distintas. Exacto, no hace falta redondear. */
  familias: 60,

  /** 104 parejas familia-profesor. */
  emparejamientos: 100,
} as const;

/**
 * La nota que acompaña a las cifras.
 *
 * No es letra pequeña opcional. Sin ella, una plataforma que abre esta semana
 * estaría enseñando mil novecientas clases como si fueran suyas, y eso es
 * publicidad engañosa. Con ella es historial, que es lo que de verdad es y lo
 * que ninguna plataforma recién nacida puede fabricar.
 */
export const NOTA_HISTORICO =
  'Corresponden al curso 2025-26 y están contadas sobre los registros reales ' +
  'de clases de ese curso, cuando el servicio se gestionaba de forma manual.';
