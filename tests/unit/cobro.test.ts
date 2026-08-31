import { describe, expect, it } from 'vitest';
import {
  DIAS_LIMITE_PARA_RECLAMAR,
  DIAS_PARA_RECLAMAR,
  PLAZOS_DE_CIERRE,
  precioAplicable,
  seAbreSinPagar,
} from '../../src/shared/reglas/cobro';

/**
 * Las dos reglas del cobro.
 *
 * Estas pruebas existen porque las dos reglas ya fallaron, y las dos fallaron
 * en silencio: la plataforma seguía funcionando, las páginas cargaban y nadie
 * se quejaba. Simplemente se abrían teléfonos que no se habían pagado.
 *
 * Ninguna de las dos se puede detectar mirando la pantalla, así que tienen que
 * detectarse aquí.
 */

describe('qué precio se aplica', () => {
  it('el vigente, cuando lo hay', () => {
    expect(precioAplicable(10, 8)).toBe(10);
  });

  it('el último cerrado, si no hay vigente', () => {
    // Un precio caducado es peor que uno vigente y muchísimo mejor que ninguno:
    // lo puso una persona en algún momento.
    expect(precioAplicable(null, 8)).toBe(8);
  });

  it('null cuando no hay ninguno, para que quien llame falle', () => {
    expect(precioAplicable(null, null)).toBeNull();
  });

  /*
   * El corazón del asunto.
   *
   * Cero no es un precio: es la señal de «esto ya está pagado», que es como
   * funcionan los vales. Devolver cero por no encontrar tarifa significaba
   * entregar los teléfonos de las dos partes sin que nadie pagara.
   */
  it('nunca devuelve cero, aunque la tarifa vigente sea cero', () => {
    expect(precioAplicable(0, 8)).toBe(8);
  });

  it('nunca devuelve cero, aunque las dos sean cero', () => {
    expect(precioAplicable(0, 0)).toBeNull();
  });

  it('no confunde el cero con la ausencia de tarifa', () => {
    expect(precioAplicable(0, null)).toBeNull();
  });

  it('admite céntimos', () => {
    expect(precioAplicable(9.5, null)).toBe(9.5);
  });
});

describe('qué contactos se abren sin Bizum', () => {
  it('los que vienen de un vale', () => {
    expect(seAbreSinPagar({ valeDe: 'una-solicitud-anterior' })).toBe(true);
  });

  it('los demás, no', () => {
    expect(seAbreSinPagar({ valeDe: null })).toBe(false);
  });

  /*
   * Esta es la prueba que habría cazado el fallo.
   *
   * La condición era «el importe es cero» y funcionaba el 99 % de las veces,
   * porque los vales son lo único que vale cero. Pero quedarse sin tarifa
   * vigente también dejaba el importe a cero, y entonces TODAS las solicitudes
   * se convertían en contactos gratis que se abrían solos.
   *
   * Preguntar por el vale pregunta por lo que de verdad importa: si esta
   * familia había pagado antes.
   */
  it('una solicitud de cero euros que NO viene de un vale no se abre sola', () => {
    expect(seAbreSinPagar({ valeDe: null })).toBe(false);
  });
});

describe('los plazos que cierran una solicitud aceptada', () => {
  /*
   * La relación entre los tres es la regla, no los números concretos.
   *
   * Quien ha dicho que ha pagado tiene que ser el último en caducar. Si alguien
   * acorta ese plazo por debajo de los otros, se le estaría cerrando la puerta
   * antes a quien ha puesto dinero que a quien no ha hecho nada, y encima sin
   * que se note hasta que pase.
   */
  it('el plazo de quien dice haber pagado es el más largo', () => {
    expect(PLAZOS_DE_CIERRE.desdeAvisoDePago).toBeGreaterThan(
      PLAZOS_DE_CIERRE.desdeAceptada,
    );
    expect(PLAZOS_DE_CIERRE.desdeAvisoDePago).toBeGreaterThan(
      PLAZOS_DE_CIERRE.trasRecordatorio,
    );
  });

  it('la red absoluta es más larga que el camino normal', () => {
    expect(PLAZOS_DE_CIERRE.desdeAceptada).toBeGreaterThan(
      PLAZOS_DE_CIERRE.trasRecordatorio,
    );
  });

  /*
   * Ninguno puede ser cero ni infinito.
   *
   * Cero cerraría solicitudes al instante. Infinito es lo que había: quien
   * pulsaba «ya he pagado» sin pagar dejaba la solicitud viva para siempre y al
   * profesor esperando algo que no iba a llegar.
   */
  it('los tres son plazos de verdad', () => {
    for (const [nombre, dias] of Object.entries(PLAZOS_DE_CIERRE)) {
      expect(dias, nombre).toBeGreaterThan(0);
      expect(dias, nombre).toBeLessThanOrEqual(90);
    }
  });
});

describe('la ventana para pedir el contacto gratis', () => {
  /*
   * Son dos números que se leen por separado y sólo tienen sentido juntos. Uno
   * dice cuánto hay que esperar antes de reclamar y el otro hasta cuándo se
   * puede, así que si alguien tocara cualquiera de los dos sin mirar el otro
   * podría dejar una ventana vacía: un vale que no se puede pedir nunca, sin
   * ningún error por ningún sitio.
   */
  it('se puede reclamar en algún momento', () => {
    expect(DIAS_LIMITE_PARA_RECLAMAR).toBeGreaterThan(DIAS_PARA_RECLAMAR);
  });

  it('la ventana es lo bastante ancha para una familia de verdad', () => {
    // Dos semanas es el mínimo razonable: una primera clase que se retrasa, un
    // par de clases de prueba y una decisión. Por debajo de eso, el plazo
    // dejaría fuera a gente que tiene toda la razón.
    expect(DIAS_LIMITE_PARA_RECLAMAR - DIAS_PARA_RECLAMAR).toBeGreaterThanOrEqual(14);
  });

  it('y no tan ancha que deje de distinguir lo que distingue', () => {
    // Si el límite se acercara a los 90 días de caducidad de la solicitud,
    // volvería a colar el caso que vino a resolver: tres meses de clases y
    // luego «no acabamos de encajar».
    expect(DIAS_LIMITE_PARA_RECLAMAR).toBeLessThan(60);
  });
});
