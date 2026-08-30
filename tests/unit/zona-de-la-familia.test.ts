import { describe, expect, it } from 'vitest';
import {
  esZonaValida,
  GRUPOS_DE_ZONAS,
  OTRA_ZONA,
  ZONAS,
} from '@/shared/datos/zonas';
import { esquemaContacto } from '@/shared/schemas/contacto';

/**
 * La zona de la familia sale de una lista cerrada, y eso es lo que se prueba.
 *
 * El profesor necesita saber si le compensa desplazarse, pero el riesgo de
 * preguntarlo es que la respuesta natural a «¿dónde vives?» sea una calle con
 * número. Ese dato, guardado al lado del curso de una menor, no nos hace
 * ninguna falta y no lo queremos tener.
 *
 * El desplegable ya lo impide en el navegador. Estas pruebas comprueban que
 * también lo impide el servidor, que es donde cuenta: quien envíe el formulario
 * a mano, sin JavaScript o con una herramienta, se encuentra el mismo muro.
 */

const BASE = {
  nombreFamilia: 'María López',
  telefono: '600111222',
  email: 'maria@ejemplo.invalid',
  nivelId: 'abc',
  esTutorLegal: true,
  aceptaPrivacidad: true,
};

describe('la lista de zonas', () => {
  it('no tiene entradas repetidas', () => {
    expect(new Set(ZONAS).size).toBe(ZONAS.length);
  });

  it('tiene los 21 distritos de Madrid y la salida para el resto', () => {
    const [capital, fuera] = GRUPOS_DE_ZONAS;
    expect(capital.zonas).toHaveLength(21);
    expect(capital.zonas).toContain('Chamberí');
    expect(fuera.zonas).toContain('Getafe');
    // Sin esta última opción, quien viva en un municipio que no está en la
    // lista se queda sin poder enviar el formulario.
    expect(fuera.zonas).toContain(OTRA_ZONA);
  });

  it('acepta lo que está y rechaza lo que no', () => {
    expect(esZonaValida('Chamberí')).toBe(true);
    expect(esZonaValida('Alcobendas')).toBe(true);
    expect(esZonaValida('chamberí')).toBe(false);
    expect(esZonaValida('')).toBe(false);
  });
});

describe('⭐ el formulario no deja colar una dirección', () => {
  const enviar = (zona: string) => esquemaContacto.safeParse({ ...BASE, zona });

  it('deja pasar una zona de la lista', () => {
    const r = enviar('Chamberí');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.zona).toBe('Chamberí');
  });

  it.each([
    ['una calle con número', 'Calle de Alcalá 123, 4º B'],
    ['una calle sin número', 'Avenida de América'],
    ['un portal', 'Chamberí, portal 3, 2ºA'],
    ['un código postal', '28010'],
    ['algo inventado', 'Cerca del Bernabéu'],
  ])('rechaza %s', (_, valor) => {
    const r = enviar(valor);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === 'zona')).toBe(true);
    }
  });

  it('deja pasar sin zona, que es el caso del profesor que sólo da online', () => {
    // A quien no se desplaza, la zona no le dice nada, así que no se le
    // pregunta. Si esto fallara, nadie podría escribir a un profesor online.
    expect(esquemaContacto.safeParse(BASE).success).toBe(true);
  });
});
