import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Ningún texto de la web lleva guiones largos como inciso.
 *
 * El guión largo entre comas, abriendo y cerrando, es correcto en castellano,
 * pero se ha convertido en la marca de fábrica del texto escrito por una
 * máquina. Quien lo ve encima de una web que le pide el teléfono de su hija,
 * desconfía. Y tiene razón en desconfiar.
 *
 * Da igual que la frase sea buena: aquí el coste no es de estilo, es de
 * credibilidad. Se escribe con comas, con paréntesis o con dos puntos, que
 * dicen exactamente lo mismo y no levantan la sospecha.
 *
 * **Lo que sí se permite**, y por eso la prueba no es un simple «buscar y
 * fallar»:
 *
 * - El guión entre comillas, `'—'`, que es el hueco vacío de una tabla: un
 *   profesor sin colegio puesto, una solicitud sin curso. Ahí no es puntuación,
 *   es un símbolo que significa «no hay dato», y dejarlo en blanco haría que
 *   una fila incompleta pareciera un fallo de la página.
 * - Los comentarios del código, que no los lee ninguna familia.
 *
 * La regla es fácil de recordar: **entre comillas y solo, vale; suelto dentro
 * de una frase, no.**
 */

const RAIZ = join(import.meta.dirname, '..', '..');
const FUENTES = join(RAIZ, 'src');

/** Vacía comentarios de bloque y de línea, conservando el número de líneas. */
function sinComentarios(codigo: string): string {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
    .replace(/^\s*\/\/.*$/gm, '');
}

/**
 * El hueco vacío, en las dos formas en que aparece.
 *
 * Se borra antes de buscar. Nada más: si después de quitar esto sigue habiendo
 * un guión largo, es puntuación dentro de una frase.
 */
const HUECO_VACIO = /'—'|<option value="">—<\/option>/g;

/**
 * Recorre `src/` a mano en vez de usar `glob`.
 *
 * `fs.promises.glob` existe en Node 22, pero los tipos instalados son de la 20
 * y `tsc` lo rechaza. Doce líneas de recorrido evitan tanto la dependencia como
 * el desajuste de versiones.
 */
function ficherosDeTexto(carpeta: string = FUENTES): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...ficherosDeTexto(ruta));
    } else if (/\.tsx?$/.test(entrada.name)) {
      encontrados.push(ruta);
    }
  }

  return encontrados;
}

describe('⭐ ningún texto lleva guiones largos de inciso', () => {
  it('hay ficheros que revisar', () => {
    // Sin esto, un error al listar ficheros haría que la prueba pasara
    // revisando cero ficheros, que es la peor forma de pasar.
    expect(ficherosDeTexto().length).toBeGreaterThan(50);
  });

  it('ni en las páginas, ni en los formularios, ni en los correos', () => {
    const encontrados: string[] = [];

    for (const ruta of ficherosDeTexto()) {
      const lineas = sinComentarios(readFileSync(ruta, 'utf8')).split('\n');

      lineas.forEach((linea, i) => {
        if (!linea.includes('—')) return;
        if (!linea.replace(HUECO_VACIO, '').includes('—')) return;
        encontrados.push(`${relative(RAIZ, ruta)}:${i + 1}: ${linea.trim()}`);
      });
    }

    expect(
      encontrados,
      `Guiones largos usados como inciso. Se cambian por comas, paréntesis o dos puntos:\n${encontrados.join('\n')}`,
    ).toEqual([]);
  });
});
