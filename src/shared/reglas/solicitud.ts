import type { EstadoSolicitud } from '@/shared/types/solicitud';

/**
 * Las reglas del recorrido de una solicitud, sin base de datos de por medio.
 *
 * Están aquí, solas y sin dependencias, por un motivo concreto: son lo único
 * del sistema cuyo fallo no se nota hasta que es tarde. Si un teléfono se
 * enseña un estado antes de tiempo, nadie ve un error en pantalla: se ve una
 * página normal con un dato que no debería estar ahí, y sólo se descubre cuando
 * alguien se queja.
 *
 * Al ser funciones puras se pueden probar exhaustivamente —todos los estados
 * contra todos los estados— sin levantar nada. Y al estar en `shared` las usan
 * igual el servidor y las pantallas, así que no hay dos versiones de la verdad.
 */

export const ESTADOS: EstadoSolicitud[] = [
  'pendiente_profesor',
  'aceptada',
  'pagada',
  'rechazada',
  'caducada',
  'cancelada',
  'devuelta',
];

/**
 * Qué transiciones existen.
 *
 * Lo que no está aquí, no puede pasar. En particular no se puede volver de
 * `pagada` a `aceptada` —el dinero ya cambió de manos y los teléfonos ya se
 * enseñaron— ni salir de un estado final.
 */
const TRANSICIONES: Record<EstadoSolicitud, EstadoSolicitud[]> = {
  pendiente_profesor: ['aceptada', 'rechazada', 'caducada'],
  // Puede pagar, decir que lo deja, o dejar pasar el tiempo.
  aceptada: ['pagada', 'cancelada', 'caducada'],
  // De pagada sólo se sale devolviendo el dinero.
  pagada: ['devuelta'],
  rechazada: [],
  caducada: [],
  cancelada: [],
  devuelta: [],
};

export function transicionPermitida(
  desde: EstadoSolicitud,
  hasta: EstadoSolicitud,
): boolean {
  return TRANSICIONES[desde]?.includes(hasta) ?? false;
}

/** Un estado del que ya no se sale. */
export function esFinal(estado: EstadoSolicitud): boolean {
  return TRANSICIONES[estado].length === 0;
}

/**
 * Cuándo ve el profesor el teléfono de la familia.
 *
 * **Ésta es la regla más importante de la plataforma.** Es lo que se compra: el
 * teléfono se enseña cuando hay pago, y ni un momento antes.
 *
 * Se llamaba `puedeVerTelefonos`, en plural, porque antes gobernaba los dos: al
 * pagar, cada parte veía el número de la otra. **Ya no hay dos.** El teléfono
 * del profesor no se enseña en ningún estado —lo razona el ADR 0008— así que un
 * nombre en plural aquí sería una invitación a volver a usarla para lo que ya no
 * hace. Un nombre que miente es como vuelven los fallos.
 *
 * Está escrita al revés de como se suele hacer —una lista de lo que SÍ, en vez
 * de esconder lo que NO— para que añadir un estado nuevo tenga como efecto por
 * defecto no enseñar nada. Un olvido así falla del lado seguro.
 */
export function elProfesorVeElTelefono(estado: EstadoSolicitud): boolean {
  // Devuelta incluida: el dinero se ha devuelto, pero hablaron. Quitarle el
  // número después de que se hayan llamado no protege a nadie y rompe una
  // relación que ya existe.
  return estado === 'pagada' || estado === 'devuelta';
}

/** ¿Toca pagar? */
export function esperaPago(estado: EstadoSolicitud): boolean {
  return estado === 'aceptada';
}

/** ¿Puede la familia reclamar un contacto gratis? */
export function puedeReclamarVale(estado: EstadoSolicitud): boolean {
  return estado === 'pagada';
}

/**
 * ¿Sigue viva, en el sentido de que alguien tiene algo que hacer?
 *
 * Sirve para saber si hay que seguir recordando, avisando y contando esta
 * solicitud como pendiente.
 */
export function sigueViva(estado: EstadoSolicitud): boolean {
  return estado === 'pendiente_profesor' || estado === 'aceptada';
}

/** ¿Hubo dinero de por medio? Para las cuentas y para el vale. */
export function huboPago(estado: EstadoSolicitud): boolean {
  return estado === 'pagada' || estado === 'devuelta';
}
