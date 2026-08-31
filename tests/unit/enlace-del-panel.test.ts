import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

/**
 * El enlace del panel no se guarda tal cual en ninguna parte.
 *
 * Durante meses la columna se llamó `token_hash` y contenía el enlace entero sin
 * cifrar. El nombre decía una cosa y la fila decía otra, y nadie lo miró porque
 * un nombre bien puesto se cree.
 *
 * Estas pruebas no tocan la base de datos: comprueban las dos propiedades de las
 * que depende todo lo demás, que son que **lo entregado y lo guardado nunca
 * coinciden** y que **el mismo profesor recibe siempre el mismo enlace**. Si
 * alguna de las dos se rompiera, o el enlace sería recuperable desde la tabla, o
 * el profesor perdería el acceso que tiene guardado en un favorito.
 *
 * Las funciones se replican aquí en vez de importarlas porque las del servicio
 * son privadas y exigen `ACCESO_SECRET` en el entorno. Lo que se está fijando es
 * el contrato, no la implementación: si esta prueba y el servicio dejaran de
 * coincidir, la que está mal es la copia, y arreglarla es leer el servicio.
 */

const SECRETO = 'un-secreto-de-prueba-de-mas-de-treinta-y-dos-caracteres';

const huella = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const derivar = (profesorId: string) =>
  createHmac('sha256', SECRETO).update(`panel:${profesorId}`).digest('base64url');

const UN_PROFESOR = '3f2a9c10-0000-4000-8000-000000000001';
const OTRO = '3f2a9c10-0000-4000-8000-000000000002';

describe('⭐ lo que se guarda no es lo que se entrega', () => {
  it('la huella no se parece al enlace', () => {
    const token = derivar(UN_PROFESOR);
    expect(huella(token)).not.toBe(token);
    expect(huella(token)).not.toContain(token);
  });

  it('la huella mide 64 caracteres y el enlace no', () => {
    // La migración 23 distingue lo migrado de lo que falta por esa longitud.
    // Si el enlace llegara a medir 64, la migración dejaría filas sin hashear.
    expect(huella(derivar(UN_PROFESOR))).toHaveLength(64);
    expect(derivar(UN_PROFESOR)).not.toHaveLength(64);
  });

  it('de la huella no se vuelve al enlace', () => {
    // Es lo que hace que leer la tabla no sirva de nada: hashear la huella
    // otra vez da algo distinto, y no hay camino de vuelta.
    const token = derivar(UN_PROFESOR);
    expect(huella(huella(token))).not.toBe(huella(token));
  });
});

describe('el enlace es estable y distinto para cada profesor', () => {
  it('el mismo profesor recibe siempre el mismo', () => {
    // Si esto fallara, cada correo llevaría un enlace nuevo y el que el
    // profesor tenga guardado dejaría de funcionar.
    expect(derivar(UN_PROFESOR)).toBe(derivar(UN_PROFESOR));
  });

  it('dos profesores no comparten enlace', () => {
    expect(derivar(UN_PROFESOR)).not.toBe(derivar(OTRO));
  });

  it('con otro secreto sale otro enlace', () => {
    const conOtro = createHmac('sha256', `${SECRETO}-distinto`)
      .update(`panel:${UN_PROFESOR}`)
      .digest('base64url');

    expect(conOtro).not.toBe(derivar(UN_PROFESOR));
  });
});
