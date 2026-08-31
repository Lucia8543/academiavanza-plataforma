import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/repositories/cliente';
import { porTokenFamilia } from '@/backend/repositories/solicitudes';
import {
  confirmarPago,
  crearSolicitud,
  decidir,
  pedirVale,
} from '@/backend/services/solicitud';
import {
  crearProfesor,
  datosDeFamilia,
  envejecer,
  limpiar,
  ponerTarifa,
  porCodigo,
  unNivel,
} from './ayuda';

/**
 * El contacto gratis, de principio a fin.
 *
 * El vale existe para que una familia a la que no le ha salido bien no dependa
 * de que alguien conteste un correo. Por eso lo importante que se prueba aquí
 * no es que se conceda, sino que **se pueda gastar sin intervención de nadie**:
 * un vale que hay que reclamar por correo no es un vale, es una promesa.
 */

/**
 * Una solicitud ya pagada.
 *
 * El teléfono se puede cambiar porque los límites antiabuso cuentan por
 * teléfono: el mismo número no puede escribir dos veces al mismo profesor en
 * siete días. Cuando una prueba necesita dos familias distintas sobre el mismo
 * profesor —la pausa automática, por ejemplo— hay que dárselas de verdad.
 */
async function unaPagada(
  profesorDado?: { id: string; slug: string },
  telefono = '600000099',
) {
  const profesor = profesorDado ?? (await crearProfesor());
  const nivelId = await unNivel();
  const alta = await crearSolicitud(
    profesor.slug,
    datosDeFamilia({ nivelId, telefono }),
  );
  if (!alta.ok) throw new Error(`No se ha creado la solicitud: ${alta.motivo}`);

  const s = await porCodigo(alta.codigo);
  await decidir(s.token_profesor, 'aceptar');
  await confirmarPago(alta.codigo);

  return { profesor, ...alta };
}

beforeEach(async () => {
  await limpiar();
  await ponerTarifa(10);
});

// ---------------------------------------------------------------------------

describe('conceder el vale', () => {
  it('«hablamos y no funcionó» se concede al momento', async () => {
    const { token, codigo } = await unaPagada();

    const r = await pedirVale(token, 'no-funciono', 'horarios');

    expect(r.ok).toBe(true);
    const s = await porCodigo(codigo);
    expect(s.vale_concedido).toBe(true);
    expect(s.vale_caduca_en).not.toBeNull();
    expect(s.motivo_cierre).toBe('horarios');
  });

  it('sin motivo no se concede', async () => {
    const { token } = await unaPagada();

    const r = await pedirVale(token, 'no-funciono');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('falta-motivo');
  });

  it('«no conseguí hablar» hay que esperar tres días', async () => {
    const { token } = await unaPagada();

    const r = await pedirVale(token, 'sin-contacto');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('demasiado-pronto');
  });

  it('pasados los tres días, sí, y sin pedir motivo', async () => {
    const { token, codigo } = await unaPagada();
    await envejecer(codigo, { pagada_en: 4 });

    const r = await pedirVale(token, 'sin-contacto');

    expect(r.ok).toBe(true);
    expect((await porCodigo(codigo)).motivo_cierre).toBe('sin-contacto');
  });

  it('no se conceden dos vales sobre la misma solicitud', async () => {
    const { token } = await unaPagada();
    await pedirVale(token, 'no-funciono', 'distancia');

    const r = await pedirVale(token, 'no-funciono', 'precio-clases');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('ya-lo-tiene');
  });

  it('no hay vale sobre algo que no se ha pagado', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error(`no creada: ${alta.motivo}`);

    const r = await pedirVale(alta.token, 'no-funciono', 'horarios');

    expect(r.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('gastar el vale', () => {
  it('la solicitud nueva sale a cero', async () => {
    const primera = await unaPagada();
    await pedirVale(primera.token, 'no-funciono', 'horarios');

    const otro = await crearProfesor();
    const nivelId = await unNivel();
    const segunda = await crearSolicitud(
      otro.slug,
      datosDeFamilia({ nivelId }),
      primera.codigo,
    );
    if (!segunda.ok) throw new Error(`no creada: ${segunda.motivo}`);

    const s = await porCodigo(segunda.codigo);
    expect(Number(s.importe)).toBe(0);
    expect(s.vale_de).not.toBeNull();
  });

  it('⭐ y se abre sola en cuanto el profesor acepta', async () => {
    // Es lo que hace que el vale sirva de algo: nadie hace un Bizum de cero
    // euros, así que si esto no se abriera solo haría falta escribir a alguien.
    const primera = await unaPagada();
    await pedirVale(primera.token, 'no-funciono', 'horarios');

    const otro = await crearProfesor();
    const nivelId = await unNivel();
    const segunda = await crearSolicitud(
      otro.slug,
      datosDeFamilia({ nivelId }),
      primera.codigo,
    );
    if (!segunda.ok) throw new Error(`no creada: ${segunda.motivo}`);

    const s = await porCodigo(segunda.codigo);
    await decidir(s.token_profesor, 'aceptar');

    const vista = await porTokenFamilia(segunda.token);
    expect(vista?.estado).toBe('pagada');
    // Pagada con el vale, pero el teléfono del profesor sigue sin salir: eso
    // no depende de cómo se haya pagado.
    expect(JSON.stringify(vista)).not.toContain('600000001');
  });

  it('el mismo vale no se gasta dos veces', async () => {
    const primera = await unaPagada();
    await pedirVale(primera.token, 'no-funciono', 'horarios');

    const nivelId = await unNivel();
    const a = await crearProfesor();
    await crearSolicitud(a.slug, datosDeFamilia({ nivelId }), primera.codigo);

    const b = await crearProfesor();
    const tercera = await crearSolicitud(
      b.slug,
      datosDeFamilia({ nivelId }),
      primera.codigo,
    );
    if (!tercera.ok) throw new Error(`no creada: ${tercera.motivo}`);

    expect(Number((await porCodigo(tercera.codigo)).importe)).toBe(10);
  });

  it('un vale caducado no se aplica', async () => {
    const primera = await unaPagada();
    await pedirVale(primera.token, 'no-funciono', 'horarios');
    await envejecer(primera.codigo, { vale_caduca_en: 1 });

    const otro = await crearProfesor();
    const nivelId = await unNivel();
    const segunda = await crearSolicitud(
      otro.slug,
      datosDeFamilia({ nivelId }),
      primera.codigo,
    );
    if (!segunda.ok) throw new Error(`no creada: ${segunda.motivo}`);

    expect(Number((await porCodigo(segunda.codigo)).importe)).toBe(10);
  });

  it('un código inventado se ignora y se cobra lo normal', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(
      profesor.slug,
      datosDeFamilia({ nivelId }),
      'XXXXX',
    );
    if (!alta.ok) throw new Error(`no creada: ${alta.motivo}`);

    expect(Number((await porCodigo(alta.codigo)).importe)).toBe(10);
  });

  it('la solicitud original se queda como pagada, para que haya rastro', async () => {
    const primera = await unaPagada();
    await pedirVale(primera.token, 'no-funciono', 'horarios');

    const otro = await crearProfesor();
    const nivelId = await unNivel();
    await crearSolicitud(otro.slug, datosDeFamilia({ nivelId }), primera.codigo);

    const s = await porCodigo(primera.codigo);
    expect(s.estado).toBe('pagada');
    expect(s.vale_concedido).toBe(false); // gastado
    expect(s.vale_caduca_en).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe('la pausa automática del profesor', () => {
  it('dos «no conseguí hablar» le pausan la ficha', async () => {
    const profesor = await crearProfesor();

    // Dos familias DISTINTAS: dos teléfonos, o el límite antiabuso frenaría a
    // la segunda por escribir al mismo profesor en menos de siete días.
    for (const telefono of ['600000011', '600000022']) {
      const p = await unaPagada(profesor, telefono);
      await envejecer(p.codigo, { pagada_en: 4 });
      await pedirVale(p.token, 'sin-contacto');
    }

    const ficha = await db.profesores.findUniqueOrThrow({
      where: { id: profesor.id },
      select: { disponible: true, pausada_auto_en: true },
    });

    expect(ficha.disponible).toBe(false);
    expect(ficha.pausada_auto_en).not.toBeNull();
  });

  it('uno solo no basta', async () => {
    const profesor = await crearProfesor();
    const p = await unaPagada(profesor);
    await envejecer(p.codigo, { pagada_en: 4 });
    await pedirVale(p.token, 'sin-contacto');

    const ficha = await db.profesores.findUniqueOrThrow({
      where: { id: profesor.id },
      select: { disponible: true },
    });

    expect(ficha.disponible).toBe(true);
  });

  it('dos «no encajamos» no le pausan nada', async () => {
    // Que dos familias hayan hablado con él y no hayan encajado no dice nada
    // malo de nadie. Sólo cuenta que no consiguieran localizarle.
    const profesor = await crearProfesor();

    for (const [telefono, motivo] of [
      ['600000033', 'horarios'],
      ['600000044', 'distancia'],
    ] as const) {
      const p = await unaPagada(profesor, telefono);
      await pedirVale(p.token, 'no-funciono', motivo);
    }

    const ficha = await db.profesores.findUniqueOrThrow({
      where: { id: profesor.id },
      select: { disponible: true, pausada_auto_en: true },
    });

    expect(ficha.disponible).toBe(true);
    expect(ficha.pausada_auto_en).toBeNull();
  });
});
