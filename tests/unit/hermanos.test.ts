import { describe, expect, it } from 'vitest';
import {
  CUANTOS_ALUMNOS,
  cuantosEnPalabras,
  MAXIMO_HERMANOS,
  UN_CONTACTO_AUNQUE_SEAN_VARIOS,
} from '@/shared/textos/hermanos';
import { esquemaContacto } from '@/shared/schemas/contacto';

/**
 * Los hermanos en una solicitud.
 *
 * Lo que se prueba aquí no es el formulario, es la regla que lo sostiene: que
 * una familia con dos hijos paga **un** contacto, y que decir «me vale con que
 * coja a uno» sólo significa algo cuando hay más de uno.
 */

const BASE = {
  nombreFamilia: 'Familia de prueba',
  telefono: '600000099',
  email: 'prueba@ejemplo.invalid',
  nivelId: 'nivel-1',
  esTutorLegal: true,
  aceptaPrivacidad: true,
};

describe('el vocabulario', () => {
  it('la lista de opciones llega hasta el tope y no lo pasa', () => {
    expect(CUANTOS_ALUMNOS).toHaveLength(MAXIMO_HERMANOS);
    expect(CUANTOS_ALUMNOS.at(-1)?.valor).toBe(MAXIMO_HERMANOS);
  });

  /*
   * Con un alumno no se dice nada, y es a propósito.
   *
   * Quien lee esto es el profesor, y en el caso normal —que sigue siendo el de
   * siempre— una línea diciendo que hay un alumno no le informa de nada y le
   * hace leer más. La pantalla omite la línea entera cuando esto viene vacío.
   */
  it('con un alumno no dice nada', () => {
    expect(cuantosEnPalabras(1)).toBe('');
  });

  it('con dos y con tres sí', () => {
    expect(cuantosEnPalabras(2)).toBe('Dos hermanos');
    expect(cuantosEnPalabras(3)).toBe('Tres hermanos');
  });

  // La frase que faltaba el día que esto se rompió. Si alguien la suaviza hasta
  // que deje de decir lo esencial, que sea a propósito.
  it('la frase del precio dice que se paga una sola vez', () => {
    expect(UN_CONTACTO_AUNQUE_SEAN_VARIOS).toContain('una sola vez');
  });
});

describe('⭐ «me vale con uno» sólo existe si hay hermanos', () => {
  /*
   * El caso que motiva la regla: la madre marca dos hermanos, marca que le vale
   * con uno, y luego vuelve a poner un alumno. La casilla ya no se ve, pero su
   * respuesta podría seguir viajando. Si se guardara, el profesor vería tres
   * botones para elegir entre un solo alumno.
   *
   * Se apaga en el esquema y no en la pantalla porque lo que llega al servidor
   * no tiene por qué venir de la pantalla.
   */
  it('con un solo alumno se apaga aunque venga marcado', () => {
    const r = esquemaContacto.safeParse({
      ...BASE,
      hermanos: [],
      valeConUno: true,
    });

    expect(r.success).toBe(true);
    expect(r.success && r.data.valeConUno).toBe(false);
  });

  it('con hermanos se respeta lo que dijo', () => {
    const r = esquemaContacto.safeParse({
      ...BASE,
      hermanos: [{ nivelId: 'nivel-2', horasSemana: '2' }],
      valeConUno: true,
    });

    expect(r.success).toBe(true);
    expect(r.success && r.data.valeConUno).toBe(true);
  });
});

describe('los hermanos que se admiten', () => {
  it('sin hermanos es lo normal y vale', () => {
    const r = esquemaContacto.safeParse(BASE);
    expect(r.success).toBe(true);
    expect(r.success && r.data.hermanos).toEqual([]);
  });

  it('cada hermano necesita curso, porque es lo primero que se pregunta', () => {
    const r = esquemaContacto.safeParse({
      ...BASE,
      hermanos: [{ nivelId: '', horasSemana: '2' }],
    });
    expect(r.success).toBe(false);
  });

  it('las horas del hermano sí pueden faltar', () => {
    const r = esquemaContacto.safeParse({
      ...BASE,
      hermanos: [{ nivelId: 'nivel-2' }],
    });
    expect(r.success).toBe(true);
    expect(r.success && r.data.hermanos[0]?.horasSemana).toBe('');
  });

  it('más de dos hermanos no se aceptan, que con el primero son tres', () => {
    const r = esquemaContacto.safeParse({
      ...BASE,
      hermanos: [
        { nivelId: 'a', horasSemana: '1' },
        { nivelId: 'b', horasSemana: '1' },
        { nivelId: 'c', horasSemana: '1' },
      ],
    });
    expect(r.success).toBe(false);
  });
});
