import { describe, expect, it } from 'vitest';
import { esquemaRegistroProfesor } from '../../src/shared/schemas/profesor';

/**
 * El filtro de datos de salud, en el alta del profesor.
 *
 * Esta prueba existe por un fallo concreto: durante un tiempo
 * `detectarDatosSensibles` se llamaba en dos sitios y los dos eran el mensaje
 * de la familia. Los puntos fuertes del profesor y el colegio escrito a mano no
 * pasaban por él.
 *
 * Era el hueco más grande de los dos, y no al revés: lo que escribe una familia
 * acaba en un correo, y lo que escribe un profesor **se publica en una página
 * web**. Un profesor que quiere decir que se le dan bien los chavales con
 * dislexia estaba publicando un dato de categoría especial sobre terceros.
 *
 * Se descubrió escribiendo esta frase en el formulario del alta y viendo que
 * el botón de enviar seguía activo y no salía ningún aviso.
 */

/** Un alta correcta, a la que cada prueba le cambia sólo lo que le interesa. */
function alta(cambios: Record<string, unknown> = {}) {
  return {
    nombre: 'Marta',
    apellidos: 'Pérez López',
    email: 'marta@ejemplo.invalid',
    telefono: '600111222',
    colegioId: '11111111-1111-1111-1111-111111111111',
    colegioOtro: '',
    titulacion: 'Matemáticas',
    universidad: 'Universidad Autónoma de Madrid',
    cursoActual: 3,
    titulacionFinalizada: false,
    asignaturas: ['mates'],
    niveles: ['2-eso'],
    certificaciones: [],
    disponibilidad: [],
    modalidad: 'online',
    zona: '',
    puntosFuertes: 'Voy despacio y me aseguro de que se entiende',
    declaraEdadMinima: true,
    aceptaPublicacion: true,
    ...cambios,
  };
}

/** Los mensajes de error de un campo, para poder mirarlos sin adivinar. */
function erroresDe(datos: unknown, campo: string): string[] {
  const r = esquemaRegistroProfesor.safeParse(datos);
  if (r.success) return [];
  return r.error.issues
    .filter((i) => i.path[0] === campo)
    .map((i) => i.message);
}

describe('un alta normal se acepta', () => {
  it('no se rompe nada por añadir el filtro', () => {
    expect(esquemaRegistroProfesor.safeParse(alta()).success).toBe(true);
  });

  it('se puede hablar de cómo se da clase sin que salte', () => {
    for (const texto of [
      'Tengo paciencia y he dado clase a chavales muy distintos',
      'Explico con ejemplos y no doy nada por sabido',
      'Preparo la clase antes y traigo ejercicios míos',
    ]) {
      const r = esquemaRegistroProfesor.safeParse(
        alta({ puntosFuertes: texto }),
      );
      expect(r.success, texto).toBe(true);
    }
  });
});

describe('⭐ los puntos fuertes pasan por el filtro', () => {
  it('la frase exacta con la que apareció el fallo', () => {
    const errores = erroresDe(
      alta({
        puntosFuertes:
          'Trabajo mucho con alumnos con TDAH y dislexia, y tengo experiencia con niños medicados',
      }),
      'puntosFuertes',
    );

    expect(errores).toHaveLength(1);
    // El aviso habla de la ficha, no de «tu hijo»: quien escribe es el profesor.
    expect(errores[0]).toContain('ficha');
  });

  it('también con un diagnóstico suelto', () => {
    expect(
      erroresDe(
        alta({ puntosFuertes: 'Se me dan bien los chavales con dislexia' }),
        'puntosFuertes',
      ),
    ).not.toHaveLength(0);
  });
});

describe('⭐ el colegio escrito a mano pasa por el filtro', () => {
  it('no se cuela por ahí lo que no se cuela por los puntos fuertes', () => {
    expect(
      erroresDe(
        alta({
          colegioId: '',
          colegioOtro: 'Centro de educación especial para niños con autismo',
        }),
        'colegioOtro',
      ),
    ).not.toHaveLength(0);
  });

  it('un colegio normal escrito a mano se acepta', () => {
    const r = esquemaRegistroProfesor.safeParse(
      alta({ colegioId: '', colegioOtro: 'Colegio Nuestra Señora del Recuerdo' }),
    );
    expect(r.success).toBe(true);
  });
});
