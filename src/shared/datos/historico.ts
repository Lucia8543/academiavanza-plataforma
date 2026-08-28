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

  /**
   * 60 familias distintas. Exacto, no hace falta redondear.
   *
   * **Ya no sale en la portada, y se queda aquí a propósito.** Era la cifra más
   * baja de las cuatro y, puesta en medio de las otras, las empequeñecía: al
   * lado de «60» un «+1.900» se lee más pequeño de lo que es. Quitarla no es
   * maquillar nada —las tres que quedan son igual de reales y salen del mismo
   * guion— pero el dato sigue siendo verdad y hace falta tenerlo escrito por si
   * algún día vuelve, o por si alguien pregunta de dónde sale el resto.
   */
  familias: 60,

  /**
   * Parejas que pasaron de la primera clase: el 92 %.
   *
   * Se publica como «nueve de cada diez», redondeando **hacia abajo**. Es la
   * cifra que permite decir que los emparejamientos funcionaron sin que sea una
   * opinión: sólo el 8 % se quedó en una sola clase.
   *
   * Sale del apartado 4.5 del informe de migración, tabla «Parejas de una sola
   * clase: 8 %».
   */
  siguieronTrasLaPrimera: 9,

  /**
   * Parejas que duraron más de tres meses: el 56 %.
   *
   * **No se publica.** Estuvo un rato en la portada, junto a la anterior, y se
   * quitó: dos cifras seguidas se estorban, y la primera —nueve de cada diez—
   * dice lo mismo de forma más rotunda. Se queda escrita porque es verdad, sale
   * del mismo apartado del informe y puede volver a hacer falta.
   */
  duraronMasDeTresMeses: '56 %',

  /**
   * 104 parejas familia-profesor.
   *
   * **No son 104 personas, y la etiqueta tiene que decirlo.** Una misma familia
   * aparece en varias parejas: dos hermanos, dos asignaturas, o un profesor que
   * dejó y otro que entró a mitad de curso. Con 60 familias y 46 profesores,
   * 104 parejas es aritmética normal.
   *
   * Durante un tiempo la portada lo llamaba «familias y profesores
   * emparejados», y así leído parecía una cifra inflada: cien personas al lado
   * de sesenta familias no cuadra. Era la más honesta de las tres y la única
   * que daba esa impresión, sólo por cómo estaba escrita.
   */
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
