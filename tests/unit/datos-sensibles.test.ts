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
    // «TEA» salta como sigla; «teatro» no debe saltar.
    expect(detectarDatosSensibles('Le gusta el teatro')).toBeNull();
    // Tampoco dentro de otra palabra, aunque vaya en mayúsculas.
    expect(detectarDatosSensibles('Vive en NTDAville')).toBeNull();
  });

  it('ignora tildes y mayúsculas', () => {
    expect(detectarDatosSensibles('DEPRESIÓN')).not.toBeNull();
    expect(detectarDatosSensibles('medicación')).not.toBeNull();
  });

  it('dice qué categoría ha encontrado', () => {
    expect(detectarDatosSensibles('tiene asma')?.categoria).toBe('salud');
  });
});

describe('siglas de tres letras', () => {
  /*
   * En minúscula son palabras corrientes, y bloqueaban frases inocentes: «mi
   * tel es 600 111 222» no se podía enviar, que es justo lo que hace que
   * alguien cierre la pestaña. Escritas como siglas siguen saltando.
   */
  it('saltan escritas en mayúsculas', () => {
    for (const frase of [
      'Le han diagnosticado TEA',
      'Tiene TEL',
      'Diagnóstico de TDA',
    ]) {
      expect(detectarDatosSensibles(frase), frase).not.toBeNull();
    }
  });

  it('no saltan cuando son palabras normales', () => {
    for (const frase of [
      'Mi tel es 600 111 222',
      'Le gusta el teatro',
      'Tomamos un te antes de clase',
    ]) {
      expect(detectarDatosSensibles(frase), frase).toBeNull();
    }
  });

  it('TDAH sigue saltando en minúsculas, que tiene cuatro letras', () => {
    expect(detectarDatosSensibles('tiene tdah')).not.toBeNull();
  });

  it('un texto entero en mayúsculas no bloquea por las siglas', () => {
    // Quien escribe a voces no está usando siglas. Es el mismo falso positivo
    // de antes, sólo que con la tecla de bloqueo puesta.
    expect(detectarDatosSensibles('MI TEL ES 600 111 222')).toBeNull();
    // Pero las palabras completas siguen saltando, griten o no.
    expect(detectarDatosSensibles('TIENE DISLEXIA')).not.toBeNull();
  });
});

describe('adjetivos, que es como lo escribe la gente', () => {
  /*
   * La lista tenía «diabetes» pero no «diabético». Una madre no escribe «mi
   * hijo tiene diabetes», escribe «mi hijo es diabético», así que el filtro
   * dejaba pasar exactamente la forma más común.
   */
  const debenSaltar = [
    'Mi hijo es diabético',
    'Es diabética',
    'Es asmático',
    'Es asmática',
    'Es epiléptico',
    'Es celiaca',
    'Es alérgico a los frutos secos',
  ];

  for (const frase of debenSaltar) {
    it(`salta con «${frase}»`, () => {
      expect(detectarDatosSensibles(frase)).not.toBeNull();
    });
  }
});
