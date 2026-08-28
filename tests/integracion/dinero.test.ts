import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/repositories/cliente';
import { porTokenFamilia } from '@/backend/repositories/solicitudes';
import { precioVigente } from '@/backend/repositories/tarifas';
import {
  confirmarPago,
  crearSolicitud,
  decidir,
  familiaDiceQueHaPagado,
} from '@/backend/services/solicitud';
import {
  crearProfesor,
  datosDeFamilia,
  limpiar,
  ponerTarifa,
  porCodigo,
  quitarTarifaVigente,
  unNivel,
} from './ayuda';

/**
 * El recorrido del dinero, contra una base de datos de verdad.
 *
 * Todo lo de aquí gira alrededor de una sola regla: **el teléfono de una parte
 * no llega a la otra hasta que el pago está confirmado a mano**. Es lo que se
 * vende y lo único que no se puede deshacer si falla, porque un teléfono
 * entregado no se recoge.
 */

async function unaSolicitud(opciones: { vale?: string } = {}) {
  const profesor = await crearProfesor();
  const nivelId = await unNivel();
  const alta = await crearSolicitud(
    profesor.slug,
    datosDeFamilia({ nivelId }),
    opciones.vale,
  );
  if (!alta.ok) throw new Error(`No se ha creado: ${alta.motivo}`);
  return { profesor, ...alta };
}

beforeEach(async () => {
  await limpiar();
  await ponerTarifa(10);
});

// ---------------------------------------------------------------------------

describe('el recorrido completo', () => {
  it('una solicitud nace esperando al profesor y con el precio vigente', async () => {
    const { codigo } = await unaSolicitud();
    const s = await porCodigo(codigo);

    expect(s.estado).toBe('pendiente_profesor');
    expect(Number(s.importe)).toBe(10);
    expect(s.pagada_en).toBeNull();
  });

  it('aceptar no cobra nada ni abre nada', async () => {
    const { codigo } = await unaSolicitud();
    const s0 = await porCodigo(codigo);

    await decidir(s0.token_profesor, 'aceptar');
    const s = await porCodigo(codigo);

    expect(s.estado).toBe('aceptada');
    expect(s.pagada_en).toBeNull();
  });

  it('confirmar el pago cambia el estado, y nada más se le abre a la familia', async () => {
    const { codigo, token } = await unaSolicitud();
    const s0 = await porCodigo(codigo);
    await decidir(s0.token_profesor, 'aceptar');

    await confirmarPago(codigo);

    const despues = await porTokenFamilia(token);
    expect(despues?.estado).toBe('pagada');
    // Lo que se abre con el pago es el teléfono de la FAMILIA hacia el
    // profesor. Al revés no, en ningún estado: ver el bloque de abajo.
    expect(JSON.stringify(despues)).not.toContain('600000001');
  });

  it('rechazar cierra sin cobrar', async () => {
    const { codigo, token } = await unaSolicitud();
    const s0 = await porCodigo(codigo);

    await decidir(s0.token_profesor, 'rechazar', 'Ahora mismo no puedo');
    const s = await porTokenFamilia(token);

    expect(s?.estado).toBe('rechazada');
    expect(s?.motivoRechazo).toBe('Ahora mismo no puedo');
  });

  it('el motivo del rechazo es opcional', async () => {
    const { codigo } = await unaSolicitud();
    const s0 = await porCodigo(codigo);

    expect(await decidir(s0.token_profesor, 'rechazar')).toBe(true);
    expect((await porCodigo(codigo)).motivo_rechazo).toBeNull();
  });

  it('el mismo enlace no decide dos veces', async () => {
    const { codigo } = await unaSolicitud();
    const s0 = await porCodigo(codigo);

    expect(await decidir(s0.token_profesor, 'aceptar')).toBe(true);
    // El segundo intento no hace nada: sólo se decide sobre lo que espera.
    expect(await decidir(s0.token_profesor, 'rechazar')).toBe(false);
    expect((await porCodigo(codigo)).estado).toBe('aceptada');
  });

  it('un pago ya confirmado no se cobra dos veces', async () => {
    const { codigo } = await unaSolicitud();
    const s0 = await porCodigo(codigo);
    await decidir(s0.token_profesor, 'aceptar');

    const primera = await confirmarPago(codigo);
    const segunda = await confirmarPago(codigo);

    expect(primera.ok).toBe(true);
    expect(segunda.ok).toBe(false);
  });

  it('no se puede cobrar lo que el profesor no ha aceptado', async () => {
    const { codigo } = await unaSolicitud();
    const resultado = await confirmarPago(codigo);

    expect(resultado.ok).toBe(false);
    expect((await porCodigo(codigo)).estado).toBe('pendiente_profesor');
  });
});

// ---------------------------------------------------------------------------

describe('⭐ ningún teléfono antes de tiempo', () => {
  /*
   * La prueba que más importa de todo el fichero.
   *
   * Se recorren los estados en los que un teléfono NO puede aparecer, y se mira
   * el objeto entero que se le manda al navegador, no sólo lo que se pinta. Un
   * dato que viaja escondido en el HTML está igual de filtrado que uno impreso
   * en pantalla, y se descubre con dos clics.
   */
  /*
   * Cada estado va con su fecha. No es adorno: la tabla tiene una restricción
   * que rechaza una solicitud «aceptada» sin fecha de aceptación, y lo mismo
   * con las demás. Una fila a medias no puede existir ni siquiera en pruebas.
   */
  const sinTelefono = [
    { estado: 'pendiente_profesor', fechas: {} },
    { estado: 'aceptada', fechas: { aceptada_en: new Date() } },
    { estado: 'rechazada', fechas: { rechazada_en: new Date() } },
    { estado: 'caducada', fechas: {} },
    { estado: 'cancelada', fechas: { cancelada_en: new Date() } },
  ] as const;

  for (const { estado, fechas } of sinTelefono) {
    it(`en «${estado}» no viaja ningún teléfono`, async () => {
      const { codigo, token } = await unaSolicitud();
      await db.contactos.update({
        where: { codigo },
        data: { estado, ...fechas },
      });

      const vista = await porTokenFamilia(token);

      expect(vista?.estado).toBe(estado);
      expect(JSON.stringify(vista)).not.toContain('600000001');
    });
  }

  /*
   * ⭐ Y en «pagada» tampoco, que es lo que esta prueba existe para impedir.
   *
   * Antes el teléfono del profesor se le daba a la familia al confirmar el
   * pago, y estas dos pruebas comprobaban justamente eso. Se han invertido:
   * **una parte de los profesores es menor de edad**, así que su número no sale
   * de la plataforma en ningún estado. El contacto va en un solo sentido y es
   * el profesor quien escribe.
   *
   * Sin esta prueba, «que la familia vea el teléfono cuando ha pagado» es una
   * mejora razonable que cualquiera reintroduciría en diez minutos.
   */
  it('⭐ en «pagada» tampoco: el número del profesor no sale nunca', async () => {
    const { codigo, token } = await unaSolicitud();
    const s0 = await porCodigo(codigo);
    await decidir(s0.token_profesor, 'aceptar');
    await confirmarPago(codigo);

    const vista = await porTokenFamilia(token);
    expect(vista?.estado).toBe('pagada');
    expect(JSON.stringify(vista)).not.toContain('600000001');
  });

  it('⭐ en «devuelta» tampoco', async () => {
    const { codigo, token } = await unaSolicitud();
    const s0 = await porCodigo(codigo);
    await decidir(s0.token_profesor, 'aceptar');
    await confirmarPago(codigo);
    await db.contactos.update({
      where: { codigo },
      // «devuelta» exige además fecha de devolución, y que siga la de pago.
      data: { estado: 'devuelta', devuelta_en: new Date() },
    });

    expect(JSON.stringify(await porTokenFamilia(token))).not.toContain(
      '600000001',
    );
  });
});

// ---------------------------------------------------------------------------

describe('⭐ quedarse sin tarifa no regala contactos', () => {
  /*
   * Este es el fallo que encontramos revisando el plan de pruebas, y era de los
   * que no se ven: `precioVigente()` devolvía cero al no encontrar tarifa, y un
   * importe de cero significa «esto ya está pagado», así que **se abrían los
   * teléfonos de las dos partes sin que nadie pagara**. Bastaba con cerrar una
   * tarifa desde el panel y no abrir la siguiente.
   */
  it('sin tarifa vigente se usa la última cerrada, nunca cero', async () => {
    await quitarTarifaVigente();

    expect(await precioVigente()).toBe(10);
  });

  it('sin ninguna tarifa, revienta en vez de cobrar cero', async () => {
    await db.tarifas.deleteMany({});

    await expect(precioVigente()).rejects.toThrow(/tarifa/i);
  });

  it('una solicitud sin vale nunca sale a cero', async () => {
    await quitarTarifaVigente();
    const { codigo } = await unaSolicitud();

    expect(Number((await porCodigo(codigo)).importe)).toBeGreaterThan(0);
  });

  it('y al aceptarla NO se abre sola', async () => {
    await quitarTarifaVigente();
    const { codigo, token } = await unaSolicitud();
    const s0 = await porCodigo(codigo);

    await decidir(s0.token_profesor, 'aceptar');

    const vista = await porTokenFamilia(token);
    expect(vista?.estado).toBe('aceptada');
    expect(JSON.stringify(vista)).not.toContain('600000001');
  });
});

// ---------------------------------------------------------------------------

describe('«ya he hecho el Bizum»', () => {
  it('se apunta, pero no abre ningún teléfono', async () => {
    const { codigo, token } = await unaSolicitud();
    const s0 = await porCodigo(codigo);
    await decidir(s0.token_profesor, 'aceptar');

    expect(await familiaDiceQueHaPagado(token)).toBe(true);

    const s = await porCodigo(codigo);
    expect(s.pago_avisado_en).not.toBeNull();
    expect(s.estado).toBe('aceptada');
    expect(JSON.stringify(await porTokenFamilia(token))).not.toContain(
      '600000001',
    );
  });

  it('sólo se puede avisar una vez', async () => {
    const { codigo, token } = await unaSolicitud();
    const s0 = await porCodigo(codigo);
    await decidir(s0.token_profesor, 'aceptar');

    await familiaDiceQueHaPagado(token);
    // El segundo aviso no reinicia el reloj que pone en rojo los pagos que
    // llevan días esperando.
    expect(await familiaDiceQueHaPagado(token)).toBe(false);
  });

  it('no se puede avisar de un pago que nadie ha aceptado', async () => {
    const { token } = await unaSolicitud();

    expect(await familiaDiceQueHaPagado(token)).toBe(false);
  });
});
