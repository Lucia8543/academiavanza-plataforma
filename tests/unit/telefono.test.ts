import { describe, expect, it } from 'vitest';
import {
  formatearTelefono,
  normalizarTelefono,
  telefonoEspanol,
} from '../../src/shared/schemas/telefono';

/**
 * El teléfono es el dato más importante del sistema: es lo que compra una
 * familia y lo único que tiene un profesor para localizarla.
 *
 * Dos cosas tienen que cumplirse siempre. Que el mismo número escrito de seis
 * maneras distintas se guarde igual —si no, los límites contra el abuso, que
 * cuentan por teléfono, no cuentan nada—. Y que no se rechace a nadie por
 * escribirlo con espacios.
 */

describe('normalizar', () => {
  const mismasCosas = [
    '600123456',
    '600 123 456',
    '600-123-456',
    '+34600123456',
    '+34 600 123 456',
    '0034600123456',
    '(600) 123 456',
    '600.123.456',
    '  600123456  ',
  ];

  for (const escrito of mismasCosas) {
    it(`«${escrito}» se guarda como 600123456`, () => {
      expect(normalizarTelefono(escrito.trim())).toBe('600123456');
    });
  }
});

describe('validar', () => {
  const validos = ['600123456', '712345678', '911234567', '+34 600 123 456'];
  const invalidos = [
    '',
    '12345',
    '500123456', // no empieza por 6, 7, 8 ni 9
    '6001234567', // una cifra de más
    '60012345', // una cifra de menos
    'seiscientos',
    '600 123 45a',
  ];

  for (const t of validos) {
    it(`acepta ${t}`, () => {
      expect(telefonoEspanol.safeParse(t).success).toBe(true);
    });
  }

  for (const t of invalidos) {
    it(`rechaza «${t}»`, () => {
      expect(telefonoEspanol.safeParse(t).success).toBe(false);
    });
  }
});

describe('formatear', () => {
  it('agrupa de tres en tres para poder leerlo', () => {
    expect(formatearTelefono('600123456')).toBe('600 123 456');
  });

  it('quita el prefijo antes de agrupar', () => {
    expect(formatearTelefono('+34600123456')).toBe('600 123 456');
  });

  it('deja en paz lo que no sea un teléfono', () => {
    expect(formatearTelefono('')).toBe('');
    expect(formatearTelefono('no es un numero')).toBe('no es un numero');
  });
});
