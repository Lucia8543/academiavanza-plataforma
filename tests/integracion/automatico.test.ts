import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/repositories/cliente';
import {
  borrarContactosViejos,
  caducarPagosSinRespuesta,
  caducarSolicitudes,
  pausarSinRespuesta,
  recordarSolicitudesSinContestar,
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
  it('a los 5 días sin respuesta, que es el plazo por defecto', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: 6 });
    // Caducar exige que al profesor le llegara el aviso. Sin correo en las
    // pruebas, se marca a mano: lo contrario se comprueba más abajo.
    await db.contactos.update({
      where: { codigo: alta.codigo },
      data: { avisado_correo: true },
    });

    await caducarSolicitudes();

    expect((await porCodigo(alta.codigo)).estado).toBe('caducada');
  });

  it('a los 4 todavía no', async () => {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: 4 });

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

// ---------------------------------------------------------------------------

describe('⭐ al profesor se le recuerda antes de cerrarle nada', () => {
  /*
   * El agujero por el que se caía el recorrido entero: al profesor se le
   * mandaba un correo el primer día y **nunca más**, y la solicitud caducaba en
   * silencio treinta días después sin decirle nada a la familia.
   *
   * Aquí no hay correo ni avisos al móvil, así que lo que se comprueba es la
   * mitad que importa de verdad: **que un aviso que no ha salido no cuenta como
   * enviado**. Si contara, al profesor le entraría el mismo recordatorio todos
   * los días del segundo al séptimo, y se le cerraría la solicitud por un
   * silencio que no es suyo sino nuestro.
   */
  async function unaEsperando(dias: number, avisado = false) {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: dias });

    // Simula que el aviso inicial sí llegó, que es lo que pasa en producción
    // con Resend funcionando. Sin esto no se puede probar nada de lo que
    // depende de que el profesor esté enterado.
    if (avisado) {
      await db.contactos.update({
        where: { codigo: alta.codigo },
        data: { avisado_correo: true },
      });
    }

    return { profesor, ...alta };
  }

  it('un recordatorio que no sale no se apunta como enviado', async () => {
    const { codigo } = await unaEsperando(3);

    await recordarSolicitudesSinContestar();
    await recordarSolicitudesSinContestar();

    // Cero, y no dos: se reintentará mañana en vez de darlo por hecho.
    expect((await porCodigo(codigo)).recordatorios_profesor).toBe(0);
    expect((await porCodigo(codigo)).recordatorio_profesor_en).toBeNull();
  });

  it('el primer día no le toca recordatorio ni aunque saliera', async () => {
    const { codigo } = await unaEsperando(1, true);

    await recordarSolicitudesSinContestar();

    expect((await porCodigo(codigo)).recordatorios_profesor).toBe(0);
  });

  it('una ya aceptada no recibe recordatorios de contestar', async () => {
    const { codigo } = await unaAceptada();
    await envejecer(codigo, { enviado_en: 6 });

    await recordarSolicitudesSinContestar();

    expect((await porCodigo(codigo)).recordatorios_profesor).toBe(0);
  });
});

// ---------------------------------------------------------------------------

describe('⭐ cada solicitud caduca a su plazo, no al de todas', () => {
  /*
   * La prueba que faltaba, y que habría cazado el fallo de golpe: durante un
   * rato la urgencia elegida por la familia **no llegaba al servidor**. El
   * formulario pintaba las tres opciones, el navegador las enviaba, y la acción
   * las tiraba. Como el esquema tiene valor por defecto, todo el mundo acababa
   * con cinco días sin una sola excepción ni una línea en el registro.
   *
   * Una familia que elegía «para más adelante» leía en pantalla «treinta días»,
   * recibía un correo que decía treinta, y se le cerraba a los seis.
   */
  async function conPlazo(urgencia: 'ya' | 'semanas' | 'adelante', dias: number) {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(
      profesor.slug,
      datosDeFamilia({ nivelId, urgencia }),
    );
    if (!alta.ok) throw new Error(`no creada: ${alta.motivo}`);
    await envejecer(alta.codigo, { enviado_en: dias });
    await db.contactos.update({
      where: { codigo: alta.codigo },
      data: { avisado_correo: true },
    });
    return alta.codigo;
  }

  it('la urgencia elegida se guarda de verdad', async () => {
    const codigo = await conPlazo('adelante', 0);
    expect((await porCodigo(codigo)).urgencia).toBe('adelante');
  });

  it('⭐ una de treinta días sigue viva a los seis', async () => {
    const codigo = await conPlazo('adelante', 6);

    await caducarSolicitudes();

    expect((await porCodigo(codigo)).estado).toBe('pendiente_profesor');
  });

  it('y se cierra pasados los treinta y uno', async () => {
    const codigo = await conPlazo('adelante', 31);

    await caducarSolicitudes();

    expect((await porCodigo(codigo)).estado).toBe('caducada');
  });

  it('una de quince aguanta diez días y no dieciséis', async () => {
    const viva = await conPlazo('semanas', 10);
    const muerta = await conPlazo('semanas', 16);

    await caducarSolicitudes();

    expect((await porCodigo(viva)).estado).toBe('pendiente_profesor');
    expect((await porCodigo(muerta)).estado).toBe('caducada');
  });
});

// ---------------------------------------------------------------------------

describe('⭐ no se cierra lo que el profesor nunca supo', () => {
  /*
   * La regla que evita convertir un fallo nuestro en culpa suya. Si no le salió
   * ni el correo ni el aviso al móvil, su silencio no es suyo: cerrar la
   * solicitud y decirle a la familia «no ha contestado» sería contarle una
   * mentira, y de paso empujar al profesor hacia la pausa automática.
   *
   * Esas solicitudes no se pierden: salen en el panel y en el correo diario
   * como profesores sin avisar, que es donde tiene que verlas una persona.
   */
  async function deDiasSinContestar(dias: number, avisado: boolean) {
    const profesor = await crearProfesor();
    const nivelId = await unNivel();
    const alta = await crearSolicitud(profesor.slug, datosDeFamilia({ nivelId }));
    if (!alta.ok) throw new Error('no creada');
    await envejecer(alta.codigo, { enviado_en: dias });
    await db.contactos.update({
      where: { codigo: alta.codigo },
      data: { avisado_correo: avisado },
    });
    return alta.codigo;
  }

  it('si se le avisó, pasado su plazo se cierra', async () => {
    const codigo = await deDiasSinContestar(6, true);

    await caducarSolicitudes();

    expect((await porCodigo(codigo)).estado).toBe('caducada');
  });

  it('si no se le avisó, sigue viva por muchos días que pasen', async () => {
    const codigo = await deDiasSinContestar(40, false);

    await caducarSolicitudes();

    expect((await porCodigo(codigo)).estado).toBe('pendiente_profesor');
  });
});

// ---------------------------------------------------------------------------

describe('⭐ cinco solicitudes sin contestar le cuestan la ficha', () => {
  /*
   * Cinco y no dos: dos es un despiste en época de exámenes, cinco es que no
   * está. Lo que hace justa la regla no es el número, sino que el profesor lo
   * ve venir con el contador de su panel y con el aviso de cada recordatorio.
   */
  async function caducarUna(profesor: { slug: string }, telefono: string) {
    const nivelId = await unNivel();
    const alta = await crearSolicitud(
      profesor.slug,
      datosDeFamilia({ nivelId, telefono }),
    );
    if (!alta.ok) throw new Error(`no creada: ${alta.motivo}`);
    await envejecer(alta.codigo, { enviado_en: 6 });
    await db.contactos.update({
      where: { codigo: alta.codigo },
      data: { avisado_correo: true },
    });
    await caducarSolicitudes();
  }

  // Teléfonos distintos: el freno antiabuso no deja al mismo número escribir
  // dos veces al mismo profesor en siete días.
  const TELEFONOS = [
    '600000011',
    '600000022',
    '600000033',
    '600000044',
    '600000055',
  ];

  it('con cuatro sigue en el directorio', async () => {
    const profesor = await crearProfesor();
    for (const t of TELEFONOS.slice(0, 4)) await caducarUna(profesor, t);

    const ficha = await db.profesores.findUniqueOrThrow({
      where: { id: profesor.id },
      select: { disponible: true, pausada_auto_en: true },
    });

    expect(ficha.disponible).toBe(true);
    expect(ficha.pausada_auto_en).toBeNull();
  });

  it('con cinco sale, y marcado como pausa automática', async () => {
    const profesor = await crearProfesor();
    for (const t of TELEFONOS) await caducarUna(profesor, t);

    const ficha = await db.profesores.findUniqueOrThrow({
      where: { id: profesor.id },
      select: { disponible: true, pausada_auto_en: true },
    });

    expect(ficha.disponible).toBe(false);
    expect(ficha.pausada_auto_en).not.toBeNull();
  });
});
