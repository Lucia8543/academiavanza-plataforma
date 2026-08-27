import { randomBytes } from 'node:crypto';
import { db } from '@/backend/repositories/cliente';

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
