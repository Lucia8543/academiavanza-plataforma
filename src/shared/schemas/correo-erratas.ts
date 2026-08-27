/**
 * Erratas típicas al escribir un correo.
 *
 * Un correo mal tecleado no da ningún error: la dirección existe como texto,
 * el formulario la acepta, y el aviso se manda a un buzón que no es de nadie.
 * La familia no se entera de que la han aceptado, no paga, y nadie sabe por
 * qué. Es el fallo más caro de todos precisamente porque es silencioso.
 *
 * Esto no comprueba que el correo exista —eso no se puede hacer sin mandarle
 * algo— sino que detecta las erratas de dominio que comete todo el mundo. Cubre
 * la inmensa mayoría de los casos reales, porque casi nadie se equivoca en la
 * parte de delante de la arroba: esa se la sabe de memoria.
 *
 * Sugiere, no corrige. Alguien puede tener de verdad una dirección rara y
 * cambiársela por las buenas sería peor que el problema.
 */

/** Dominio equivocado → dominio que quería escribir. */
const ERRATAS: Record<string, string> = {
  // Gmail
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.es': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  // Hotmail
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hormail.com': 'hotmail.com',
  'hotmial.es': 'hotmail.es',
  'hotmail.ess': 'hotmail.es',
  // Yahoo
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.es': 'yahoo.es',
  // Outlook e iCloud
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  // Telefónica y otros de aquí
  'telefonica.ne': 'telefonica.net',
  'movistar.e': 'movistar.es',
};

/**
 * Devuelve el correo corregido, o null si no hay nada que sugerir.
 *
 * Ejemplo: «ana@gmial.com» devuelve «ana@gmail.com».
 */
export function sugerirCorreo(correo: string): string | null {
  const limpio = correo.trim().toLowerCase();
  const arroba = limpio.lastIndexOf('@');

  if (arroba < 1) return null;

  const usuario = limpio.slice(0, arroba);
  const dominio = limpio.slice(arroba + 1);
  const bueno = ERRATAS[dominio];

  if (!bueno || !usuario) return null;

  // Con dos arrobas la dirección no es válida de ninguna manera, y sugerir un
  // arreglo del dominio daría a entender que el resto está bien. Que lo rechace
  // la validación, que es de quien es ese trabajo.
  if (usuario.includes('@')) return null;

  return `${usuario}@${bueno}`;
}
