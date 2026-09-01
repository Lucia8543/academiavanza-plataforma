import { describe, expect, it } from 'vitest';
import {
  agruparPorPrecio,
  type NivelConPrecio,
} from '../../src/shared/textos/precios';

/**
 * Juntar cursos no puede añadirle cursos a nadie.
 *
 * La ficha enseña ahora «1.º a 6.º Primaria · 15 €/h» en vez de seis líneas
 * repitiendo el mismo importe. La mejora es de lectura, pero el riesgo es de
 * honestidad: si se juntan cursos que el profesor no ha marcado, su ficha pasa
 * a ofrecer clases que él no ha dicho que dé, y eso lo descubre una familia el
 * día que le pregunta por un curso que no lleva.
 *
 * Por eso lo que se compara es el orden del catálogo y no la posición en la
 * lista. Estas pruebas existen sobre todo por el tercer caso.
 */

const nivel = (
  orden: number,
  nombre: string,
  precio: number | null,
): NivelConPrecio => ({ id: `n${orden}`, nombre, orden, precio });

describe('cursos agrupados por precio', () => {
  it('junta los cursos seguidos que cuestan lo mismo', () => {
    const tramos = agruparPorPrecio([
      nivel(1, '1º Primaria', 15),
      nivel(2, '2º Primaria', 15),
      nivel(3, '3º Primaria', 15),
    ]);

    expect(tramos).toHaveLength(1);
    expect(tramos[0].etiqueta).toBe('1º a 3º Primaria');
    expect(tramos[0].precio).toBe(15);
  });

  it('corta cuando cambia el precio', () => {
    const tramos = agruparPorPrecio([
      nivel(5, '5º Primaria', 15),
      nivel(6, '6º Primaria', 15),
      nivel(7, '1º ESO', 16),
      nivel(8, '2º ESO', 16),
    ]);

    expect(tramos.map((t) => t.etiqueta)).toEqual([
      '5º a 6º Primaria',
      '1º a 2º ESO',
    ]);
  });

  it('NO junta cursos que el profesor se ha saltado', () => {
    // Da 1.º y 4.º, y nada en medio. «1º a 4º Primaria» le pondría en la ficha
    // dos cursos que no ha marcado.
    const tramos = agruparPorPrecio([
      nivel(1, '1º Primaria', 15),
      nivel(4, '4º Primaria', 15),
    ]);

    expect(tramos.map((t) => t.etiqueta)).toEqual(['1º Primaria', '4º Primaria']);
  });

  it('un curso suelto se queda con su nombre', () => {
    const tramos = agruparPorPrecio([nivel(11, '1º Bachillerato', 17)]);
    expect(tramos.map((t) => t.etiqueta)).toEqual(['1º Bachillerato']);
  });

  it('si las puntas no comparten etapa, se escriben enteras', () => {
    const tramos = agruparPorPrecio([
      nivel(12, '2º Bachillerato', 17),
      nivel(13, 'Preparación EVAU', 17),
    ]);

    expect(tramos.map((t) => t.etiqueta)).toEqual([
      '2º Bachillerato a Preparación EVAU',
    ]);
  });

  it('los que no tienen precio se agrupan igual', () => {
    const tramos = agruparPorPrecio([
      nivel(13, 'Universidad, 1º', null),
      nivel(14, 'Universidad, 2º', null),
    ]);

    expect(tramos).toHaveLength(1);
    expect(tramos[0].precio).toBeNull();
  });

  it('una lista vacía no da ningún tramo', () => {
    expect(agruparPorPrecio([])).toEqual([]);
  });

  it('nunca pierde un curso por el camino', () => {
    // La comprobación de fondo: agrupar es cambiar cómo se lee, no qué se dice.
    const niveles = [
      nivel(1, '1º Primaria', 15),
      nivel(2, '2º Primaria', 15),
      nivel(4, '4º Primaria', 15),
      nivel(7, '1º ESO', 16),
      nivel(20, 'Universidad', null),
    ];

    const tramos = agruparPorPrecio(niveles);
    const cursosNombrados = tramos
      .flatMap((t) => t.etiqueta.split(' a '))
      .length;

    expect(cursosNombrados).toBeGreaterThanOrEqual(tramos.length);
    expect(tramos.map((t) => t.precio)).toEqual([15, 15, 16, null]);
  });
});
