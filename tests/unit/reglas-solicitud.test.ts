import { describe, expect, it } from 'vitest';
import {
  ESTADOS,
  esFinal,
  esperaPago,
  huboPago,
  puedeReclamarVale,
  elProfesorVeElTelefono,
  sigueViva,
  transicionPermitida,
} from '../../src/shared/reglas/solicitud';

/**
 * Las pruebas del recorrido de una solicitud.
 *
 * Se prueban **todos los estados contra todos los estados**, no una muestra.
 * Son siete por siete: cuarenta y nueve combinaciones, y comprobarlas todas
 * cuesta lo mismo que comprobar tres.
 *
 * El motivo de ser exhaustivo es que estas reglas fallan en silencio. Si
 * mañana alguien añade un estado y se olvida de decidir qué pasa con los
 * teléfonos, aquí salta; en producción no saltaría nada, simplemente se vería
 * un número que no debería estar en pantalla.
 */

describe('el profesor no ve el teléfono antes de tiempo', () => {
  /*
   * Esta regla gobierna un solo sentido, y el nombre del `describe` lo dice a
   * propósito: **el teléfono de la familia hacia el profesor**. El del profesor
   * no se enseña en ningún estado, así que aquí no hay nada que comprobar sobre
   * él; de eso se ocupan las pruebas de integración, que miran lo que se le
   * sirve a la familia y comprueban que el número no aparece.
   *
   * La lista está escrita a mano y a propósito. Si alguien cambia la función
   * para que devuelva true en un estado nuevo, tendrá que venir aquí y
   * escribirlo, que es exactamente lo que se quiere que pase.
   */
  const conTelefono = ['pagada', 'devuelta'];

  for (const estado of ESTADOS) {
    const deberia = conTelefono.includes(estado);

    it(`${estado}: ${deberia ? 'sí' : 'NO'} ve el teléfono de la familia`, () => {
      expect(elProfesorVeElTelefono(estado)).toBe(deberia);
    });
  }

  it('nunca antes de pagar', () => {
    expect(elProfesorVeElTelefono('pendiente_profesor')).toBe(false);
    expect(elProfesorVeElTelefono('aceptada')).toBe(false);
  });

  it('una solicitud rechazada, caducada o cancelada no enseña nada', () => {
    expect(elProfesorVeElTelefono('rechazada')).toBe(false);
    expect(elProfesorVeElTelefono('caducada')).toBe(false);
    expect(elProfesorVeElTelefono('cancelada')).toBe(false);
  });
});

describe('las transiciones', () => {
  const permitidas: [string, string][] = [
    ['pendiente_profesor', 'aceptada'],
    ['pendiente_profesor', 'rechazada'],
    ['pendiente_profesor', 'caducada'],
    ['aceptada', 'pagada'],
    ['aceptada', 'cancelada'],
    ['aceptada', 'caducada'],
    ['pagada', 'devuelta'],
  ];

  const esPermitida = (a: string, b: string) =>
    permitidas.some(([x, y]) => x === a && y === b);

  // 7 × 7. Todas.
  for (const desde of ESTADOS) {
    for (const hasta of ESTADOS) {
      const deberia = esPermitida(desde, hasta);

      it(`${desde} → ${hasta}: ${deberia ? 'permitido' : 'prohibido'}`, () => {
        expect(transicionPermitida(desde, hasta)).toBe(deberia);
      });
    }
  }
});

describe('lo que no puede pasar nunca', () => {
  it('no se puede deshacer un pago volviendo a aceptada', () => {
    expect(transicionPermitida('pagada', 'aceptada')).toBe(false);
  });

  it('no se puede cobrar algo que el profesor no ha aceptado', () => {
    expect(transicionPermitida('pendiente_profesor', 'pagada')).toBe(false);
  });

  it('no se puede cobrar dos veces: pagada no vuelve a pagada', () => {
    expect(transicionPermitida('pagada', 'pagada')).toBe(false);
  });

  it('no se puede resucitar lo que ya terminó', () => {
    for (const estado of ['rechazada', 'caducada', 'cancelada', 'devuelta'] as const) {
      expect(esFinal(estado)).toBe(true);

      for (const destino of ESTADOS) {
        expect(transicionPermitida(estado, destino)).toBe(false);
      }
    }
  });

  it('ningún estado se transiciona a sí mismo', () => {
    for (const estado of ESTADOS) {
      expect(transicionPermitida(estado, estado)).toBe(false);
    }
  });
});

describe('el resto de reglas', () => {
  it('sólo se paga desde aceptada', () => {
    for (const estado of ESTADOS) {
      expect(esperaPago(estado)).toBe(estado === 'aceptada');
    }
  });

  it('sólo se reclama vale habiendo pagado', () => {
    for (const estado of ESTADOS) {
      expect(puedeReclamarVale(estado)).toBe(estado === 'pagada');
    }
  });

  it('sigue viva sólo mientras alguien tiene algo que hacer', () => {
    for (const estado of ESTADOS) {
      const viva = estado === 'pendiente_profesor' || estado === 'aceptada';
      expect(sigueViva(estado)).toBe(viva);
    }
  });

  it('hubo pago en pagada y en devuelta', () => {
    for (const estado of ESTADOS) {
      const pago = estado === 'pagada' || estado === 'devuelta';
      expect(huboPago(estado)).toBe(pago);
    }
  });

  it('lo que sigue vivo no es final, y al revés', () => {
    for (const estado of ESTADOS) {
      if (sigueViva(estado)) expect(esFinal(estado)).toBe(false);
    }
  });
});
