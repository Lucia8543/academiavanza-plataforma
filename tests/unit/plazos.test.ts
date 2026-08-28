import { describe, expect, it } from 'vitest';
import {
  CADUCADAS_PARA_PAUSAR,
  PLAZO_MINIMO,
  PLAZOS,
  plazoDe,
  RECORDATORIO_MAS_TEMPRANO,
  URGENCIA_POR_DEFECTO,
} from '../../src/shared/reglas/cobro';

/**
 * Los plazos que elige la familia.
 *
 * Aquí no se comprueban los números concretos —esos cambian— sino las
 * relaciones entre ellos, que son las que tienen que seguir siendo verdad
 * cuando alguien toque un plazo dentro de seis meses sin acordarse de esto.
 */

describe('cada plazo se sostiene solo', () => {
  for (const [clave, plazo] of Object.entries(PLAZOS)) {
    describe(`«${clave}»`, () => {
      it('recuerda dos veces, y las dos antes de cerrar', () => {
        expect(plazo.recordatorios).toHaveLength(2);
        for (const dia of plazo.recordatorios) {
          expect(dia).toBeGreaterThan(0);
          expect(dia).toBeLessThan(plazo.dias);
        }
      });

      it('los recordatorios van en orden y no el mismo día', () => {
        const [primero, segundo] = plazo.recordatorios;
        expect(segundo).toBeGreaterThan(primero);
      });

      it('el último recordatorio deja al menos dos días de margen', () => {
        // Un aviso la víspera del cierre no sirve de nada: llega cuando la
        // familia ya se ha ido a otro sitio. Es la regla que dice el docstring
        // de `cobro.ts`, y está aquí para que no se pueda acortar un plazo sin
        // mover sus recordatorios.
        const ultimo = plazo.recordatorios[plazo.recordatorios.length - 1];
        expect(plazo.dias - ultimo).toBeGreaterThanOrEqual(2);
      });

      it('tiene etiqueta y explicación para la pantalla', () => {
        expect(plazo.etiqueta.length).toBeGreaterThan(3);
        expect(plazo.explicacion.length).toBeGreaterThan(3);
      });
    });
  }
});

describe('una urgencia rara no rompe nada', () => {
  /*
   * Importa más de lo que parece: la columna admite texto y las solicitudes
   * anteriores a esto no traen valor. Si `plazoDe` devolviera `undefined`, el
   * fallo no sería una excepción visible sino una solicitud que no caduca nunca
   * y una familia esperando indefinidamente.
   */
  for (const valor of [null, undefined, '', 'inventado', 'YA']) {
    it(`con ${JSON.stringify(valor)} usa el plazo por defecto`, () => {
      expect(plazoDe(valor)).toBe(PLAZOS[URGENCIA_POR_DEFECTO]);
    });
  }

  it('con uno bueno usa el suyo', () => {
    expect(plazoDe('adelante')).toBe(PLAZOS.adelante);
  });
});

describe('los suelos que usa la tarea diaria', () => {
  it('el plazo mínimo es el más corto que existe', () => {
    for (const plazo of Object.values(PLAZOS)) {
      expect(PLAZO_MINIMO).toBeLessThanOrEqual(plazo.dias);
    }
  });

  it('el recordatorio más temprano no se salta ninguno', () => {
    // Si este suelo fuera mayor que el primer recordatorio de algún plazo, a
    // esas solicitudes no les llegaría nunca el aviso, y el síntoma sería una
    // familia esperando en silencio.
    for (const plazo of Object.values(PLAZOS)) {
      expect(RECORDATORIO_MAS_TEMPRANO).toBeLessThanOrEqual(
        plazo.recordatorios[0],
      );
    }
  });
});

describe('el tope de solicitudes sin contestar', () => {
  it('deja margen para el despiste, pero no es infinito', () => {
    expect(CADUCADAS_PARA_PAUSAR).toBeGreaterThan(2);
    expect(CADUCADAS_PARA_PAUSAR).toBeLessThanOrEqual(10);
  });
});
