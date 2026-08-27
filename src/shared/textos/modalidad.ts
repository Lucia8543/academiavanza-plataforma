import type { Modalidad } from '@/shared/types/directorio';

/**
 * Cómo se llama cada modalidad en pantalla.
 *
 * Vive aquí y no repetido en cuatro plantillas porque hay un matiz que tiene
 * que decirse **siempre igual y en todas partes**: presencial significa que el
 * profesor va a casa del alumno, no que el alumno vaya a casa del profesor.
 *
 * Es una diferencia que cambia la decisión de una familia —el tiempo de
 * desplazamiento, quién se mueve, si hay que acompañar a un menor a otra
 * casa— y que se da por supuesta de formas opuestas según a quién preguntes.
 * Descubrirlo en la primera llamada, después de haber pagado, es una de esas
 * cosas que acaban en devolución.
 */

export const MODALIDAD: Record<Modalidad, string> = {
  online: 'Online',
  presencial: 'A domicilio',
  ambas: 'Online o a domicilio',
};

/** Para el desplegable del alta, donde el profesor elige sobre sí mismo. */
export const MODALIDAD_PROFESOR: Record<Modalidad, string> = {
  online: 'Sólo online',
  presencial: 'Sólo a domicilio del alumno',
  ambas: 'Las dos',
};

/**
 * La modalidad con la zona, ya montada.
 *
 * Dos matices metidos en una frase corta:
 *
 * «A domicilio · Chamberí» se puede leer como «vive en Chamberí», así que la
 * zona lleva delante el verbo que despeja la duda: «suele desplazarse a».
 *
 * Y «suele», no «se desplaza a secas», porque la zona **no es una frontera**.
 * Un profesor de Chamberí puede cruzarse Madrid si el horario compensa, y una
 * familia que lee un límite donde no lo hay se descarta sola sin escribir.
 */
export function comoDaClase(
  modalidad: Modalidad,
  zona: string | null,
  flexible = false,
): string {
  if (modalidad === 'online' || !zona) return MODALIDAD[modalidad];

  const base = `${MODALIDAD[modalidad]}, suele desplazarse a ${zona}`;
  return flexible ? `${base}, y valora otras zonas` : base;
}

/** La aclaración larga, para donde haya sitio. */
export const EXPLICACION_PRESENCIAL =
  'Las clases presenciales son en casa del alumno: es el profesor quien se desplaza.';

/**
 * Lo que se le dice a una familia que está fuera de la zona habitual.
 *
 * Es un empujón deliberado a que escriba igualmente. Escribir es gratis y no
 * compromete a nada, así que el coste de intentarlo es cero y el de no
 * intentarlo es quedarse sin un profesor que sí la habría cogido.
 */
export const ANIMO_FUERA_DE_ZONA =
  'Si vives en otra zona, escríbele igualmente: muchos se desplazan más lejos ' +
  'cuando el horario compensa, y preguntar no cuesta nada.';

/**
 * Lo que se le dice a una familia sobre un profesor que va justo de sitio.
 *
 * Ni se le esconde ni se le desanima: se le da el dato para que decida a quién
 * escribe primero. Escribir sigue siendo gratis y él sigue pudiendo decir que
 * sí, pero la familia merece saber que puede tardar más o decir que no.
 *
 * Y se dice **el motivo**, no sólo el hecho. «Puede tardar» a secas suena a
 * desinterés y hace pensar que el profesor es informal; «ya tiene alumnos» dice
 * exactamente lo contrario y además es la verdad.
 */
export const AVISO_CUPO_JUSTO =
  'Nos ha dicho que ya tiene alumnos y va justo de tiempo, así que puede ' +
  'tardar más en contestar o decir que no. No es desinterés: es que tiene la ' +
  'agenda casi llena. Si tienes prisa, escribe también a algún otro.';

/** La etiqueta corta, para la tarjeta del directorio. */
export const ETIQUETA_CUPO_JUSTO = 'Ya tiene alumnos, va justo';

/**
 * Lo que se le recuerda al profesor cada vez que se le pregunta por su cupo.
 *
 * Un estado que se pone una vez y no se puede cambiar es un estado que la gente
 * no se atreve a poner. Decirle en la misma frase que lo cambia cuando quiera
 * es lo que hace que se atreva a marcar «voy justo» en vez de no marcar nada y
 * seguir recibiendo solicitudes que va a rechazar.
 */
export const CUPO_SE_CAMBIA =
  'Esto lo cambias cuando quieras desde tu ficha, en un botón. Si dentro de ' +
  'dos semanas te queda hueco, vuelves a aparecer delante.';
