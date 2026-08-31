import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CAMPO_TRAMPA,
  esSospechaConocida,
  EXPLICACION_SOSPECHA,
  type Sospecha,
} from '../../src/shared/schemas/trampa-bots';

/**
 * La regla que costó fichas de profesoras reales, escrita como prueba.
 *
 * Durante meses, el detector antibots no marcaba envíos sospechosos sino que
 * los borraba, y a quien los había mandado le enseñaba «Ficha recibida». Sin
 * fila, sin correo y sin registro. El campo señuelo se llamaba `apellido2` y el
 * autorrelleno de Chrome lo completaba solo, así que las que caían no eran
 * guiones automáticos sino personas con el móvil.
 *
 * Se arregló cambiando el nombre del campo, y eso era el síntoma. El fallo de
 * fondo era el diseño: **una decisión automática, irreversible e invisible
 * sobre algo que no se puede recuperar.**
 *
 * Estas pruebas no comprueban que el detector acierte. Comprueban que su
 * respuesta no se use nunca para no guardar algo, que es lo que de verdad hay
 * que impedir. Leen el código como texto, igual que las de datos sensibles,
 * porque lo que se vigila no es el resultado de una función sino una forma de
 * escribir que ya salió cara una vez.
 */

const RAIZ = join(import.meta.dirname, '..', '..');

/** Los ficheros que reciben un formulario del público y pueden guardarlo. */
const PUERTAS_DE_ENTRADA = [
  'src/app/registro/acciones.ts',
  'src/app/profesor/[slug]/acciones.ts',
  'src/app/buzon/acciones.ts',
];

function leer(ruta: string): string {
  return readFileSync(join(RAIZ, ruta), 'utf8');
}

describe('⭐ la sospecha no puede impedir que algo se guarde', () => {
  it.each(PUERTAS_DE_ENTRADA)('%s no corta el paso por sospecha', (ruta) => {
    const lineas = leer(ruta).split('\n');

    lineas.forEach((linea, i) => {
      // Un `if` que pregunta directamente por el detector es la forma corta de
      // volver al fallo de antes: `if (etiquetaDeSospecha(f)) return`.
      expect(
        /if\s*\(\s*!?\s*etiquetaDeSospecha\s*\(/.test(linea),
        `${ruta}:${i + 1} · la sospecha no se pregunta dentro de un «if». ` +
          'Guárdala en una variable y pásala como un dato más.',
      ).toBe(false);

      // Y la forma larga: `if (sospecha) { ... return ... }`. Se miran las seis
      // líneas siguientes, que es de sobra para cualquier bloque de éstos.
      if (/if\s*\(\s*!?\s*sospecha\s*\)/.test(linea)) {
        const bloque = lineas.slice(i, i + 6).join('\n');
        expect(
          /\b(return|redirect|notFound)\b/.test(bloque),
          `${ruta}:${i + 1} · este «if (sospecha)» corta el recorrido. ` +
            'La sospecha se guarda y se enseña en el panel; no decide nada.',
        ).toBe(false);
      }
    });
  });

  it('las tres puertas de entrada siguen mirando el formulario', () => {
    // Si alguien quitara la llamada entera creyendo que sobra, dejaríamos de
    // marcar nada y esta prueba de arriba pasaría por vacío.
    for (const ruta of PUERTAS_DE_ENTRADA) {
      expect(leer(ruta), ruta).toContain('etiquetaDeSospecha(');
    }
  });

  it('la sospecha llega hasta la fila que se guarda', () => {
    // Marcar sin guardar la marca sería peor que no marcar: daría la impresión
    // de que el panel avisa cuando en realidad no tiene el dato.
    expect(leer('src/backend/services/registro-profesor.ts')).toContain(
      'sospecha_bot: sospecha',
    );
    expect(leer('src/backend/services/solicitud.ts')).toContain(
      'sospecha_bot: sospecha',
    );
    expect(leer('src/backend/services/incidencias.ts')).toContain(
      'sospecha_bot: datos.sospecha',
    );
  });
});

describe('el código y la base de datos dicen lo mismo', () => {
  it('la migración acepta exactamente las etiquetas que existen', () => {
    /*
     * La columna tiene una restricción con la lista de valores válidos escrita
     * a mano. Si alguien añade una tercera etiqueta en TypeScript y no pasa por
     * una migración, las filas con esa etiqueta se rechazarían al guardarlas, y
     * eso volvería a perder envíos: exactamente lo que este cambio venía a
     * evitar.
     */
    const sql = leer('database/v1/25_sospecha_en_vez_de_descarte.sql');

    for (const etiqueta of Object.keys(EXPLICACION_SOSPECHA)) {
      expect(sql, `falta «${etiqueta}» en la migración 25`).toContain(
        `'${etiqueta}'`,
      );
    }
  });

  it('toda etiqueta posible tiene una explicación para el panel', () => {
    const posibles: Exclude<Sospecha, null>[] = ['trampa', 'demasiado-rapido'];
    for (const e of posibles) {
      expect(EXPLICACION_SOSPECHA[e].titulo.length).toBeGreaterThan(0);
      expect(EXPLICACION_SOSPECHA[e].texto.length).toBeGreaterThan(0);
    }
  });

  it('lo que venga raro de la base de datos no se enseña', () => {
    // El panel lee un texto libre. Sin este filtro, una fila con un valor
    // inesperado buscaría una explicación que no existe y tiraría la pantalla
    // entera del panel por un aviso que es sólo informativo.
    expect(esSospechaConocida('trampa')).toBe(true);
    expect(esSospechaConocida('demasiado-rapido')).toBe(true);
    expect(esSospechaConocida(null)).toBe(false);
    expect(esSospechaConocida(undefined)).toBe(false);
    expect(esSospechaConocida('')).toBe(false);
    expect(esSospechaConocida('lo-que-sea')).toBe(false);
  });
});

describe('el señuelo no puede parecerse a un campo de verdad', () => {
  it('no lleva ninguna palabra que reconozca un autorrelleno', () => {
    /*
     * Se llamaba `apellido2`, y ése fue el error entero. El autorrelleno de
     * Chrome y los gestores de contraseñas reconocen nombres de campo por
     * palabras conocidas y los completan sin preguntar.
     *
     * Esta lista no es exhaustiva y no puede serlo. Está para que, si alguien
     * vuelve a intentar que el señuelo «parezca de verdad» para despistar,
     * choque con una prueba que le cuenta por qué eso es justo lo contrario de
     * lo que hay que hacer.
     */
    const PELIGROSAS = [
      'apellido', 'nombre', 'email', 'correo', 'telefono', 'movil',
      'direccion', 'calle', 'ciudad', 'postal', 'pais', 'empresa',
      'usuario', 'user', 'name', 'phone', 'address', 'company', 'dni',
    ];

    for (const palabra of PELIGROSAS) {
      expect(
        String(CAMPO_TRAMPA).toLowerCase().includes(palabra),
        `el campo señuelo se llama «${CAMPO_TRAMPA}» y contiene «${palabra}», ` +
          'que es de los que rellena solo el navegador',
      ).toBe(false);
    }
  });
});
