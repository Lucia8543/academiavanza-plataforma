/**
 * Las guías que recibe todo el que publica ficha.
 *
 * Están en un solo sitio porque se enseñan en dos, y a públicos distintos: en
 * `/como-dar-clase` al profesor que va a usarlas, y en la portada a la familia
 * que quiere saber qué le damos a ese profesor. Si cada pantalla tuviera su
 * propia lista, al añadir la quinta guía aparecería en una y no en la otra, y
 * la portada estaría prometiendo un catálogo que no coincide con el real.
 *
 * De ahí que cada guía lleve dos frases y no una:
 *
 * - `paraElProfesor` dice **qué vas a hacer el martes**. Es operativa.
 * - `paraLaFamilia` dice **qué problema resuelve**, y está escrita para alguien
 *   que reconoce a su hijo en ella. Una madre no necesita saber qué es el truco
 *   del semáforo; necesita ver que sabemos de qué le estamos hablando.
 *
 * Y ninguna de las dos menciona diagnósticos. El formulario de las familias
 * rechaza a propósito los mensajes que los mencionan, así que nombrarlos aquí
 * sería empujar a escribir justo lo que luego se bloquea.
 */

export type GuiaDeClase = {
  href: string;
  titulo: string;
  paraElProfesor: string;
  paraLaFamilia: string;
  minutos: number;
};

export const GUIAS_DE_CLASE: GuiaDeClase[] = [
  {
    href: '/como-dar-clase/no-arranca',
    titulo: 'Autonomía y hábito de estudio',
    paraElProfesor:
      'Cómo estructurar la sesión para que el alumno gane autonomía: qué revisar al empezar, cómo plantear los ejercicios sin resolvérselos y cómo dejar la tarea definida para que se cumpla.',
    paraLaFamilia:
      'Para el alumno que comprende los contenidos cuando alguien le acompaña, pero no consigue ponerse a trabajar por su cuenta.',
    minutos: 4,
  },
  {
    href: '/como-dar-clase/online',
    titulo: 'Metodología para clases online',
    paraElProfesor:
      'Cómo aprovechar una sesión por videollamada: uso de la pizarra compartida, reparto de los tiempos y preguntas de comprobación que aseguran que el alumno participa.',
    paraLaFamilia:
      'Para que una clase por videollamada resulte tan aprovechada como una presencial.',
    minutos: 3,
  },
  {
    href: '/como-dar-clase/se-despista',
    titulo: 'Evitar distracciones en clases a domicilio',
    paraElProfesor:
      'Cómo preparar el espacio de trabajo y organizar la sesión en bloques para sostener la atención durante toda la clase.',
    paraLaFamilia:
      'Para las clases en casa, cuando al alumno le cuesta mantener la atención durante toda la sesión.',
    minutos: 3,
  },
  {
    href: '/como-dar-clase/atencion',
    titulo: 'Adaptaciones para dificultades de atención',
    paraElProfesor:
      'Refuerzo positivo, objetivos a corto plazo y flexibilidad en el método sin rebajar el nivel de exigencia. Incluye dónde termina el papel del profesor particular.',
    paraLaFamilia:
      'Para alumnos con capacidad de sobra, pero para quienes sostener la atención supone un esfuerzo añadido.',
    minutos: 4,
  },
];
