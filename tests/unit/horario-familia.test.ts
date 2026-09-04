import { describe, expect, it } from 'vitest';
import {
  diasEnPalabras,
  horasEnPalabras,
  HORAS_SEMANA,
} from '@/shared/textos/horario-familia';

/**
 * Cómo se le dicen al profesor las horas y los días que pide una familia.
 *
 * Lo que vigila esto no es la ortografía de las frases, es que **un dato
 * guardado no deje de verse**. Las dos funciones devuelven cadena vacía cuando
 * no saben qué decir, y quien las llama omite la línea entera: un valor que no
 * reconocen no da error en ninguna parte, simplemente desaparece de la pantalla
 * del profesor. Es el mismo fallo silencioso que ya costó la zona y el cupo.
 */

describe('las horas en palabras', () => {
  it.each(HORAS_SEMANA.map((h) => h.valor))(
    'sabe decir «%s», que es de la lista actual',
    (valor) => {
      expect(horasEnPalabras(valor)).not.toBe('');
    },
  );

  /*
   * El que no está en la lista y tiene que seguir funcionando.
   *
   * Fue el tope hasta la migración 28 y hay filas guardadas con él. Si esto
   * falla, esas solicitudes pierden la línea de las horas en el panel de su
   * profesor sin que salte nada en ningún sitio.
   */
  it('sigue sabiendo decir el valor histórico «mas-de-3»', () => {
    expect(horasEnPalabras('mas-de-3')).toBe('Más de 3 horas');
  });

  it('llega hasta cinco, que es lo que pedía el caso de los hermanos', () => {
    expect(horasEnPalabras('4')).toBe('4 horas');
    expect(horasEnPalabras('5-o-mas')).toBe('5 horas o más');
  });

  it.each([null, undefined, '', 'lo-que-sea'])(
    'con «%s» devuelve vacío para que no se pinte la línea',
    (valor) => {
      expect(horasEnPalabras(valor)).toBe('');
    },
  );
});

describe('los días en palabras', () => {
  it('uno solo', () => {
    expect(diasEnPalabras([3])).toBe('Miércoles');
  });

  it('varios, con la conjunción al final y en minúscula', () => {
    expect(diasEnPalabras([1, 3, 5])).toBe('Lunes, miércoles y viernes');
  });

  it('los ordena, aunque lleguen desordenados', () => {
    expect(diasEnPalabras([5, 1, 3])).toBe('Lunes, miércoles y viernes');
  });

  // Enumerar los siete ocupa dos líneas para decir que da igual.
  it('los siete se dicen «cualquier día»', () => {
    expect(diasEnPalabras([1, 2, 3, 4, 5, 6, 7])).toBe('Cualquier día');
  });

  it.each([null, undefined])('con «%s» devuelve vacío', (dias) => {
    expect(diasEnPalabras(dias)).toBe('');
  });

  it('con la lista vacía devuelve vacío', () => {
    expect(diasEnPalabras([])).toBe('');
  });

  it('un número que no es un día no rompe nada ni inventa un nombre', () => {
    expect(diasEnPalabras([9])).toBe('');
    expect(diasEnPalabras([1, 9])).toBe('Lunes');
  });
});
