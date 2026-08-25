import { describe, expect, it } from 'vitest';
import { detectarDatosSensibles } from '../../src/shared/schemas/datos-sensibles';

/**
 * Un filtro de palabras tiene dos formas de fallar, y las dos son malas:
 * dejar pasar un diagnóstico, y rechazar un mensaje normal. Estas pruebas
 * vigilan las dos.
 *
 * Los falsos positivos importan tanto como los falsos negativos: una madre a
 * la que el formulario le rechaza «le cuesta concentrarse en clase» cierra la
 * pestaña y se va.
 */

describe('detecta lo que no podemos guardar', () => {
  const debenSaltar = [
    'Mi hijo tiene TDAH y le cuesta concentrarse',
    'tiene tdah',
    'Le han diagnosticado dislexia este año',
    'Está en tratamiento médico',
    'Toma Concerta por las mañanas',
    'Va al psicólogo los martes',
    'Tiene altas capacidades',
    'Es celiaco, por si coméis algo',
    'Tiene un trastorno de ansiedad',
    'Somos musulmanes y no puede los viernes',
    'DISLEXIA',
    'Le detectaron discalculia',
    // Plurales: la gente no escribe en singular, y el filtro tiene que
    // reconocerlos también cuando el término es de dos palabras.
    'Tiene alergias',
    'Os paso los informes médicos',
    'Tiene necesidades especiales',
  ];

  for (const texto of debenSaltar) {
    it(`salta con: ${texto}`, () => {
      expect(detectarDatosSensibles(texto)).not.toBeNull();
    });
  }
});

describe('deja pasar los mensajes normales', () => {
  const debenPasar = [
    '',
    'Va a 3.º de la ESO y le cuesta seguir el ritmo en mates',
    'Buscamos dos días a la semana por la tarde',
    'Tiene examen de física el día 12 y va muy justo',
    'Nos gustaría empezar en octubre, si te viene bien',
    'Le encanta el teatro pero odia las matemáticas',
    'Estudia mucho pero no le cunde',
    'Es un chaval muy movido en clase',
    'Necesita que le expliquen las cosas despacio',
    'Vivimos en Chamberí, cerca del metro',
  ];

  for (const texto of debenPasar) {
    it(`no salta con: ${texto || '(vacío)'}`, () => {
      expect(detectarDatosSensibles(texto)).toBeNull();
    });
  }
});

describe('detalles del emparejado', () => {
  it('no confunde una palabra con otra que la contiene', () => {
    // «tea» está en la lista; «teatro» no debe saltar.
    expect(detectarDatosSensibles('Le gusta el teatro')).toBeNull();
    // «tda» está en la lista; no debe saltar dentro de otra palabra.
    expect(detectarDatosSensibles('Vive en Ntdaville')).toBeNull();
  });

  it('ignora tildes y mayúsculas', () => {
    expect(detectarDatosSensibles('DEPRESIÓN')).not.toBeNull();
    expect(detectarDatosSensibles('medicación')).not.toBeNull();
  });

  it('dice qué categoría ha encontrado', () => {
    expect(detectarDatosSensibles('tiene asma')?.categoria).toBe('salud');
  });
});
