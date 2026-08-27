import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  esMotivoCierre,
  MOTIVOS_SIN_PAGAR,
  MOTIVOS_TRAS_HABLAR,
  MOTIVOS_VALIDOS,
  PARA_EL_PROFESOR,
  PARA_LA_FAMILIA,
  seLeCuentaAlProfesor,
  type MotivoCierre,
} from '../../src/shared/textos/motivos-cierre';

/**
 * El vocabulario de «por qué no siguió».
 *
 * Estas pruebas vigilan tres cosas que se rompen solas con el tiempo: que la
 * lista de aquí y la de la base de datos no se separen, que ningún motivo llegue
 * al profesor redactado como una acusación, y que lo que no debe verse siga sin
 * verse.
 */

describe('el vocabulario está completo', () => {
  it('todos los motivos tienen las dos redacciones', () => {
    for (const motivo of MOTIVOS_VALIDOS) {
      expect(PARA_LA_FAMILIA[motivo], `familia · ${motivo}`).toBeTruthy();
      expect(PARA_EL_PROFESOR[motivo], `profesor · ${motivo}`).toBeTruthy();
    }
  });

  it('las dos redacciones son distintas', () => {
    // Si coinciden es que alguien ha copiado una en la otra, y entonces el
    // profesor está leyendo una frase escrita en primera persona sobre él.
    for (const motivo of MOTIVOS_VALIDOS) {
      expect(PARA_EL_PROFESOR[motivo], motivo).not.toBe(PARA_LA_FAMILIA[motivo]);
    }
  });

  it('las listas que se ofrecen sólo contienen motivos válidos', () => {
    for (const motivo of [...MOTIVOS_TRAS_HABLAR, ...MOTIVOS_SIN_PAGAR]) {
      expect(esMotivoCierre(motivo), motivo).toBe(true);
    }
  });

  it('ninguna lista repite un motivo', () => {
    expect(new Set(MOTIVOS_TRAS_HABLAR).size).toBe(MOTIVOS_TRAS_HABLAR.length);
    expect(new Set(MOTIVOS_SIN_PAGAR).size).toBe(MOTIVOS_SIN_PAGAR.length);
  });
});

describe('lo que ve el profesor no le acusa', () => {
  it('ninguna frase le señala con un «tú»', () => {
    // El sujeto de estas frases es la familia, no él. «Le venía lejos» y «no
    // eras lo que buscaba» dicen lo mismo y no se leen igual.
    for (const motivo of MOTIVOS_VALIDOS) {
      const frase = PARA_EL_PROFESOR[motivo];
      expect(/\b(no eras|no diste|te falta|deberías|tu culpa)\b/i.test(frase), frase).toBe(
        false,
      );
    }
  });

  it('«no acabasteis de encajar» reparte y no culpa', () => {
    // Es el motivo que elige quien no quiere entrar en detalle, así que es el
    // que más se va a leer. Tiene que estar en segunda del plural.
    expect(PARA_EL_PROFESOR['no-encajamos']).toBe('No acabasteis de encajar');
  });
});

describe('lo que no se le cuenta al profesor', () => {
  it('el precio del contacto se queda dentro', () => {
    // Es una queja sobre lo que cobra la plataforma. No es suya y no puede
    // hacer nada con ella.
    expect(seLeCuentaAlProfesor('coste-contacto')).toBe(false);
  });

  it('todo lo demás sí se le cuenta', () => {
    for (const motivo of MOTIVOS_VALIDOS) {
      if (motivo === 'coste-contacto') continue;
      expect(seLeCuentaAlProfesor(motivo), motivo).toBe(true);
    }
  });

  it('el precio del contacto sólo se puede elegir sin haber pagado', () => {
    // Ofrecérselo a quien ya pagó no tendría sentido: ya pagó.
    expect(MOTIVOS_TRAS_HABLAR).not.toContain('coste-contacto');
    expect(MOTIVOS_SIN_PAGAR).toContain('coste-contacto');
  });
});

describe('quien ya ha hablado tiene una salida honesta', () => {
  it('puede decir que simplemente no encajaron', () => {
    // Sin esta opción, quien no quiere explicarse elige una al azar —y suele
    // ser el precio—, y el profesor recibe como un hecho algo que no pasó.
    expect(MOTIVOS_TRAS_HABLAR).toContain('no-encajamos');
  });

  it('no se le ofrece «no conseguí hablar con él», que es el otro botón', () => {
    expect(MOTIVOS_TRAS_HABLAR).not.toContain('sin-contacto');
  });
});

describe('la lista de aquí y la de PostgreSQL son la misma', () => {
  /*
   * Es la prueba que de verdad protege algo. Si alguien añade un motivo aquí y
   * se olvida de la migración, el formulario revienta al guardar; si lo añade
   * en la migración y no aquí, el panel del profesor enseña un hueco en blanco.
   * Ninguno de los dos fallos se ve hasta que le pasa a una familia real.
   */
  it('el CHECK de la migración 13 admite exactamente estos motivos', () => {
    const sql = readFileSync(
      join(process.cwd(), 'database/v1/13_motivo_del_cierre.sql'),
      'utf8',
    );

    const bloque = sql.match(
      /motivo_cierre IN \(([\s\S]*?)\)\s*\)/,
    )?.[1];

    expect(bloque, 'no se ha encontrado el CHECK en la migración').toBeTruthy();

    const enSql = [...(bloque as string).matchAll(/'([^']+)'/g)]
      .map((m) => m[1])
      .sort();

    expect(enSql).toEqual([...MOTIVOS_VALIDOS].sort());
  });
});

describe('esMotivoCierre no se cree lo que le llega de un formulario', () => {
  const basura = ['', '  ', 'PRECIO-CLASES', 'horarios ', 'porque-si', '__proto__'];

  for (const valor of basura) {
    it(`rechaza «${valor}»`, () => {
      expect(esMotivoCierre(valor)).toBe(false);
    });
  }

  it('acepta los buenos', () => {
    for (const motivo of MOTIVOS_VALIDOS) {
      expect(esMotivoCierre(motivo as MotivoCierre), motivo).toBe(true);
    }
  });
});
