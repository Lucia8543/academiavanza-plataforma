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
 * Todas salieron de la segunda vuelta de QA, que las localizó una a una con
 * fichero y línea. No son inventadas: son exactamente las que había.
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
];

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
