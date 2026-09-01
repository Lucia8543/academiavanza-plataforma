import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { euros, porHora } from '../../src/shared/textos/precios';

/**
 * Los importes se escriben en un solo sitio.
 *
 * Esta prueba nace de un fallo que estuvo meses a la vista sin que nadie lo
 * viera. En `shared/textos/precios.ts` se decidió, con su comentario y su
 * razón, que los precios se enseñan sin céntimos: «15 €» y no «15,00 €». Y
 * mientras tanto nueve pantallas se habían escrito su propia copia de la misma
 * función, todas sin esa línea. El resultado es que el único sitio donde la
 * regla estaba escrita era justo el único que casi nadie usaba, y la portada,
 * el directorio, las dos guías, el panel de cobros y los correos enseñaban
 * «10,00 €».
 *
 * Lo cazó el padre de Lucía mirando la web como la miraría un padre cualquiera.
 * No lo cazó ninguna de las trescientas y pico pruebas que había, porque todas
 * comprobaban lo que hace el código y ninguna comprobaba **cuántas veces está
 * escrito lo mismo**.
 *
 * Así que la regla es de sitio, no de resultado: fuera de `precios.ts`, nadie
 * construye un formato de moneda. Si algún día hace falta otro distinto, se
 * añade ahí con su nombre y se importa.
 */

const RAIZ = join(import.meta.dirname, '..', '..');
const FUENTES = join(RAIZ, 'src');

/** El único fichero donde se permite montar un formateador de moneda. */
const PERMITIDO = join('src', 'shared', 'textos', 'precios.ts');

/**
 * El espacio que separa la cifra del € no es uno normal: `Intl` mete un espacio
 * duro para que la línea no se parta en mitad del importe. Se cambia por uno
 * corriente antes de comparar, porque si no las pruebas fallan por un carácter
 * que no se ve y se pierde media tarde buscándolo.
 */
const llano = (texto: string) => texto.replace(/ /g, ' ');

function ficheros(carpeta: string = FUENTES): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...ficheros(ruta));
    } else if (/\.tsx?$/.test(entrada.name)) {
      encontrados.push(ruta);
    }
  }

  return encontrados;
}

describe('⭐ un solo formato de euros en toda la web', () => {
  it('hay ficheros que revisar', () => {
    // Un fallo al listar haría que la prueba pasara revisando cero ficheros,
    // que es la peor forma de pasar.
    expect(ficheros().length).toBeGreaterThan(50);
  });

  it('nadie más se monta su propio formateador de moneda', () => {
    const culpables: string[] = [];

    for (const ruta of ficheros()) {
      const corta = relative(RAIZ, ruta);
      if (corta === PERMITIDO) continue;

      // Se busca la moneda y no `Intl.NumberFormat` a secas: formatear un
      // número de clases o de colegios no tiene nada que ver con esto.
      if (/currency\s*:\s*'EUR'/.test(readFileSync(ruta, 'utf8'))) {
        culpables.push(corta);
      }
    }

    expect(
      culpables,
      'Estos ficheros formatean euros por su cuenta, así que se saltan la ' +
        'regla de los céntimos. Se importa `euros` de shared/textos/precios:\n' +
        culpables.join('\n'),
    ).toEqual([]);
  });

  it('los importes redondos van sin céntimos', () => {
    expect(llano(euros(10))).toBe('10 €');
    expect(llano(euros(15))).toBe('15 €');
    expect(llano(porHora(16))).toBe('16 €/h');
  });

  it('pero los que tienen céntimos los enseñan enteros', () => {
    // Si el precio del contacto se pusiera a 9,50 desde el panel, redondear a
    // «10 €» sería cobrar una cosa y anunciar otra.
    expect(llano(euros(9.5))).toBe('9,50 €');
    expect(llano(euros(12.05))).toBe('12,05 €');
  });
});
