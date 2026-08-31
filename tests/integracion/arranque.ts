/**
 * Lo que se comprueba antes de dejar correr una sola prueba.
 *
 * Estas pruebas borran tablas enteras. Si por un descuido apuntaran a Supabase,
 * se llevarían por delante los datos de familias con hijos menores, y eso no se
 * deshace. Así que la primera línea de defensa no es tener cuidado: es negarse
 * a arrancar si la dirección no tiene pinta de ser una base de datos de usar y
 * tirar.
 */

const url = process.env.DATABASE_URL ?? '';

if (!url) {
  throw new Error(
    'Falta DATABASE_URL. Estas pruebas necesitan un PostgreSQL de usar y ' +
      'tirar. Para levantarlo en local:\n\n' +
      '  docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=postgres ' +
      '-e POSTGRES_DB=academiavanza_test postgres:15\n',
  );
}

/*
 * La lista de lo que delata a una base de datos que no es de pruebas.
 *
 * Está escrita al revés de lo habitual —se prohíbe en vez de permitir— porque
 * lo que hay que impedir es concreto y conocido, y una lista blanca de
 * direcciones válidas se quedaría corta en cuanto alguien probara en otro sitio.
 */
const PROHIBIDAS = ['supabase.co', 'supabase.com', 'pooler.supabase'];

for (const señal of PROHIBIDAS) {
  if (url.includes(señal)) {
    throw new Error(
      `DATABASE_URL apunta a «${señal}», que es la base de datos de verdad.\n\n` +
        'Estas pruebas borran tablas enteras entre caso y caso. Ahí hay ' +
        'teléfonos de familias con hijos menores y no se pueden recuperar.\n\n' +
        'Apunta DATABASE_URL a un PostgreSQL de usar y tirar.',
    );
  }
}

// Y una segunda condición: que el nombre de la base diga que es de pruebas.
if (!/\/(academiavanza_test|test|pruebas)(\?|$)/.test(url)) {
  throw new Error(
    'La base de datos no se llama «academiavanza_test», «test» ni «pruebas».\n' +
      'Estas pruebas la vacían, así que sólo corren contra una que lo diga en ' +
      'el nombre.',
  );
}

/*
 * El secreto de los enlaces del panel, que no protege nada aquí pero tiene que
 * estar.
 *
 * Casi cualquier flujo acaba mandándole un correo al profesor, y ese correo
 * lleva el enlace de su panel. Derivarlo exige `ACCESO_SECRET`, y sin él el
 * código lanza un error a propósito antes que inventarse un valor por defecto.
 *
 * El problema es dónde acaba ese error. La creación de una solicitud está
 * envuelta en un `try` que devuelve `{ ok: false, motivo: 'error' }` sin más, así
 * que una variable de entorno que falta se lee como diez pruebas que fallan
 * diciendo «no creada». Esta comprobación existe para que se lea lo que pasa de
 * verdad, en la primera línea y una sola vez.
 */
if ((process.env.ACCESO_SECRET ?? '').length < 32) {
  throw new Error(
    'Falta ACCESO_SECRET, o tiene menos de 32 caracteres.\n\n' +
      'Es lo que deriva el enlace del panel de cada profesor, y casi todos ' +
      'los flujos mandan un correo que lo lleva dentro.\n\n' +
      'En local, cualquier cadena larga vale:\n' +
      '  ACCESO_SECRET=secreto-de-pruebas-que-no-abre-nada-0123456789\n\n' +
      'En el CI está en el bloque «env» de .github/workflows/ci.yml.',
  );
}
