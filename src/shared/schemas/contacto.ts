import { z } from 'zod';
import {
  detectarDatosSensibles,
  mensajeDeAviso,
} from '@/shared/schemas/datos-sensibles';

/**
 * Lo que una familia rellena para escribir a un profesor.
 *
 * Se pide lo mínimo: quién eres y por dónde te llamo. Nada del alumno —ni
 * nombre, ni edad, ni colegio—, porque es menor y no hace falta para que dos
 * adultos se pongan de acuerdo en una primera llamada.
 *
 * El teléfono es el único canal, por decisión de producto: es como ha
 * funcionado siempre y es lo que la gente contesta. A cambio, si el profesor no
 * llama, no tenemos forma de avisar a la familia. Es un coste asumido a
 * conciencia.
 */

/**
 * Un teléfono español, escrito como lo escribe la gente.
 *
 * Se aceptan espacios, guiones y el prefijo +34, porque nadie teclea su número
 * de la misma manera y rechazar «600 12 34 56» por los espacios es una forma
 * tonta de perder a una familia. Se limpia y luego se comprueba.
 */
export function normalizarTelefono(valor: string): string {
  return valor.replace(/[\s.\-()]/g, '').replace(/^(\+34|0034)/, '');
}

const telefonoEspanol = z
  .string()
  .trim()
  .transform(normalizarTelefono)
  .refine((v) => /^[6789]\d{8}$/.test(v), {
    message: 'Escribe un teléfono español de nueve cifras',
  });

export const esquemaContacto = z.object({
  nombreFamilia: z
    .string()
    .trim()
    .min(2, 'Dinos cómo te llamas')
    .max(80),

  telefono: telefonoEspanol,

  /**
   * Curso del alumno, obligatorio.
   *
   * Es lo primero que pregunta cualquier profesor antes de decir que sí, y sin
   * ello la primera llamada se gasta en averiguarlo. Las opciones son sólo los
   * cursos que da ese profesor, así que elegir uno es también comprobar que
   * encaja.
   *
   * No es dato del alumno en el sentido que nos preocupa: un curso no
   * identifica a nadie ni es categoría especial.
   */
  nivelId: z.string().trim().min(1, 'Dinos a qué curso va'),

  modalidad: z.enum(['online', 'presencial', 'ambas']).optional(),

  mensaje: z
    .string()
    .trim()
    .max(500, 'El mensaje no puede pasar de 500 caracteres')
    .optional()
    .default(''),

  // Las dos casillas son obligatorias y lo dice la base de datos además del
  // formulario: hay una restricción CHECK que rechaza la fila si vienen en
  // falso. Un consentimiento que se puede saltar no es un consentimiento.
  esTutorLegal: z.boolean().refine((v) => v === true, {
    message: 'Solo puede escribir la madre, el padre o el tutor legal',
  }),

  aceptaPrivacidad: z.boolean().refine((v) => v === true, {
    message: 'Necesitamos tu permiso para pasarle tus datos al profesor',
  }),
})
  // El texto libre es el único hueco del formulario por donde puede colarse un
  // dato que no debemos tener. Se comprueba aquí, en el servidor, aunque el
  // navegador ya avise mientras se escribe: el aviso del navegador es una
  // cortesía y esto es la regla. Si alguien envía el formulario sin
  // JavaScript, la comprobación sigue en pie.
  .superRefine((datos, ctx) => {
    const deteccion = detectarDatosSensibles(datos.mensaje ?? '');
    if (!deteccion) return;

    ctx.addIssue({
      code: 'custom',
      path: ['mensaje'],
      message: mensajeDeAviso(deteccion),
    });
  });

export type DatosContacto = z.infer<typeof esquemaContacto>;
