/**
 * La solicitud de una familia, vista desde fuera.
 *
 * Como el resto de tipos de `shared`, existe para que las pantallas no dependan
 * de la forma de las tablas. Y aquí importa más que en ningún otro sitio, porque
 * lo que este tipo tiene o deja de tener decide qué teléfonos se pueden enseñar.
 *
 * Los dos teléfonos son opcionales a propósito: sólo vienen rellenos cuando la
 * solicitud está pagada. No es que la pantalla los esconda; es que no llegan.
 */

/**
 * Los estados por los que pasa una solicitud.
 *
 * Tiene que coincidir con el enum `app.estado_solicitud` de la base de datos.
 * Las reglas de qué se puede hacer en cada uno están en
 * `shared/reglas/solicitud.ts`, y allí se prueban todos contra todos.
 */
export type EstadoSolicitud =
  | 'pendiente_profesor'
  | 'aceptada'
  | 'pagada'
  | 'rechazada'
  | 'caducada'
  /** La familia dijo expresamente que lo dejaba. */
  | 'cancelada'
  /** Se le devolvió el dinero. */
  | 'devuelta';

/** Lo que ve la familia en su página de seguimiento. */
export type SolicitudFamilia = {
  codigo: string;
  estado: EstadoSolicitud;
  nombreFamilia: string;
  /** Nombre público del profesor: «Marta R.» */
  profesor: string;
  slugProfesor: string;
  colegio: string | null;
  nivel: string | null;
  /** Precio orientativo de la hora para ese curso. Null si no hay referencia. */
  precioReferencia: number | null;
  importe: number;
  /** Sin coste porque viene de un vale. */
  gratisPorVale: boolean;
  /**
   * Tiene derecho a un contacto gratis por haber quedado descontenta.
   *
   * Se enseña en su propia página de seguimiento, que es el único sitio donde
   * puede verlo: no tenemos su correo. Si no se le dijera ahí, el vale
   * existiría en la base de datos y en ningún otro sitio.
   */
  tieneVale: boolean;
  /**
   * Días desde que se pagó. Se calcula al leer de la base de datos y no al
   * pintar la página: un componente no puede mirar el reloj.
   */
  diasDesdePago: number | null;
  /**
   * El teléfono de la propia familia.
   *
   * Se devuelve para poder buscar sus otras solicitudes. Es un dato suyo que
   * ella misma escribió, así que enseñárselo no revela nada.
   */
  telefonoFamilia: string;
  /** Su propio correo, para poder enseñárselo y dejar que lo corrija. */
  emailFamilia: string;
  /** Qué contestó al recordatorio de pago: 'si', 'no' o null. */
  intencionPago: string | null;
  /**
   * Ha dicho que ya ha hecho el Bizum.
   *
   * No es un pago confirmado —eso es el estado `pagada`— sino la familia
   * avisando de que le toca a la plataforma. Mientras esté puesto, no se le
   * reclama nada ni se le cierra la solicitud.
   */
  avisoDePago: boolean;
  motivoRechazo: string | null;
  enviadaEn: Date;
  /*
   * Aquí había un `telefonoProfesor`, y ya no hay ninguno.
   *
   * El teléfono del profesor no sale de la plataforma en ninguna dirección y
   * bajo ningún estado. El contacto va en un solo sentido: el profesor recibe
   * el teléfono de la familia y es él quien decide si llama, si escribe o si
   * da su número.
   *
   * El motivo es que **una parte de los profesores es menor de edad**. Repartir
   * el teléfono de un menor a un adulto desconocido no es un detalle de
   * producto: es lo que este diseño existe para impedir.
   */
};

/** Lo que ve el profesor en el enlace donde decide. */
export type SolicitudProfesor = {
  estado: EstadoSolicitud;
  nombreFamilia: string;
  nivel: string | null;
  mensaje: string | null;
  /**
   * Distrito o municipio donde vive la familia, para decidir si compensa ir.
   *
   * Vacío en las solicitudes anteriores a que se preguntara, y en las de
   * profesores que sólo dan clase online. Nunca es una dirección: sale de una
   * lista cerrada.
   */
  zona: string | null;
  enviadaEn: Date;
  /** Ya tiene al menos un aparato apuntado: no hay que volver a pedirle nada. */
  avisadoPorMovil: boolean;
  /** Cómo está ahora mismo su ficha, para poder confirmárselo tras cambiarlo. */
  cupo: 'busca' | 'justo';
  /** Su ficha está pausada: no aparece en el directorio. */
  pausado: boolean;
  /** Sólo cuando está pagada. */
  telefonoFamilia?: string;
};
