import { describe, expect, it } from 'vitest';
import { oler, CAMPO_INICIO, CAMPO_TRAMPA } from '../../src/shared/schemas/trampa-bots';

/**
 * Las trampas para guiones automáticos.
 *
 * Se prueban aquí y no en la base de datos porque son lo único de los límites
 * que es una función pura: mirar dos campos de un formulario y decidir.
 *
 * El equilibrio que vigilan estas pruebas es el de siempre: que paren a un
 * guion sin parar a una persona. De las dos, la segunda es la que más duele,
 * porque una persona rechazada no vuelve y encima nadie se entera.
 */

/** Un FormData de mentira, con lo justo para lo que mira `oler`. */
function formulario(campos: Record<string, string>) {
  return {
    get: (campo: string) => campos[campo] ?? null,
  };
}

const HACE_DIEZ_SEGUNDOS = String(Date.now() - 10_000);
const HACE_UN_INSTANTE = String(Date.now() - 100);

describe('el campo señuelo', () => {
  it('salta si viene relleno', () => {
    expect(
      oler(
        formulario({
          [CAMPO_TRAMPA]: 'lo que sea',
          [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS,
        }),
      ),
    ).toBe('trampa');
  });

  it('salta aunque sólo traiga espacios y un carácter', () => {
    expect(
      oler(
        formulario({ [CAMPO_TRAMPA]: '  x ', [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS }),
      ),
    ).toBe('trampa');
  });

  it('no salta si viene vacío, que es lo normal', () => {
    expect(
      oler(formulario({ [CAMPO_TRAMPA]: '', [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS })),
    ).toBeNull();
  });

  it('no salta si sólo trae espacios: eso lo hace un navegador, no un guion', () => {
    expect(
      oler(formulario({ [CAMPO_TRAMPA]: '   ', [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS })),
    ).toBeNull();
  });
});

describe('el reloj', () => {
  it('salta si se envía en menos de tres segundos', () => {
    expect(oler(formulario({ [CAMPO_INICIO]: HACE_UN_INSTANTE }))).toBe(
      'demasiado-rapido',
    );
  });

  it('no salta pasados diez segundos', () => {
    expect(oler(formulario({ [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS }))).toBeNull();
  });

  // Falla del lado seguro: es preferible colar un guion a rechazar a una
  // persona con un navegador raro o con JavaScript desactivado.
  it('no rechaza a nadie si falta la marca de tiempo', () => {
    expect(oler(formulario({}))).toBeNull();
  });

  it('no rechaza a nadie si la marca de tiempo es basura', () => {
    expect(oler(formulario({ [CAMPO_INICIO]: 'ayer' }))).toBeNull();
    expect(oler(formulario({ [CAMPO_INICIO]: '0' }))).toBeNull();
    expect(oler(formulario({ [CAMPO_INICIO]: '-5' }))).toBeNull();
  });
});

describe('el orden de las dos trampas', () => {
  it('el señuelo manda sobre el reloj', () => {
    // Si un guion cae en las dos, interesa saber que cayó en el señuelo: es la
    // señal inequívoca, y el reloj tiene falsos positivos posibles.
    expect(
      oler(
        formulario({ [CAMPO_TRAMPA]: 'x', [CAMPO_INICIO]: HACE_UN_INSTANTE }),
      ),
    ).toBe('trampa');
  });
});
