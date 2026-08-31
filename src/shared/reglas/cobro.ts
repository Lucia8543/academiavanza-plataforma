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

/**
 * Cuánto espera una familia a un profesor que no contesta.
 *
 * Antes esto era un número fijo, y el número fijo era el problema: trataba igual
 * a quien necesita clases para el examen del jueves y a quien busca profesor
 * para octubre. A la primera, treinta días la dejan tirada; a la segunda, siete
 * le cierran una solicitud que no tenía ninguna prisa.
 *
 * **Lo elige la familia al escribir**, porque es la única que sabe para cuándo
 * lo necesita. Y se le dice a las dos partes desde el primer correo: el profesor
 * tiene que saber cuánto tiempo tiene, y la familia hasta cuándo esperar. Un
 * plazo que sólo conoce el servidor no es un plazo, es una sorpresa.
 *
 * Los recordatorios van proporcionados al plazo, y **el último deja al menos dos
 * días de margen**. Un aviso la víspera del cierre no sirve de nada: no le da
 * tiempo a reaccionar y llega cuando la familia ya se ha ido a otro sitio. Esa
 * regla la vigila una prueba, para que no se pueda acortar un plazo sin mover
 * sus recordatorios y quedarse sin darse cuenta con un aviso inútil.
 */
export type Urgencia = 'ya' | 'semanas' | 'adelante';

export const PLAZOS: Record<
  Urgencia,
  {
    dias: number;
    etiqueta: string;
    explicacion: string;
    /** Días desde el envío en los que se le insiste al profesor. */
    recordatorios: number[];
  }
> = {
  ya: {
    dias: 5,
    etiqueta: 'Lo necesito ya',
    explicacion: 'Esta semana o la que viene',
    recordatorios: [1, 3],
  },
  semanas: {
    dias: 15,
    etiqueta: 'En las próximas semanas',
    explicacion: 'No corre prisa, pero tampoco es para dentro de mucho',
    recordatorios: [3, 8],
  },
  adelante: {
    dias: 30,
    etiqueta: 'Para más adelante',
    explicacion: 'El mes que viene o el trimestre que entra',
    recordatorios: [7, 18],
  },
};

/** Cuando no consta, se asume el más corto: es el caso más común. */
export const URGENCIA_POR_DEFECTO: Urgencia = 'ya';

/** El plazo de una solicitud, tolerando que la urgencia venga vacía o rara. */
export function plazoDe(urgencia: string | null | undefined) {
  return PLAZOS[urgencia as Urgencia] ?? PLAZOS[URGENCIA_POR_DEFECTO];
}

/**
 * El plazo más largo que existe.
 *
 * Sirve para acotar la consulta de la tarea diaria: por debajo de estos días no
 * hace falta ni mirar una fila. Se calcula en vez de escribirse a mano para que
 * añadir un plazo nuevo no deje esto desfasado en silencio.
 */
export const PLAZO_MAXIMO = Math.max(
  ...Object.values(PLAZOS).map((p) => p.dias),
);

/**
 * El plazo más corto, y el primer día en que se recuerda algo.
 *
 * Los usa la tarea diaria para acotar lo que se trae de la base de datos: por
 * debajo de estos días no hay ninguna solicitud a la que le toque nada, sea cual
 * sea su plazo. Después se filtra fila a fila por el plazo de cada una.
 *
 * Se calculan, no se escriben: añadir un plazo nuevo más corto dejaría un número
 * a mano desfasado, y el síntoma sería que a unas solicitudes deja de tocarles
 * nada sin que nadie lo note.
 */
export const PLAZO_MINIMO = Math.min(
  ...Object.values(PLAZOS).map((p) => p.dias),
);

export const RECORDATORIO_MAS_TEMPRANO = Math.min(
  ...Object.values(PLAZOS).flatMap((p) => p.recordatorios),
);

/**
 * Solicitudes caducadas sin contestar que le cuestan la ficha a un profesor.
 *
 * Cinco, y no dos como estuvo un tiempo. Dos era demasiado severo para lo que
 * cuesta el despiste: un profesor de veinte años en época de exámenes puede
 * dejar pasar dos correos y seguir siendo perfectamente bueno. Cinco ya no es
 * un despiste, es que no está.
 *
 * Lo importante no es el número sino que **él lo sepa antes de llegar**. Lleva
 * el contador a la vista en su panel y la regla escrita en cada recordatorio, y
 * volver al directorio después es un clic. Una regla que sólo se descubre
 * cuando ya te ha caído encima no es una regla, es una trampa.
 */
/**
 * Días que espera la familia, tras pagar, antes de poder decir que el profesor
 * no ha llegado a escribirle y pedir otro contacto sin coste.
 *
 * Este plazo lo sostiene todo el diseño del contacto en un solo sentido: al
 * profesor se le da el teléfono de la familia y a ella no se le da el suyo, así
 * que **ella no puede hacer nada más que esperar**. Ha pagado y ha quedado en
 * manos de otro, y eso obliga a ponerle un final visible.
 *
 * Tres días y no dos, porque dos no cubren un fin de semana: quien acepta un
 * viernes por la tarde y escribe el lunes por la mañana no ha hecho nada mal, y
 * un plazo que lo tratara como un abandono castigaría al profesor normal. Y
 * tres y no siete, porque a la semana la familia ya ha buscado en otro sitio y
 * el vale llega tarde.
 *
 * **Vivía en `services/solicitud.ts` y se trajo aquí** cuando hubo que
 * prometerlo también en la portada, en la guía y en el correo de confirmación.
 * Un plazo que se enseña en cuatro pantallas no puede vivir dentro de un
 * servicio, entre otras cosas porque ese servicio importa las plantillas de
 * correo: pedirle el número desde una plantilla habría creado un ciclo.
 */
export const DIAS_PARA_RECLAMAR = 3;

/**
 * Hasta cuándo se puede pedir el vale.
 *
 * El otro extremo del plazo de arriba. Aquél dice cuánto hay que esperar antes
 * de reclamar; éste, hasta cuándo tiene sentido hacerlo.
 *
 * **De dónde sale.** La plataforma no sabe nada de las clases. No hay
 * calendario, no hay asistencia y el dinero de las clases no pasa por aquí, así
 * que no existe ningún dato que distinga una familia que dio una clase de otra
 * que dio treinta. Sin este plazo, alguien que estuvo tres meses con un profesor
 * y se quedó sin él podía marcar «no acabamos de encajar» y llevarse el
 * siguiente contacto gratis, y por dentro se vería exactamente igual que quien
 * lo dejó a la primera semana.
 *
 * No hacía falta saber cuántas clases hubo para resolverlo. Basta con mirar
 * cuánto tiempo ha pasado: quien pagó en junio y reclama en septiembre no está
 * diciendo «esto no funcionó», está diciendo «funcionó y se acabó». Son dos
 * cosas distintas y sólo la primera es lo que este vale viene a cubrir.
 *
 * **Treinta días y no quince**, porque el caso normal se estira más de lo que
 * parece. Se acuerda una primera clase para la semana siguiente, se cae por un
 * examen, se hacen dos de prueba y se decide. Quince días dejarían fuera a
 * familias que tienen toda la razón, y equivocarse hacia ese lado es peor:
 * cuesta una familia entera por ahorrar diez euros.
 *
 * Se cuenta desde que se pagó, no desde que se envió la solicitud, porque el
 * profesor pudo tardar en aceptar y ese tiempo no es de la familia.
 */
export const DIAS_LIMITE_PARA_RECLAMAR = 30;

export const CADUCADAS_PARA_PAUSAR = 5;
