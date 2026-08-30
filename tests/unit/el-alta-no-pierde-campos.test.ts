import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El alta no puede perder por el camino un campo que el formulario sí envía.
 *
 * Esta prueba nace de un fallo concreto y silencioso. Se añadió al alta la
 * pregunta de cuánto hueco le queda al profesor. Estaba en el formulario, en la
 * validación y en la escritura a la base de datos, pero **faltaba en el paso de
 * en medio**: la función que convierte lo enviado en un objeto no copiaba
 * `cupo`. Llegaba vacío, el valor por defecto lo ponía en «busco alumnos», y
 * una profesora que había marcado «no tengo más hueco» apareció publicada como
 * disponible.
 *
 * Lo peor no fue el fallo, sino que **no se notó**. No hubo error, ni aviso, ni
 * nada rojo en ninguna pantalla. El dato simplemente no llegó, y sólo se
 * descubrió porque ella se dio cuenta y avisó.
 *
 * Ni los tipos ni la validación pueden detectarlo, porque el campo tiene valor
 * por defecto y un objeto al que le falta es un objeto perfectamente válido.
 * Por eso se compara el formulario con la función, que es lo único que ve el
 * hueco.
 *
 * Se leen los dos ficheros como texto en vez de mirar por dentro el esquema de
 * validación. Es más tosco, pero comprueba justo el tramo donde estuvo el
 * fallo, y no se rompe cada vez que la librería de validación cambia de versión
 * y mueve sus interioridades de sitio.
 */

const RAIZ = join(import.meta.dirname, '..', '..');

const FORMULARIO = readFileSync(
  join(RAIZ, 'src/frontend/features/portal-profesor/formulario-registro.tsx'),
  'utf8',
);

const ACCION = readFileSync(join(RAIZ, 'src/app/registro/acciones.ts'), 'utf8');

/**
 * Campos que el formulario manda y la acción no tiene por qué copiar, con su
 * motivo. Cualquier otro que aparezca es un descuido.
 */
const NO_SE_COPIAN: Record<string, string> = {
  // Trampa para robots. La comprueba `oler()` antes de nada y no es un dato del
  // profesor, así que no forma parte del objeto que se valida.
  empresa: 'campo trampa',
  web: 'campo trampa',
  apodo: 'campo trampa',
};

/** Los `name="..."` de todo lo que el formulario envía. */
const enviados = [
  ...new Set(
    [...FORMULARIO.matchAll(/name="([a-zA-Z]+)"/g)].map((m) => m[1]),
  ),
].filter((c) => !(c in NO_SE_COPIAN));

describe('⭐ el alta copia todos los campos del formulario', () => {
  it('el formulario envía los campos que esperamos', () => {
    // Si esto falla, o alguien renombró medio formulario o la expresión ya no
    // encuentra nada, y entonces el resto de la prueba estaría pasando en vacío.
    expect(enviados.length).toBeGreaterThan(12);
    expect(enviados).toContain('cupo');
    expect(enviados).toContain('aceptaPublicacion');
  });

  it.each(enviados)('«%s» se copia en registro/acciones.ts', (campo) => {
    expect(
      new RegExp(`\\b${campo}\\b`).test(ACCION),
      `El formulario de alta envía «${campo}», pero ese campo no aparece en ` +
        `src/app/registro/acciones.ts. Si no se copia ahí, se pierde en ` +
        `silencio: no da error, se queda con el valor por defecto, y nadie se ` +
        `entera hasta que alguien lo nota por su cuenta.`,
    ).toBe(true);
  });
});
