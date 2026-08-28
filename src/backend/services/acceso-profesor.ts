import { randomBytes } from 'node:crypto';
import { db } from '@/backend/repositories/cliente';
import { enviar } from '@/backend/services/correo';
import { correoEnlacePerdido } from '@/backend/services/plantillas-correo';

/**
 * La llave del profesor.
 *
 * No hay contraseñas. Cada profesor tiene un enlace largo e imposible de
 * adivinar que le lleva a su ficha, y ese enlace es su llave. Está razonado en
 * el ADR 0005, y el motivo de fondo es que una contraseña más es una razón más
 * para no volver: quien no puede entrar a corregir una asignatura no la
 * corrige, deja la ficha mal y se olvida.
 *
 * El enlace **no caduca**, a diferencia del de los avisos. Es su acceso
 * permanente, va en el correo de «tu ficha está publicada» y en todos los
 * recordatorios. Si alguna vez hiciera falta, se revoca creando otro.
 *
 * Lo que hay detrás no es especialmente sensible: su propia ficha, que ya es
 * pública salvo el correo y el teléfono. Quien robara el enlace podría pausarle
 * la ficha o cambiarle las asignaturas, no vaciarle una cuenta.
 */

const PROPOSITO = 'panel';

/** Un siglo. Prisma exige una fecha, así que se le da una que no llega. */
function nunca(): Date {
  return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
}

/**
 * Devuelve el enlace del profesor, creándolo si no lo tenía.
 *
 * Es idempotente a propósito: se llama cada vez que hay que mandarle un correo,
 * y todos los correos deben llevar el mismo enlace. Si cada uno trajera uno
 * distinto, el profesor acabaría con seis llaves y sin saber cuál es la suya.
 */
export async function tokenDelPanel(profesorId: string): Promise<string> {
  const existente = await db.accesos.findFirst({
    where: { profesor_id: profesorId, proposito: PROPOSITO },
    select: { token_hash: true },
  });

  if (existente) return existente.token_hash;

  const token = randomBytes(32).toString('base64url');

  await db.accesos.create({
    data: {
      profesor_id: profesorId,
      token_hash: token,
      proposito: PROPOSITO,
      expira_en: nunca(),
    },
  });

  return token;
}

/** De la llave al profesor. Null si no vale. */
export async function profesorDelPanel(
  token: string,
): Promise<string | null> {
  if (!token) return null;

  const acceso = await db.accesos.findFirst({
    where: { token_hash: token, proposito: PROPOSITO },
    select: { profesor_id: true },
  });

  return acceso?.profesor_id ?? null;
}

/**
 * Minutos que tienen que pasar para volver a reenviarle el enlace a alguien.
 *
 * No protege al profesor de gran cosa —lo peor que puede pasarle es recibir su
 * propio enlace dos veces— pero sí evita las dos molestias reales: que alguien
 * con su dirección le llene el buzón, y que un guion se coma el cupo de correos
 * dándole al botón mil veces.
 *
 * Diez minutos, y no una hora, porque el caso normal es una persona que da al
 * botón, no ve nada, mira el spam, y lo vuelve a intentar. A ésa hay que
 * dejarla probar otra vez.
 */
const MINUTOS_ENTRE_REENVIOS = 10;

/**
 * Le reenvía al profesor el enlace de su ficha, si esa dirección tiene una.
 *
 * **No dice nunca si el correo existe.** La página enseña el mismo mensaje pase
 * lo que pase, y esta función no devuelve nada que permita distinguirlo. El
 * motivo no es teórico: un formulario que contesta «esa dirección no está
 * registrada» es una forma cómoda de ir comprobando quién da clase aquí, y quien
 * da clase aquí es casi siempre menor de veinticinco años y estudiante de un
 * colegio que consta en su ficha pública.
 *
 * Tampoco hace falta contraseña, y no es una relajación de la seguridad: el
 * enlace ya vivía en ese buzón, porque es donde se mandó. Quien controla el
 * correo podía leerlo desde el principio. Esto no abre ninguna puerta nueva,
 * sólo evita que la abra Lucía a mano.
 */
export async function reenviarEnlaceDelPanel(email: string): Promise<void> {
  const direccion = email.trim().toLowerCase();
  if (!direccion) return;

  const profesor = await db.profesores.findFirst({
    // La columna es `citext`, así que la comparación ya ignora mayúsculas.
    where: { email: direccion },
    select: {
      id: true,
      nombre: true,
      email: true,
      estado: true,
      enlace_reenviado_en: true,
    },
  });

  if (!profesor) return;

  /*
   * Una ficha rechazada o inactiva no tiene panel al que volver, así que no se
   * manda nada. Callarse aquí es lo mismo que callarse con un correo que no
   * existe: por fuera no se distingue, que es justo lo que se busca.
   *
   * `pausado` sí entra, y es importante que entre: el profesor pausado es
   * exactamente el que más necesita el enlace, porque es el botón para volver
   * al directorio.
   */
  if (profesor.estado === 'rechazado' || profesor.estado === 'inactivo') return;

  const reciente =
    profesor.enlace_reenviado_en &&
    profesor.enlace_reenviado_en >
      new Date(Date.now() - MINUTOS_ENTRE_REENVIOS * 60 * 1000);

  if (reciente) return;

  const token = await tokenDelPanel(profesor.id);

  const salio = await enviar(
    correoEnlacePerdido({
      para: profesor.email,
      nombreProfesor: profesor.nombre,
      tokenPanel: token,
    }),
  );

  // La fecha se apunta sólo si el correo salió de verdad. Si Resend falla y se
  // apuntara igual, el profesor se quedaría diez minutos sin poder reintentar
  // por un fallo que no es suyo.
  if (salio) {
    await db.profesores.update({
      where: { id: profesor.id },
      data: { enlace_reenviado_en: new Date() },
    });
  }
}
