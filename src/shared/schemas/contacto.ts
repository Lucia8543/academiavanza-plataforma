import { z } from 'zod';
import { URGENCIA_POR_DEFECTO } from '@/shared/reglas/cobro';
import {
  detectarDatosSensibles,
  mensajeDeAviso,
} from '@/shared/schemas/datos-sensibles';
import { esZonaValida } from '@/shared/datos/zonas';
import { telefonoEspanol } from '@/shared/schemas/telefono';

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

export const esquemaContacto = z.object({
  nombreFamilia: z
    .string()
    .trim()
    .min(2, 'Dinos cómo te llamas')
    .max(80),

  telefono: telefonoEspanol,

  /**
   * Para cuándo necesita las clases.
   *
   * Decide cuántos días tiene el profesor para contestar antes de que la
   * solicitud se cierre sola. Lo elige la familia porque es la única que lo
   * sabe: un plazo fijo trata igual a quien tiene examen el jueves y a quien
   * busca profesor para octubre.
   *
   * Tiene valor por defecto para que una solicitud sin este campo —una antigua,
   * o un formulario enviado sin JavaScript— siga siendo válida.
   */
  urgencia: z
    .enum(['ya', 'semanas', 'adelante'])
    .optional()
    .default(URGENCIA_POR_DEFECTO),

  /**
   * El correo es nuestro, no del profesor.
   *
   * Sirve para avisarle de lo que pasa con su solicitud sin que tenga que
   * acordarse de volver a mirar una página: que el profesor ha aceptado, que el
   * pago está confirmado, que su vale va a caducar. **Al profesor no se le da
   * nunca**; a él sólo le pasamos el nombre y el teléfono, y sólo cuando ha
   * aceptado y la familia ha pagado.
   *
   * Es obligatorio porque sin él la familia depende de guardar un enlace, y
   * quien lo pierde se queda sin forma de saber si le han aceptado.
   */
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), {
      message: 'Ese correo no parece válido',
    }),

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

  /**
   * Dónde vive la familia, para que el profesor sepa si le compensa ir.
   *
   * Sólo se pregunta cuando el profesor da clase presencial: a quien sólo da
   * online, la zona no le dice nada, y cada campo de más es gente que se va sin
   * escribir. Por eso es opcional aquí y obligatorio en el formulario cuando
   * toca.
   *
   * Se valida contra la lista cerrada. No es paranoia de formato: es lo que
   * garantiza que aquí no acabe una dirección con calle y número, que es lo que
   * la gente escribe cuando le preguntas dónde vive y le das un hueco libre.
   */
  zona: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine((v) => v === '' || esZonaValida(v), {
      message: 'Elige una zona de la lista',
    }),

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

  /**
   * Código de un vale, si la familia tiene uno.
   *
   * Se comprueba en el servidor: aquí sólo se limpia. Un código inventado no
   * hace fallar el formulario, simplemente no descuenta nada, porque rechazar
   * el envío entero por un vale mal escrito sería castigar a quien ya tuvo una
   * mala experiencia.
   */
  vale: z
    .string()
    .trim()
    .toUpperCase()
    .max(10)
    .optional()
    .default(''),
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
