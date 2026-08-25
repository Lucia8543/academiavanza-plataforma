import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Acceso al panel de administración.
 *
 * Una sola persona entra aquí, así que no hay usuarios ni roles: hay una
 * contraseña, guardada en las variables de entorno y nunca en el código.
 *
 * Al acertarla se deja una galleta firmada. No contiene la contraseña, sino
 * una firma calculada con un secreto que sólo conoce el servidor: quien copie
 * la galleta de otro sitio no puede fabricarse una válida.
 */

const NOMBRE_GALLETA = 'sesion_admin';
const DURACION_DIAS = 30;

function secreto(): string {
  const s = process.env.ADMIN_SECRETO;
  if (!s || s.length < 32) {
    throw new Error(
      'Falta ADMIN_SECRETO, o es demasiado corto. Genera uno largo y ponlo ' +
        'en .env.local y en Vercel.',
    );
  }
  return s;
}

function firmar(caduca: number): string {
  const firma = createHmac('sha256', secreto())
    .update(`admin:${caduca}`)
    .digest('hex');
  return `${caduca}.${firma}`;
}

/** Compara sin filtrar información por el tiempo que tarda. */
function igual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Freno contra el probado de contraseñas a lo bruto.
 *
 * Tras cinco fallos seguidos, cada intento espera más: cinco segundos, diez,
 * veinte… hasta un máximo de dos minutos. Un humano que se equivoca no lo nota;
 * un programa que prueba mil combinaciones por minuto se queda en una.
 *
 * El contador vive en memoria, así que un reinicio del servidor lo pone a cero.
 * No es una defensa perfecta y no pretende serlo: lo que de verdad protege es
 * que la contraseña sea larga. Esto sólo encarece el intento.
 */
let fallosSeguidos = 0;

function esperaTrasFallo(): number {
  if (fallosSeguidos < 5) return 1000;
  const segundos = Math.min(5 * 2 ** (fallosSeguidos - 5), 120);
  return segundos * 1000;
}

export async function claveCorrecta(intento: string): Promise<boolean> {
  const real = process.env.ADMIN_CLAVE;

  if (!real || real.length < 12) {
    // Una contraseña corta es peor que ninguna, porque da sensación de
    // seguridad. Mejor que el panel no abra y se note.
    //
    // Se dice la longitud leída porque el fallo típico no es poner una clave
    // corta: es que el fichero .env.local la recorte. Un valor sin comillas se
    // corta en el primer `#`, que pasa a considerarse un comentario. Ver una
    // longitud de 2 en una contraseña de 18 caracteres señala el problema
    // directamente.
    console.error(
      `[admin] ADMIN_CLAVE no sirve: se han leído ${real?.length ?? 0} ` +
        'caracteres y hacen falta 12 como mínimo. Si tu contraseña lleva ' +
        'almohadillas, comillas o espacios, escríbela entre comillas dobles ' +
        'en .env.local.',
    );
    return false;
  }

  if (igual(intento, real)) {
    fallosSeguidos = 0;
    return true;
  }

  await new Promise((r) => setTimeout(r, esperaTrasFallo()));
  fallosSeguidos += 1;
  return false;
}

export async function abrirSesion(): Promise<void> {
  const caduca = Date.now() + DURACION_DIAS * 24 * 60 * 60 * 1000;

  (await cookies()).set(NOMBRE_GALLETA, firmar(caduca), {
    httpOnly: true, // el código del navegador no puede leerla
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_DIAS * 24 * 60 * 60,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(NOMBRE_GALLETA);
}

export async function haySesion(): Promise<boolean> {
  const galleta = (await cookies()).get(NOMBRE_GALLETA)?.value;
  if (!galleta) return false;

  const [caducaTexto] = galleta.split('.');
  const caduca = Number(caducaTexto);

  if (!Number.isFinite(caduca) || caduca < Date.now()) return false;

  return igual(galleta, firmar(caduca));
}
