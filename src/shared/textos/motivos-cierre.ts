/**
 * Por qué una familia no ha seguido adelante con un profesor.
 *
 * Es una lista cerrada y no un campo de texto, y la decisión tiene tres motivos
 * que conviene dejar escritos porque el primero que llegue va a querer cambiarlo.
 *
 * El primero es que un texto libre no se rellena. Quien pulsa aquí ya tiene su
 * contacto gratis o ya ha decidido irse: escribir un párrafo no le devuelve
 * nada. Lo que se recoge en la práctica es «nada, gracias» y un 80 % de vacíos.
 *
 * El segundo es que lo que sí se escribe puede traer el nombre del alumno, un
 * diagnóstico o un insulto, y eso acabaría guardado en una base de datos con
 * datos de menores. Una opción cerrada no puede contener nada de eso.
 *
 * El tercero es que esto no sirve sólo para el profesor. Un motivo suelto no
 * dice gran cosa, pero seis familias distintas diciendo «el precio no me
 * encajaba» no hablan de ningún profesor: hablan de que los precios de
 * referencia están mal puestos. Eso sólo se puede contar si el vocabulario es
 * el mismo para todo el mundo.
 *
 * Cada motivo se escribe dos veces. En primera persona para la familia, que
 * está contando lo que le ha pasado, y en tercera y sin filo para el profesor,
 * que lo va a leer sobre sí mismo y sin poder responder.
 */

export type MotivoCierre =
  | 'sin-contacto'
  | 'coste-contacto'
  | 'precio-clases'
  | 'horarios'
  | 'distancia'
  | 'perfil'
  | 'otra-persona'
  | 'no-encajamos'
  | 'ya-no-hace-falta';

/** Lo que lee la familia al elegir. Habla ella. */
export const PARA_LA_FAMILIA: Record<MotivoCierre, string> = {
  'sin-contacto': 'No conseguí hablar con él',
  'coste-contacto': 'No quería pagar por el contacto',
  'precio-clases': 'El precio de las clases no me encajaba',
  horarios: 'No cuadrábamos de horarios',
  distancia: 'Nos venía lejos',
  perfil: 'Buscábamos a alguien con otro perfil',
  'otra-persona': 'Encontramos a otra persona antes',
  'no-encajamos': 'No acabamos de encajar',
  'ya-no-hace-falta': 'Ya no nos hacen falta clases',
};

/**
 * Lo que lee el profesor. Habla la plataforma, y con cuidado.
 *
 * La diferencia con la lista de arriba no es de estilo. «No acabamos de
 * encajar» lo dice alguien de sí mismo y de otro; «No acabasteis de encajar»
 * reparte la responsabilidad entre los dos, que es lo que de verdad pasó. Y
 * ninguna frase empieza por «te», porque el sujeto no es él.
 */
export const PARA_EL_PROFESOR: Record<MotivoCierre, string> = {
  'sin-contacto': 'No consiguió hablar contigo',
  'coste-contacto': 'No quiso pagar el contacto',
  'precio-clases': 'El precio de las clases no le encajaba',
  horarios: 'Los horarios no cuadraban',
  distancia: 'Le venía lejos',
  perfil: 'Buscaba a alguien con otro perfil',
  'otra-persona': 'Encontró a otra persona antes',
  'no-encajamos': 'No acabasteis de encajar',
  'ya-no-hace-falta': 'Al final no le hacían falta clases',
};

/**
 * Lo que se le ofrece a quien ya ha hablado con el profesor y pide otro contacto.
 *
 * No aparece «prefiero no decirlo», y es a propósito. Si el único modo de
 * callarse fuera saltarse la pregunta, quien no quiere entrar en detalle
 * elegiría cualquier opción al azar —normalmente el precio— y el profesor
 * recibiría como un hecho algo que no ha pasado. «No acabamos de encajar» es
 * una respuesta verdadera para ese caso, no una escapatoria.
 *
 * Tampoco aparece «sin-contacto»: ése es el otro botón, no un motivo de éste.
 */
export const MOTIVOS_TRAS_HABLAR: MotivoCierre[] = [
  'precio-clases',
  'horarios',
  'distancia',
  'perfil',
  'otra-persona',
  'no-encajamos',
];

/**
 * Lo que se le ofrece a quien no llega a pagar el contacto.
 *
 * «coste-contacto» está el primero por una razón poco cómoda: es la respuesta
 * que dice que el peaje de la plataforma es demasiado caro, y es la que menos
 * ganas hay de leer. Enterrarla al final del todo sería hacer trampas al
 * solitario.
 */
export const MOTIVOS_SIN_PAGAR: MotivoCierre[] = [
  'coste-contacto',
  'precio-clases',
  'horarios',
  'otra-persona',
  'ya-no-hace-falta',
];

/**
 * De todo esto, qué ve el profesor.
 *
 * Sólo se queda fuera «no quiso pagar el contacto», porque no habla de él: habla
 * del precio que cobra la plataforma. Contárselo sería pasarle una queja que no
 * es suya y que no puede arreglar.
 */
export function seLeCuentaAlProfesor(motivo: MotivoCierre): boolean {
  return motivo !== 'coste-contacto';
}

/** Los valores admitidos, para validar lo que llega de un formulario. */
export const MOTIVOS_VALIDOS = Object.keys(PARA_LA_FAMILIA) as MotivoCierre[];

export function esMotivoCierre(valor: string): valor is MotivoCierre {
  return (MOTIVOS_VALIDOS as string[]).includes(valor);
}
