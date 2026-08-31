import { describe, expect, it } from 'vitest';
import {
  CAMPO_INICIO,
  CAMPO_TRAMPA,
  etiquetaDeSospecha,
} from '../../src/shared/schemas/trampa-bots';

/**
 * Las dos señales que hacen sospechar de un envío.
 *
 * Se prueban aquí y no contra la base de datos porque son lo único de los
 * límites que es una función pura, mirar dos campos de un formulario y
 * responder.
 *
 * Conviene tener presente qué se está probando exactamente. Esta función **ya
 * no rechaza nada**: devuelve una etiqueta que se guarda junto al envío y sale
 * en el panel, y quien decide es quien revisa. Que no rechace lo vigila
 * `nada-se-descarta-en-silencio.test.ts`; lo que se fija aquí es que la
 * etiqueta se ponga cuando toca y no se ponga a gente normal, porque una
 * marca sobre una profesora real es hacer desconfiar de ella sin motivo.
 */

/** Un FormData de mentira, con lo justo para lo que mira `etiquetaDeSospecha`. */
function formulario(campos: Record<string, string>) {
  return {
    get: (campo: string) => campos[campo] ?? null,
  };
}

const HACE_DIEZ_SEGUNDOS = String(Date.now() - 10_000);
const HACE_UN_INSTANTE = String(Date.now() - 100);

describe('el campo señuelo', () => {
  /*
   * El señuelo por sí solo no marca nada, y estas pruebas cambiaron con él.
   *
   * Antes bastaba con encontrarlo relleno. Se descubrió que quien lo rellenaba
   * no eran guiones sino el autorrelleno del navegador (el campo se llamaba
   * `apellido2`, y Chrome lo reconocía como «segundo apellido»), y que a esa
   * gente se le tiraba el alta enseñándole «Ficha recibida».
   *
   * Ahora hacen falta las dos señales a la vez para marcar. Estas pruebas fijan
   * justo eso, porque es la línea entre señalar a un guion y señalar a una
   * persona.
   */
  it('con tiempo humano detrás no marca nada, porque es el autorrelleno', () => {
    expect(
      etiquetaDeSospecha(
        formulario({
          [CAMPO_TRAMPA]: 'lo que sea',
          [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS,
        }),
      ),
    ).toBeNull();
  });

  it('relleno y enviado al instante sí se marca', () => {
    expect(
      etiquetaDeSospecha(
        formulario({
          [CAMPO_TRAMPA]: 'lo que sea',
          [CAMPO_INICIO]: HACE_UN_INSTANTE,
        }),
      ),
    ).toBe('trampa');
  });

  it('unos espacios y una letra tampoco bastan por sí solos', () => {
    expect(
      etiquetaDeSospecha(
        formulario({ [CAMPO_TRAMPA]: '  x ', [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS }),
      ),
    ).toBeNull();
  });

  it('no marca si viene vacío, que es lo normal', () => {
    expect(
      etiquetaDeSospecha(formulario({ [CAMPO_TRAMPA]: '', [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS })),
    ).toBeNull();
  });

  it('no salta si sólo trae espacios: eso lo hace un navegador, no un guion', () => {
    expect(
      etiquetaDeSospecha(formulario({ [CAMPO_TRAMPA]: '   ', [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS })),
    ).toBeNull();
  });
});

describe('el reloj', () => {
  it('salta si se envía en menos de tres segundos', () => {
    expect(etiquetaDeSospecha(formulario({ [CAMPO_INICIO]: HACE_UN_INSTANTE }))).toBe(
      'demasiado-rapido',
    );
  });

  it('no salta pasados diez segundos', () => {
    expect(etiquetaDeSospecha(formulario({ [CAMPO_INICIO]: HACE_DIEZ_SEGUNDOS }))).toBeNull();
  });

  // Falla del lado seguro. Es preferible no enterarse de un guion que colgarle
  // una etiqueta a una persona con un navegador raro o sin JavaScript.
  it('no marca a nadie si falta la hora de inicio', () => {
    expect(etiquetaDeSospecha(formulario({}))).toBeNull();
  });

  it('no marca a nadie si la hora de inicio es basura', () => {
    expect(etiquetaDeSospecha(formulario({ [CAMPO_INICIO]: 'ayer' }))).toBeNull();
    expect(etiquetaDeSospecha(formulario({ [CAMPO_INICIO]: '0' }))).toBeNull();
    expect(etiquetaDeSospecha(formulario({ [CAMPO_INICIO]: '-5' }))).toBeNull();
  });
});

describe('el orden de las dos señales', () => {
  it('el señuelo manda sobre el reloj', () => {
    // Si un guion cae en las dos, interesa saber que cayó en el señuelo: es la
    // señal inequívoca, y el reloj tiene falsos positivos posibles.
    expect(
      etiquetaDeSospecha(
        formulario({ [CAMPO_TRAMPA]: 'x', [CAMPO_INICIO]: HACE_UN_INSTANTE }),
      ),
    ).toBe('trampa');
  });
});
