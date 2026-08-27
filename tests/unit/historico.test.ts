import { describe, expect, it } from 'vitest';
import { HISTORICO, NOTA_HISTORICO } from '../../src/shared/datos/historico';

/**
 * Las cifras que se publican en portada.
 *
 * Estas pruebas no comprueban que el código funcione: comprueban que **nadie
 * ha subido un número**. Es el único sitio del proyecto donde el error no sería
 * un fallo técnico sino una mentira, y donde nada saltaría por sí solo: una
 * cifra inflada se pinta igual de bien que una cierta.
 *
 * Los valores reales, del apartado 4 del informe de migración, son 1.904
 * clases, 2.150 horas, 60 familias y 104 parejas familia-profesor. Lo que se
 * publica tiene que ser igual o menor, nunca mayor.
 */

const REALES = {
  clases: 1904,
  horas: 2150,
  familias: 60,
  emparejamientos: 104,
};

describe('ninguna cifra publicada supera a la real', () => {
  it(`clases: no más de ${REALES.clases}`, () => {
    expect(HISTORICO.clases).toBeLessThanOrEqual(REALES.clases);
  });

  it(`horas: no más de ${REALES.horas}`, () => {
    expect(HISTORICO.horas).toBeLessThanOrEqual(REALES.horas);
  });

  it(`familias: no más de ${REALES.familias}`, () => {
    expect(HISTORICO.familias).toBeLessThanOrEqual(REALES.familias);
  });

  it(`emparejamientos: no más de ${REALES.emparejamientos}`, () => {
    expect(HISTORICO.emparejamientos).toBeLessThanOrEqual(
      REALES.emparejamientos,
    );
  });
});

describe('las cifras siguen siendo dignas de enseñar', () => {
  // Si alguien las redondeara hacia abajo hasta dejarlas en nada, tampoco
  // estaría bien: se estaría regalando el único activo que hay.
  it('no se han redondeado a la baja más de un 10 %', () => {
    expect(HISTORICO.clases).toBeGreaterThan(REALES.clases * 0.9);
    expect(HISTORICO.familias).toBeGreaterThan(REALES.familias * 0.9);
  });
});

describe('la nota que acompaña a las cifras', () => {
  // Sin esta nota, una plataforma que abre esta semana estaría enseñando mil
  // novecientas clases como si fueran suyas. La regla 9 del CLAUDE.md la exige.
  it('existe y dice de dónde salen', () => {
    expect(NOTA_HISTORICO.length).toBeGreaterThan(50);
  });

  // Lo que tiene que quedar claro es que esas clases no se dieron a través de
  // esta web. Da igual con qué palabras se diga —«etapa anterior», «de forma
  // manual»— mientras se diga; sin eso, una plataforma que abre esta semana
  // estaría enseñando mil novecientas clases como si fueran suyas.
  it('deja claro que no se dieron a través de la plataforma', () => {
    const nota = NOTA_HISTORICO.toLowerCase();
    expect(nota.includes('manual') || nota.includes('anterior')).toBe(true);
  });

  it('dice de qué curso son', () => {
    expect(NOTA_HISTORICO).toContain(HISTORICO.curso);
  });
});
