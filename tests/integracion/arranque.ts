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
