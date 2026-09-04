import { z } from 'zod';
import { URGENCIA_POR_DEFECTO } from '@/shared/reglas/cobro';
import {
  detectarDatosSensibles,
  mensajeDeAviso,
} from '@/shared/schemas/datos-sensibles';
import {
  detectarDatosDeContacto,
  mensajeDeAvisoContacto,
} from '@/shared/schemas/datos-de-contacto';
import { esBarrioValido, esZonaValida } from '@/shared/datos/zonas';
import { MAXIMO_HERMANOS } from '@/shared/textos/hermanos';
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

  /**
   * El barrio dentro del distrito, y sólo si la familia lo sabe.
   *
   * Opcional a conciencia: mucha gente no conoce el nombre oficial del suyo, y
   * obligar a acertar cambiaría un formulario que se rellena por uno que se
   * abandona. Quien lo sepa afina; quien no, se queda en el distrito y el
   * profesor decide igual de bien.
   *
   * Que pertenezca de verdad al distrito elegido se comprueba abajo, en el
   * `superRefine`, porque hace falta mirar los dos campos a la vez.
   */
  barrio: z.string().trim().optional().default(''),

  /**
   * Cuántas horas de clase por semana calcula la familia.
   *
   * Lo pidió una profesora que no podía decidir si aceptar sin saberlo, y es
   * de las cosas que sólo se ven cuando alguien las sufre: el profesor tiene un
   * único momento para decir que sí o que no, y es justo el que hace que la
   * familia pague. Sin este dato, o rechaza propuestas que le venían bien o le
   * pide el teléfono a la familia antes de aceptar para preguntárselo, que es
   * saltarse lo único que cobra la plataforma.
   *
   * **`no-lo-se` es una respuesta y la cadena vacía es otra.** Una familia que
   * escribe en septiembre muchas veces no lo sabe todavía, y decirlo es más
   * útil que inventarse un número: al profesor le avisa de que eso está por
   * hablar. Quien no contesta nada deja el campo vacío y ya está.
   */
  horasSemana: z
    /*
     * `mas-de-3` sigue aceptándose aunque el formulario ya no lo ofrezca.
     *
     * Es el tope que hubo hasta la migración 28 y quedan filas con él. Esta
     * validación no sólo mira lo que entra por el formulario: por aquí pasan
     * también las pruebas y cualquier reproceso de datos ya guardados, y una
     * lista que se queda corta convierte un dato válido en un error.
     */
    .enum(['', '1', '2', '3', '4', '5-o-mas', 'no-lo-se', 'mas-de-3'])
    .optional()
    .default(''),

  /**
   * Qué días le vendrían mejor, de 1 (lunes) a 7 (domingo).
   *
   * Sin franja horaria a propósito. Las franjas ya las declara el profesor en
   * su rejilla, y pedirle a una madre que rellene siete días por tres franjas
   * en el móvil es perder solicitudes. Con los días basta para descartar lo
   * imposible, que es de lo que se trata; la hora concreta la acuerdan ellos
   * cuando hablen.
   *
   * Llegan como cadenas porque un formulario sin JavaScript no sabe de números.
   * Se quedan sólo los siete válidos y se ordenan, para que el profesor los lea
   * de lunes a domingo y no en el orden en que se marcaron las casillas.
   */
  diasPreferidos: z
    .array(z.string())
    .optional()
    .default([])
    .transform((dias) => {
      const validos = dias
        .map((d) => Number(d))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
      return [...new Set(validos)].sort((a, b) => a - b);
    }),

  /**
   * Los hermanos, si los hay: del segundo en adelante.
   *
   * POR QUÉ EL PRIMERO NO ESTÁ AQUÍ
   *
   * Porque el primero es `nivelId` y `horasSemana`, que ya existían y de los
   * que lee media plataforma: el panel de cobros, los correos, la lista de
   * «tus otras solicitudes» y el histórico. Meterlo aquí habría convertido
   * añadir un hermano en reescribir todo eso el mismo día.
   *
   * La asimetría es fea y está asumida a conciencia. Lo que la mantiene honesta
   * es que **al guardar se junta todo en `contacto_alumnos`**, empezando por el
   * primero, y de ahí sale todo lo que se enseña. Esta lista es sólo la forma
   * que tiene el formulario de mandarlos.
   *
   * Se admiten dos como mucho, que con el primero hacen tres.
   */
  hermanos: z
    .array(
      z.object({
        nivelId: z.string().trim().min(1, 'Dinos a qué curso va'),
        horasSemana: z
          .enum(['', '1', '2', '3', '4', '5-o-mas', 'no-lo-se', 'mas-de-3'])
          .optional()
          .default(''),
      }),
    )
    .max(MAXIMO_HERMANOS - 1)
    .optional()
    .default([]),

  /**
   * La familia acepta que el profesor coja sólo a alguno de los hermanos.
   *
   * Sin esto, un profesor que sólo puede con uno tiene que decir que no a todo
   * y la familia se queda sin nadie teniendo media solución delante. Con esto
   * elige él, que es el único que sabe cómo tiene la tarde.
   *
   * En una solicitud de un solo alumno no significa nada, y por eso se apaga
   * más abajo en vez de confiar en que el formulario no la mande.
   */
  valeConUno: z.boolean().optional().default(false),

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
   * Aquí sólo se limpia. Si el código existe, si ya se gastó o si caducó lo
   * decide el servidor, porque es lo único que puede mirarlo contra la base de
   * datos.
   *
   * **Un código que no vale sí frena el envío**, y este comentario decía lo
   * contrario hasta que se corrigió. Antes se ignoraba y se cobraban los diez
   * euros, y el resultado era una familia que tecleaba su código, veía el
   * precio entero y no tenía forma de saber si se había equivocado al
   * escribirlo, si ya lo había gastado o si se le había pasado el plazo.
   *
   * Frenar aquí no le cuesta nada: el formulario vuelve con todo lo que había
   * escrito y un mensaje que dice cuál de las tres cosas ha pasado, así que lo
   * corrige o lo deja en blanco y sigue. Lo que sí costaría es lo otro, porque
   * un cobro nacido de un malentendido se descubre cuando ya toca pagar.
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
  // Un barrio que no es de ese distrito no es un despiste de formato: o el
  // formulario se envió a mano, o alguien cambió el distrito después de elegir
  // el barrio. En los dos casos el dato resultante sería mentira.
  /*
   * «Me vale con que coja a uno» sólo tiene sentido con hermanos.
   *
   * Se apaga aquí en vez de rechazar el envío, porque una casilla marcada que
   * ha dejado de tener sentido no es un error de nadie: la madre pudo marcar
   * dos hermanos, marcar esa opción y volver a poner un alumno. Rechazárselo
   * sería castigarla por cambiar de idea.
   *
   * Y se apaga en el esquema y no en la pantalla, que es donde se cambió de
   * idea, porque lo que llega al servidor no tiene por qué venir de la
   * pantalla.
   */
  .transform((datos) => ({
    ...datos,
    valeConUno: datos.hermanos.length > 0 ? datos.valeConUno : false,
  }))
  .superRefine((datos, ctx) => {
    if (datos.barrio && !esBarrioValido(datos.zona, datos.barrio)) {
      ctx.addIssue({
        code: 'custom',
        path: ['barrio'],
        message: 'Ese barrio no es de ese distrito',
      });
    }
  })
  .superRefine((datos, ctx) => {
    const deteccion = detectarDatosSensibles(datos.mensaje ?? '');
    if (!deteccion) return;

    ctx.addIssue({
      code: 'custom',
      path: ['mensaje'],
      message: mensajeDeAviso(deteccion),
    });
  })
  /*
   * Un teléfono, un correo o un usuario escritos dentro del texto.
   *
   * Esto no protege a nadie de nada: protege lo único que cobra la plataforma.
   * El mensaje viaja al profesor **dentro del correo de la propuesta**, o sea
   * antes de que la familia pague, así que quien escribiera ahí su número
   * conseguía gratis exactamente lo que cuestan diez euros. No hacía falta
   * ingenio ninguno, porque no había nada que esquivar.
   *
   * Se mira también el nombre, y no por simetría. El profesor **ve el nombre de
   * la familia en la pantalla donde decide**, igual que el mensaje y por el
   * mismo motivo: necesita saber a quién le está diciendo que sí. Un campo de
   * ochenta caracteres a la vista del profesor y sin comprobar es la misma
   * puerta con otro cartel, y dejarla abierta después de cerrar la de al lado
   * habría sido no haber entendido cuál era el problema.
   *
   * El teléfono y el correo de arriba no pasan por aquí, faltaría más: ésos son
   * los campos donde se piden, tienen su propia validación y son justamente lo
   * que la plataforma vende.
   */
  .superRefine((datos, ctx) => {
    const campos = [
      ['mensaje', datos.mensaje],
      ['nombreFamilia', datos.nombreFamilia],
    ] as const;

    for (const [campo, valor] of campos) {
      const deteccion = detectarDatosDeContacto(valor ?? '');
      if (!deteccion) continue;

      ctx.addIssue({
        code: 'custom',
        path: [campo],
        message: mensajeDeAvisoContacto(deteccion),
      });
    }
  });

export type DatosContacto = z.infer<typeof esquemaContacto>;
