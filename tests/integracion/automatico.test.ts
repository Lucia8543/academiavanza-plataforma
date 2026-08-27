import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/repositories/cliente';
import {
  borrarContactosViejos,
  caducarPagosSinRespuesta,
  caducarSolicitudes,
  pausarSinRespuesta,
} from '@/backend/services/mantenimiento';
import {
  confirmarPago,
  crearSolicitud,
  decidir,
  familiaDiceQueHaPagado,
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
 * Lo que la plataforma hace sola cada mañana.
 *
 * Estas tareas son las únicas que borran datos y las únicas que pueden dejar a
 * alguien fuera del directorio sin que nadie lo decida. Y son también las que
 * menos se notan cuando se rompen: la web sigue funcionando y nadie se queja.
 *
 * En estas pruebas el correo no está configurado —no hay RESEND_API_KEY— y eso
 * es deliberado: es el escenario en el que ya estuvo la plataforma durante
 * semanas, y donde estuvo a punto de vaciarse el directorio entero.
 */

async function unaAceptada() {
  const profesor = await crearProfesor();
  const nivelId = await unNivel();
  const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
  if (!alta.ok) throw new Error('no creada');

  const s = await porCodigo(alta.codigo);
  await decidir(s.token_profesor, 'aceptar');
  return { profesor, ...alta };
}

beforeEach(async () => {
  await limpiar();
  await ponerTarifa(10);
});

// ---------------------------------------------------------------------------

describe('caducar lo que nadie contesta', () => {
  it('a los 30 días sin respuesta del profesor', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: 31 });

    await caducarSolicitudes();

    expect((await porCodigo(alta.codigo)).estado).toBe('caducada');
  });

  it('a los 29 todavía no', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: 29 });

    await caducarSolicitudes();

    expect((await porCodigo(alta.codigo)).estado).toBe('pendiente_profesor');
  });

  it('una aceptada no caduca por esa vía: ahí la pelota es de la familia', async () => {
    const { codigo } = await unaAceptada();
    await envejecer(codigo, { enviado_en: 40 });

    await caducarSolicitudes();

    expect((await porCodigo(codigo)).estado).toBe('aceptada');
  });
});

// ---------------------------------------------------------------------------

describe('cerrar las aceptadas que no se pagan', () => {
  it('cinco días después del recordatorio', async () => {
    const { codigo } = await unaAceptada();
    await envejecer(codigo, { recordatorio_pago_en: 6 });

    await caducarPagosSinRespuesta();

    expect((await porCodigo(codigo)).estado).toBe('caducada');
  });

  it('⭐ y a los 14 días aunque el recordatorio nunca saliera', async () => {
    /*
     * La red. Sin ella, mientras el correo estuvo apagado, una solicitud
     * aceptada no caducaba jamás y el profesor se quedaba esperando para
     * siempre: la única forma de cerrar el asunto era que la familia se
     * rindiera.
     */
    const { codigo } = await unaAceptada();
    await envejecer(codigo, { aceptada_en: 15 });

    await caducarPagosSinRespuesta();

    expect((await porCodigo(codigo)).estado).toBe('caducada');
  });

  it('a los 13 todavía no', async () => {
    const { codigo } = await unaAceptada();
    await envejecer(codigo, { aceptada_en: 13 });

    await caducarPagosSinRespuesta();

    expect((await porCodigo(codigo)).estado).toBe('aceptada');
  });
});

// ---------------------------------------------------------------------------

describe('⭐ quien dice que ha pagado', () => {
  it('no se le cierra a los 14 días como a los demás', async () => {
    // Puede haber dinero de verdad esperando a que alguien lo mire.
    const { codigo, token } = await unaAceptada();
    await familiaDiceQueHaPagado(token);
    await envejecer(codigo, { aceptada_en: 15, pago_avisado_en: 15 });

    await caducarPagosSinRespuesta();

    expect((await porCodigo(codigo)).estado).toBe('aceptada');
  });

  it('pero a los 30 sí, que si no se queda viva para siempre', async () => {
    /*
     * Éste es el segundo fallo que encontramos, y es de los que uno se hace a
     * sí mismo: el botón se puso para no reclamarle el pago a quien ya había
     * pagado, y de paso le sacaba de TODOS los cierres. Como no comprueba nada
     * —ni puede, el Bizum se mira a mano— bastaba con pulsarlo sin pagar para
     * dejar al profesor esperando indefinidamente.
     */
    const { codigo, token } = await unaAceptada();
    await familiaDiceQueHaPagado(token);
    await envejecer(codigo, { aceptada_en: 31, pago_avisado_en: 31 });

    await caducarPagosSinRespuesta();

    expect((await porCodigo(codigo)).estado).toBe('caducada');
  });
});

// ---------------------------------------------------------------------------

describe('⭐ si el correo no sale, no se pausa a nadie', () => {
  /*
   * La salvaguarda más importante de todo el proceso automático.
   *
   * El recordatorio trimestral sólo cuenta como enviado si el correo salió de
   * verdad. Sin esa condición, con el correo apagado, el reloj de los catorce
   * días habría corrido igual para todo el mundo y **el directorio entero se
   * habría vaciado solo en dos semanas**, sin que ningún profesor supiera
   * siquiera que le habían preguntado.
   *
   * Aquí no hay RESEND_API_KEY, así que `enviar()` devuelve false. Es
   * exactamente el escenario en el que estuvo la plataforma.
   */
  it('el profesor sigue publicado aunque lleve meses sin confirmar', async () => {
    const profesor = await crearProfesor();
    await db.profesores.update({
      where: { id: profesor.id },
      data: {
        disponibilidad_confirmada_en: new Date(
          Date.now() - 120 * 24 * 60 * 60 * 1000,
        ),
        ultimo_recordatorio_en: null,
      },
    });

    await pausarSinRespuesta();

    const ficha = await db.profesores.findUniqueOrThrow({
      where: { id: profesor.id },
      select: { disponible: true },
    });
    expect(ficha.disponible).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('el borrado a los noventa días', () => {
  it('una solicitud sin pagar se borra entera', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: 91 });

    await borrarContactosViejos();

    const queda = await db.contactos.findUnique({
      where: { codigo: alta.codigo },
    });
    expect(queda).toBeNull();
  });

  it('una pagada se anonimiza, para no perder el rastro del dinero', async () => {
    const { codigo } = await unaAceptada();
    await confirmarPago(codigo);
    await envejecer(codigo, { enviado_en: 91 });

    await borrarContactosViejos();

    const s = await porCodigo(codigo);
    expect(s.nombre_familia).toBe('(borrado)');
    expect(s.telefono_familia).toBeNull();
    expect(s.email_familia).toBeNull();
    expect(s.mensaje).toBeNull();
    // Pero la fila sigue: el importe y la fecha de cobro no se tocan.
    expect(Number(s.importe)).toBe(10);
  });

  it('lo reciente no se toca', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: 80 });

    await borrarContactosViejos();

    expect((await porCodigo(alta.codigo)).telefono_familia).not.toBeNull();
  });
});
