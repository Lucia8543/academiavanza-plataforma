import { describe, expect, it } from 'vitest';
import {
  aceptaSolicitudes,
  AVISO_CUPO,
  type Cupo,
  CUPOS,
  ETIQUETA_CUPO,
  normalizarCupo,
  OPCIONES_CUPO,
  ORDEN_CUPO,
} from '@/shared/reglas/cupo';

/**
 * Los tres estados de hueco, y lo que cada uno implica.
 *
 * Lo que se protege aquí no es el texto de las etiquetas: es que **quien dice
 * que no le cabe nadie no reciba solicitudes**. Ese es el único punto donde una
 * equivocación cuesta dinero de verdad, porque la familia paga diez euros antes
 * de saber que el profesor no podía cogerla.
 */

describe('los tres estados', () => {
  it('son exactamente tres y no se repiten', () => {
    expect(CUPOS).toEqual(['busca', 'justo', 'completo']);
  });

  it('todos tienen su opción para elegir, en el mismo orden', () => {
    expect(OPCIONES_CUPO.map((o) => o.valor)).toEqual([...CUPOS]);
  });

  it('«busca» no lleva etiqueta ni aviso, porque es lo normal', () => {
    // Poner «tiene hueco» en cada tarjeta sería ruido en el 90 % del
    // directorio. Sólo se dice lo que se sale de lo esperado.
    expect(ETIQUETA_CUPO.busca).toBeNull();
    expect(AVISO_CUPO.busca).toBeNull();
  });

  it('los otros dos sí lo llevan, que es lo que la familia lee', () => {
    for (const c of ['justo', 'completo'] as const) {
      expect(ETIQUETA_CUPO[c], c).toBeTruthy();
      expect(AVISO_CUPO[c], c).toBeTruthy();
    }
  });
});

describe('⭐ a quien no tiene hueco no se le escribe', () => {
  it('sólo «completo» cierra la puerta', () => {
    expect(aceptaSolicitudes('busca')).toBe(true);
    // Quien va justo sí recibe: puede decir que no, y la familia lo sabe.
    expect(aceptaSolicitudes('justo')).toBe(true);
    expect(aceptaSolicitudes('completo')).toBe(false);
  });

  it('un valor raro nunca deja pasar por accidente lo que no debe', () => {
    // Lo que llega de un formulario o de una fila vieja puede ser cualquier
    // cosa. Todo lo desconocido cae en «busca», que es el estado por defecto:
    // como mucho alguien recibe una solicitud de más, que es el fallo barato.
    for (const raro of ['', null, undefined, 'lleno', 'JUSTO', 42, {}]) {
      expect(normalizarCupo(raro), String(raro)).toBe('busca');
    }
  });

  it('reconoce los tres buenos tal cual', () => {
    for (const c of CUPOS) expect(normalizarCupo(c)).toBe(c);
  });
});

describe('el orden en el directorio', () => {
  it('primero quien busca, y quien no tiene hueco al final', () => {
    expect(ORDEN_CUPO.busca).toBeLessThan(ORDEN_CUPO.justo);
    expect(ORDEN_CUPO.justo).toBeLessThan(ORDEN_CUPO.completo);
  });

  it('ordena una lista mezclada como toca', () => {
    const fichas: { cupo: Cupo }[] = [
      { cupo: 'completo' },
      { cupo: 'busca' },
      { cupo: 'justo' },
      { cupo: 'completo' },
      { cupo: 'busca' },
    ];

    const ordenadas = CUPOS.flatMap((c) => fichas.filter((f) => f.cupo === c));

    expect(ordenadas.map((f) => f.cupo)).toEqual([
      'busca',
      'busca',
      'justo',
      'completo',
      'completo',
    ]);
  });
});
