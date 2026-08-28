import { describe, expect, it } from 'vitest';
import {
  quienEscribe,
  rutaSegura,
} from '../../src/shared/reglas/incidencias';

/**
 * De qué página venía quien escribe al buzón.
 *
 * ⭐ Lo que se vigila aquí es que **no se guarde ningún token**. Las direcciones
 * privadas de esta plataforma llevan la llave dentro —`/mi-ficha/<token>`,
 * `/solicitud/<token>`, `/aceptar/<token>`— y esta ruta acaba en una tabla que
 * se lee desde el panel y que se exporta a un texto plano para pegarlo fuera.
 *
 * Un token filtrado por aquí es acceso permanente al panel de un profesor
 * cualquiera, y no se vería: la incidencia parecería normal.
 */

const TOKEN = 'F_pd0R7Hg8ap4p6RC7fNctip9kTWeUljxpRrVMHoM2o';

describe('⭐ la ruta guardada nunca lleva el token', () => {
  const conToken = [
    `/mi-ficha/${TOKEN}`,
    `/solicitud/${TOKEN}`,
    `/aceptar/${TOKEN}`,
    `https://academiavanza.es/mi-ficha/${TOKEN}`,
    `/solicitud/${TOKEN}?vale=ABC12`,
    `/mi-ficha/${TOKEN}#datos`,
  ];

  for (const entrada of conToken) {
    it(`lo recorta en «${entrada.slice(0, 28)}…»`, () => {
      const salida = rutaSegura(entrada);
      expect(salida).not.toBeNull();
      expect(salida).not.toContain(TOKEN);
      // Y tampoco un trozo suficientemente largo como para servir de pista.
      expect(salida).not.toContain(TOKEN.slice(0, 12));
    });
  }

  it('tampoco se cuela por la cadena de consulta', () => {
    expect(rutaSegura(`/profesores?token=${TOKEN}`)).toBe('/profesores');
  });
});

describe('pero sigue diciendo dónde falló', () => {
  it('mantiene la sección, que es lo que hace falta', () => {
    expect(rutaSegura('/mi-ficha/abc')).toBe('/mi-ficha');
    expect(rutaSegura('/profesores')).toBe('/profesores');
    expect(rutaSegura('/registro')).toBe('/registro');
  });

  it('deja pasar un segundo tramo corto y legible', () => {
    expect(rutaSegura('/legal/privacidad')).toBe('/legal/privacidad');
  });

  it('la portada es la portada', () => {
    expect(rutaSegura('/')).toBe('/');
    expect(rutaSegura('')).toBeNull();
    expect(rutaSegura(null)).toBeNull();
  });
});

describe('quién escribe se deduce de dónde estaba', () => {
  it('desde su panel, un profesor', () => {
    expect(quienEscribe(`/mi-ficha/${TOKEN}`)).toBe('profesor');
  });

  it('desde el seguimiento, una familia', () => {
    expect(quienEscribe(`/solicitud/${TOKEN}`)).toBe('familia');
  });

  it('desde cualquier otro sitio, una visita', () => {
    expect(quienEscribe('/profesores')).toBe('visita');
    expect(quienEscribe('/')).toBe('visita');
    expect(quienEscribe(null)).toBe('visita');
  });
});
