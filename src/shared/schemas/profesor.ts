import { z } from 'zod';
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

    // El teléfono no se publica en ninguna parte. Sólo lo recibe una familia
    // que ha aceptado el profesor y que ha pagado el contacto, y en ese momento
    // se lo damos igual que le damos el suyo a él.
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
