import { z } from 'zod';
import {
  detectarDatosSensibles,
  mensajeDeAvisoProfesor,
} from '@/shared/schemas/datos-sensibles';
import { telefonoEspanol } from '@/shared/schemas/telefono';

/**
 * Validación del alta de un profesor.
 *
 * Este esquema se usa en el servidor, y es el que manda. El formulario también
 * valida en el navegador, pero eso es sólo comodidad para quien rellena: quien
 * decide si un dato entra o no es esto.
 *
 * Las mismas reglas están además en la base de datos como restricciones. Es
 * deliberado: si un día alguien añade otra vía de entrada y olvida validar, la
 * base de datos sigue sin dejar pasar un dato malo.
 */

/** Franjas de la rejilla de disponibilidad, en horas reales. */
export const FRANJAS = {
  manana: { etiqueta: 'Mañana', inicio: '09:00', fin: '14:00' },
  tarde: { etiqueta: 'Tarde', inicio: '16:00', fin: '20:00' },
  noche: { etiqueta: 'Noche', inicio: '20:00', fin: '22:00' },
} as const;

export type Franja = keyof typeof FRANJAS;

export const DIAS = [
  { numero: 1, etiqueta: 'Lunes', corta: 'L' },
  { numero: 2, etiqueta: 'Martes', corta: 'M' },
  { numero: 3, etiqueta: 'Miércoles', corta: 'X' },
  { numero: 4, etiqueta: 'Jueves', corta: 'J' },
  { numero: 5, etiqueta: 'Viernes', corta: 'V' },
  { numero: 6, etiqueta: 'Sábado', corta: 'S' },
  { numero: 7, etiqueta: 'Domingo', corta: 'D' },
] as const;

const texto = (max: number) => z.string().trim().max(max);

export const esquemaRegistroProfesor = z
  .object({
    // --- Identidad -----------------------------------------------------------
    nombre: texto(60).min(2, 'Escribe tu nombre'),
    apellidos: texto(80).min(2, 'Escribe tus apellidos'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(120)
      .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), {
        message: 'Ese correo no parece válido',
      }),

    // El teléfono del profesor no se publica y **no se le da a nadie**, ni
    // siquiera a la familia que paga. El contacto va en un solo sentido: él
    // recibe el de ella y decide si le escribe. Lo razona el ADR 0008.
    // Aquí se pide para poder avisarle nosotros.
    telefono: telefonoEspanol,

    // --- Colegio -------------------------------------------------------------
    // O se elige del catálogo, o se escribe. Nunca las dos cosas.
    colegioId: z.string().optional().default(''),
    colegioOtro: texto(120).optional().default(''),

    // --- Estudios ------------------------------------------------------------
    titulacion: texto(120).min(2, 'Dinos qué estudias o has estudiado'),
    universidad: texto(120).min(2, 'Dinos en qué universidad'),
    cursoActual: z.coerce.number().int().min(1).max(8).optional(),
    titulacionFinalizada: z.boolean().default(false),

    /**
     * Años dando clases particulares.
     *
     * Es la señal de confianza más barata que existe, y la única que enseñan
     * las plataformas grandes y aquí faltaba. Opcional: quien empieza ahora no
     * tiene por qué sentirse mal por dejarlo en blanco.
     */
    anosExperiencia: z.coerce.number().int().min(0).max(50).optional(),

    // --- Oferta --------------------------------------------------------------
    asignaturas: z.array(z.string()).min(1, 'Elige al menos una asignatura'),
    niveles: z.array(z.string()).min(1, 'Elige al menos un curso'),
    certificaciones: z.array(z.string()).default([]),

    modalidad: z.enum(['online', 'presencial', 'ambas']),

    /**
     * Si puede coger alumnos nuevos ahora mismo.
     *
     * Se pregunta en el alta y no sólo en el panel porque la mitad de los
     * profesores que se apuntan **ya tienen alumnos del curso pasado**. Sin
     * esta pregunta, o no se registran —«¿para qué, si estoy lleno?»— o se
     * registran como disponibles y les llueven familias que no pueden coger.
     *
     * Las dos cosas dejan el directorio mintiendo: en un caso enseña menos
     * profesores de los que hay, y en el otro enseña como libres a gente que
     * no lo está.
     *
     * Por defecto `busca`, que es el caso de quien se apunta por primera vez.
     */
    cupo: z.enum(['busca', 'justo', 'completo']).optional().default('busca'),
    zona: texto(80).optional().default(''),

    /**
     * Está dispuesto a salir de su zona habitual.
     *
     * La zona no es una frontera: un profesor de Chamberí puede cruzarse Madrid
     * si el horario compensa. Sin esta casilla, una familia de fuera lee la
     * zona como un límite y se descarta sola sin escribir.
     */
    desplazamientoFlexible: z.boolean().default(false),

    // --- Disponibilidad ------------------------------------------------------
    // Se recibe como 'dia-franja', por ejemplo '2-tarde'.
    disponibilidad: z.array(z.string()).default([]),

    // --- Presentación --------------------------------------------------------
    puntosFuertes: texto(300).min(
      10,
      'Escribe algo que te distinga, aunque sea una frase',
    ),

    // --- Consentimiento ------------------------------------------------------
    /**
     * Declara tener catorce años o más.
     *
     * La casilla dice «14 años o más» y no «mayor de 14 años» a propósito. Lo
     * segundo, en sentido estricto, deja fuera a quien tiene catorce, que es la
     * edad exacta donde está la frontera. Aquí la precisión no es puntillosa,
     * es lo único que hay.
     *
     * La política de privacidad lo exige desde que se reescribió el apartado de
     * menores, y se apoya en el artículo 7 de la LOPDGDD, que es la edad a
     * partir de la cual alguien puede consentir por sí mismo el tratamiento de
     * sus propios datos. Pero durante un tiempo la política lo pedía y el
     * formulario no lo preguntaba en ningún sitio, con lo que no había nada que
     * sostuviera ese consentimiento.
     *
     * No es un dato de más: parte de los profesores del directorio son
     * estudiantes de último curso de instituto, y ahí la diferencia entre trece
     * y catorce años decide si la ficha se puede publicar.
     *
     * Se guarda la declaración y su fecha, igual que con el permiso de
     * publicación, porque un consentimiento sin fecha no acredita nada.
     */
    declaraEdadMinima: z.boolean().refine((v) => v === true, {
      message: 'Hay que tener al menos 14 años para publicar una ficha',
    }),

    aceptaPublicacion: z.boolean().refine((v) => v === true, {
      message: 'Necesitamos tu permiso para publicar la ficha',
    }),
  })
  .refine((d) => Boolean(d.colegioId) || Boolean(d.colegioOtro), {
    message: 'Dinos de qué colegio vienes',
    path: ['colegioId'],
  })
  .refine((d) => d.modalidad === 'online' || Boolean(d.zona), {
    message: 'Si das clase presencial, dinos en qué zona',
    path: ['zona'],
  })
  /*
   * Los dos campos de texto libre del alta pasan por el mismo filtro que el
   * mensaje de la familia.
   *
   * Durante un tiempo sólo lo pasaba el mensaje, y era el hueco más grande de
   * los dos: lo que escribe una familia acaba en un correo, y lo que escribe un
   * profesor **se publica en una página web**. Un profesor que quiere decir que
   * se le dan bien los chavales con dislexia está publicando un dato de
   * categoría especial sobre terceros en un sitio que promete no tratarlos.
   *
   * Va en el servidor, como el de contacto, porque el aviso del navegador es
   * una cortesía y esto es la regla.
   */
  .superRefine((datos, ctx) => {
    const campos = [
      ['puntosFuertes', datos.puntosFuertes],
      ['colegioOtro', datos.colegioOtro],
    ] as const;

    for (const [campo, valor] of campos) {
      const deteccion = detectarDatosSensibles(valor ?? '');
      if (!deteccion) continue;

      ctx.addIssue({
        code: 'custom',
        path: [campo],
        message: mensajeDeAvisoProfesor(deteccion),
      });
    }
  });

export type RegistroProfesor = z.infer<typeof esquemaRegistroProfesor>;

/**
 * Convierte '2-tarde' en las horas reales que guarda la base de datos.
 * Devuelve null si la cadena no tiene sentido, para poder descartarla sin
 * romper el alta entera por una casilla rara.
 */
export function interpretarFranja(
  valor: string,
): { dia: number; inicio: string; fin: string } | null {
  const [diaTexto, franja] = valor.split('-');
  const dia = Number(diaTexto);

  if (!Number.isInteger(dia) || dia < 1 || dia > 7) return null;
  if (!(franja in FRANJAS)) return null;

  const { inicio, fin } = FRANJAS[franja as Franja];
  return { dia, inicio, fin };
}
