import { describe, expect, it } from 'vitest';
import { sugerirCorreo } from '../../src/shared/schemas/correo-erratas';

/**
 * El corrector de erratas de correo.
 *
 * Falla de dos maneras y las dos importan. Si no detecta «gmial.com», una
 * familia se queda sin enterarse de que la han aceptado y no paga. Si sugiere
 * corregir una dirección que estaba bien, siembra una duda donde no la había y
 * puede llevar a alguien a estropear un correo correcto.
 */

describe('detecta las erratas típicas', () => {
  const casos: [string, string][] = [
    ['ana@gmial.com', 'ana@gmail.com'],
    ['ana@gmai.com', 'ana@gmail.com'],
    ['ana@gmail.con', 'ana@gmail.com'],
    ['ana@gnail.com', 'ana@gmail.com'],
    ['ana@hotmial.com', 'ana@hotmail.com'],
    ['ana@hotmail.con', 'ana@hotmail.com'],
    ['ana@yaho.com', 'ana@yahoo.com'],
    ['ana@outlok.com', 'ana@outlook.com'],
    ['ana@iclod.com', 'ana@icloud.com'],
  ];

  for (const [mal, bien] of casos) {
    it(`${mal} → ${bien}`, () => {
      expect(sugerirCorreo(mal)).toBe(bien);
    });
  }

  it('no le importan las mayúsculas ni los espacios', () => {
    expect(sugerirCorreo('  Ana@GMIAL.com ')).toBe('ana@gmail.com');
  });

  it('conserva la parte de delante tal cual', () => {
    expect(sugerirCorreo('maria.jose+clases@gmial.com')).toBe(
      'maria.jose+clases@gmail.com',
    );
  });
});

describe('no toca lo que está bien', () => {
  const buenos = [
    'ana@gmail.com',
    'ana@hotmail.es',
    'ana@yahoo.es',
    'ana@icloud.com',
    'ana@uam.es',
    'ana@academiavanza.es',
    // Dominios raros pero legítimos: no se puede suponer que son erratas.
    'ana@correo-de-mi-empresa.com',
    'ana@ucm.es',
  ];

  for (const correo of buenos) {
    it(`deja en paz ${correo}`, () => {
      expect(sugerirCorreo(correo)).toBeNull();
    });
  }
});

describe('no se rompe con basura', () => {
  const basura = ['', '   ', 'sinarroba', '@gmial.com', 'ana@', 'ana@@gmial.com'];

  for (const entrada of basura) {
    it(`devuelve null con «${entrada}»`, () => {
      expect(sugerirCorreo(entrada)).toBeNull();
    });
  }
});
