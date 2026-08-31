import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⭐ Que ningún texto vuelva a prometer el teléfono del profesor.
 *
 * El ADR 0008 dice que ese número no sale de la plataforma en ninguna dirección
 * ni en ningún estado. El código lo cumple, y las pruebas de integración lo
 * vigilan estado por estado.
 *
 * **Lo que no vigilaba nadie eran los textos.** Cuando se hizo el cambio, el
 * código dejó de entregar el teléfono el mismo día, y diez pantallas y correos
 * siguieron prometiéndolo durante una semana. Entre ellos el correo de «tu ficha
 * ya está publicada», que es con el que un profesor de dieciséis años decide
 * publicarla.
 *
 * Esa clase de fallo no la encuentra un tipo ni un test de comportamiento: la
 * frase compila igual de bien diga lo que diga. Sólo se encuentra leyendo, y
 * leerlo entero es justo lo que nadie va a repetir dentro de seis meses.
 *
 * Por eso esta prueba lee el código fuente como texto. Es poco ortodoxo y es
 * deliberado: **el riesgo aquí no es de comportamiento, es de redacción**, y hay
 * que ponerlo donde se comprueba solo.
 *
 * Si esta prueba te falla al escribir un texto nuevo, no la relajes: comprueba
 * primero si lo que has escrito es verdad.
 */

const RAIZ = join(process.cwd(), 'src');

/**
 * Las frases que no pueden volver.
 *
 * Las nueve primeras salieron de la segunda vuelta de QA, que las localizó una
 * a una con fichero y línea. No son inventadas: son exactamente las que había.
 *
 * **Las siguientes existen porque esta prueba se demostró insuficiente.** Era
 * una lista de nueve frases concretas, así que una promesa nueva escrita con
 * otras palabras pasaba sin que saltara nada. Y pasó: el mensaje de WhatsApp
 * del panel de cobros le decía a la familia «para que os paséis el teléfono»,
 * la prueba estaba en verde, y esa frase es exactamente lo que el ADR 0008
 * prohíbe prometer.
 *
 * De ahí la lección, que vale para cualquier lista negra: **no cubre lo que
 * nadie ha escrito todavía.** Cada vez que se encuentre una promesa nueva, lo
 * primero es añadirla aquí; y cada vez que se escriba un texto sobre teléfonos,
 * conviene mirar esta lista antes que después.
 */
const PROHIBIDAS: { patron: RegExp; porque: string }[] = [
  {
    patron: /el uno del otro/i,
    porque: 'promete un intercambio de teléfonos que ya no ocurre',
  },
  {
    patron: /abrir (los )?tel[eé]fonos/i,
    porque: 'no se «abren» dos teléfonos: sólo se entrega el de la familia',
  },
  {
    patron: /ver el tel[eé]fono del profesor/i,
    porque: 'la familia no ve el teléfono del profesor en ningún estado',
  },
  {
    patron: /aparece aqu[ií] el tel[eé]fono/i,
    porque: 'en la página de la familia no aparece ningún teléfono',
  },
  {
    patron: /cada uno ver[aá] el tel[eé]fono/i,
    porque: 'sólo lo ve uno de los dos, y siempre el mismo',
  },
  {
    patron: /tienen el tel[eé]fono el uno/i,
    porque: 'sólo lo tiene el profesor',
  },
  {
    patron: /s[oó]lo lo recibe una familia/i,
    porque: 'el teléfono del profesor no lo recibe ninguna familia',
  },
  {
    patron: /no se lo damos a nadie hasta/i,
    porque:
      'el «hasta» promete que llegará un momento en que sí. No llega nunca',
  },
  {
    patron: /ya tienes el tel[eé]fono de este profesor/i,
    porque: 'la familia no lo ha tenido nunca, ni de un contacto anterior',
  },

  // --- Las que se escaparon a las nueve de arriba -------------------------
  {
    patron: /os pas[eéaá]is/i,
    porque:
      'el «os» es un intercambio, y aquí sólo va un teléfono y en un sentido',
  },
  {
    // `\w` no cubre las vocales acentuadas, así que «intercambiáis» se colaba.
    // Es el mismo descuido que deja pasar media lengua: media conjugación
    // española lleva tilde.
    patron: /intercambi[a-záéíóúñ]* .{0,25}tel[eé]fono/i,
    porque: 'no hay intercambio: se entrega el de la familia y nada más',
  },
  {
    patron: /tendr[eé]is .{0,25}tel[eé]fono/i,
    porque: 'en plural promete que los dos lo tendrán, y no ocurre',
  },
  /*
   * Aquí había un patrón más, `te damos su (número|teléfono)`, y se ha quitado.
   *
   * La idea era cazar el «su» ambiguo, que dicho a una familia significaría el
   * teléfono del profesor. Pero saltó en cinco sitios donde el texto es
   * correcto, porque ahí el destinatario es el profesor y ese «su» es el de la
   * familia. Exactamente lo que el sistema hace.
   *
   * Una regla que marca cinco aciertos y ningún fallo no protege: enseña a
   * ignorarla, y una guarda que se ignora es peor que no tenerla. El «su» sólo
   * se puede juzgar sabiendo a quién se le habla, y eso una expresión regular
   * no lo ve.
   */
  {
    patron: /su tel[eé]fono para que le llames/i,
    porque: 'la familia no llama: la llaman a ella',
  },
  {
    patron: /pod[eé]is llamaros/i,
    porque: 'sólo puede llamar uno de los dos',
  },
];

/**
 * Frases de mentira, para comprobar que la guarda ve algo.
 *
 * Una prueba que recorre ficheros y no encuentra nada da exactamente el mismo
 * verde tanto si el código está limpio como si el barrido está roto. Estas
 * cadenas no están en ningún fichero: se le pasan a los patrones directamente,
 * y si alguna dejara de detectarse sabríamos que la lista ha dejado de servir.
 */
const DEBEN_SALTAR = [
  'Aquí tienes lo que falta para que os paséis el teléfono',
  'En cuanto pague, os intercambiáis el teléfono y quedáis',
  'Tendréis el teléfono los dos en cuanto esté confirmado',
  'Ya podéis llamaros cuando queráis',
];

/*
 * Sólo se barre `src/`, y es una decisión, no un descuido.
 *
 * Ahí está todo lo que lee una persona: las páginas, los formularios, los
 * correos y los textos compartidos. `database/seeds/` contiene nombres de
 * asignaturas y de colegios, que no prometen nada; y `public/` son el logotipo
 * y los iconos, que no llevan texto. Si algún día se añadiera contenido escrito
 * en cualquiera de las dos, hay que ampliar `RAIZ`.
 */

/** Todos los ficheros de código de `src/`, menos esta misma prueba. */
function ficheros(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return ficheros(ruta);
    return /\.(ts|tsx)$/.test(nombre) ? [ruta] : [];
  });
}

describe('⭐ ningún texto promete el teléfono del profesor', () => {
  const todos = ficheros(RAIZ);

  it('hay ficheros que revisar', () => {
    // Si un cambio de estructura dejara esto en cero, la prueba pasaría
    // siempre y no vigilaría nada. Es el fallo silencioso clásico de las
    // pruebas que leen ficheros.
    expect(todos.length).toBeGreaterThan(50);
  });

  it.each(DEBEN_SALTAR)('la guarda detecta «%s»', (frase) => {
    // Comprueba la lista, no el código. Si esto falla, el verde de las demás
    // pruebas de este fichero no significa nada.
    expect(PROHIBIDAS.some(({ patron }) => patron.test(frase))).toBe(true);
  });

  for (const { patron, porque } of PROHIBIDAS) {
    it(`no se dice «${patron.source}»: ${porque}`, () => {
      const encontrados: string[] = [];

      for (const ruta of todos) {
        const lineas = readFileSync(ruta, 'utf8').split('\n');
        lineas.forEach((linea, i) => {
          if (patron.test(linea)) {
            encontrados.push(`${relative(process.cwd(), ruta)}:${i + 1}`);
          }
        });
      }

      expect(encontrados, encontrados.join('\n')).toEqual([]);
    });
  }
});
