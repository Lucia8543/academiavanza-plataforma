import { randomBytes, randomInt } from 'node:crypto';
import { db } from '@/backend/repositories/cliente';
import { precioVigente } from '@/backend/repositories/tarifas';
import { tokenDelPanel } from '@/backend/services/acceso-profesor';
import { avisar } from '@/backend/services/avisos';
import { enviar } from '@/backend/services/correo';
import { puedeEscribir } from '@/backend/services/limites';
import {
  correoContactoAbierto,
  correoDevolucion,
  correoFamiliaNoSigue,
  correoFichaPausada,
  correoPagoConfirmado,
  correoProfesorAcepta,
  correoProfesorRechaza,
  correoSolicitud,
  correoSolicitudRecibida,
} from '@/backend/services/plantillas-correo';
import type { DatosContacto } from '@/shared/schemas/contacto';
import { nombrePublico } from '@/backend/repositories/directorio';
import { formatearTelefono } from '@/shared/schemas/telefono';
import {
  MOTIVOS_SIN_PAGAR,
  MOTIVOS_TRAS_HABLAR,
  type MotivoCierre,
} from '@/shared/textos/motivos-cierre';

/**
 * El recorrido completo de una solicitud.
 *
 * Todo lo que cambia el estado de una solicitud pasa por aquí, y por ningún
 * otro sitio. La razón no es de estilo: cada uno de estos cambios decide si un
 * teléfono se enseña o no, y esa decisión no puede estar repartida por cuatro
 * pantallas.
 */

/**
 * Alfabeto del código del Bizum.
 *
 * Sin ceros ni oes, sin unos ni íes ni eles. La familia lo va a leer de una
 * pantalla y a teclearlo en el móvil del banco, y Lucía lo va a leer de la
 * notificación del Bizum y a teclearlo en el panel. Dos oportunidades de
 * confundir un 0 con una O, y un código mal escrito es un pago que no aparece.
 */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LARGO_CODIGO = 5;

function codigoNuevo(): string {
  let codigo = '';
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return codigo;
}

/** Direcciones privadas. 32 bytes: no se adivinan probando. */
function tokenNuevo(): string {
  return randomBytes(32).toString('base64url');
}

export type ResultadoAlta =
  | { ok: true; token: string; codigo: string }
  | { ok: false; motivo: 'no-disponible' | 'error' }
  | { ok: false; motivo: 'demasiadas'; explicacion: string };

/**
 * Una familia escribe a un profesor.
 *
 * Guarda la solicitud, **sin pasarle el teléfono a nadie**, y devuelve la
 * dirección privada donde la familia podrá seguirla. El profesor recibe un
 * aviso con el enlace donde decide; si el correo está apagado, ese aviso lo da
 * Lucía desde el panel.
 */
export async function crearSolicitud(
  slug: string,
  datos: DatosContacto,
  valeCodigo?: string,
): Promise<ResultadoAlta> {
  const profesor = await db.profesores.findFirst({
    where: { slug, estado: 'activo', disponible: true },
    select: { id: true, nombre: true, apellidos: true, email: true },
  });


  if (!profesor) return { ok: false, motivo: 'no-disponible' };

  // Antes de guardar nada: ¿este teléfono está escribiendo a medio directorio?
  const permiso = await puedeEscribir(datos.telefono, profesor.id);
  if (!permiso.permitido) {
    return { ok: false, motivo: 'demasiadas', explicacion: permiso.motivo };
  }

  /*
   * Un vale sólo vale una vez, sólo si es de una solicitud que se pagó, y sólo
   * dentro de plazo.
   *
   * Lo del plazo es reciente y arregla un agujero de los silenciosos: sin la
   * fecha, un vale de hace dos años seguía siendo canjeable, porque la limpieza
   * de datos anonimiza las solicitudes pagadas pero no las borra.
   */
  const vale = valeCodigo
    ? await db.contactos.findFirst({
        where: {
          codigo: valeCodigo.trim().toUpperCase(),
          estado: 'pagada',
          vale_concedido: true,
          vale_caduca_en: { gt: new Date() },
        },
        select: { id: true },
      })
    : null;

  const importe = vale ? 0 : await precioVigente();

  try {
    const solicitud = await db.contactos.create({
      data: {
        profesor_id: profesor.id,
        nombre_familia: datos.nombreFamilia,
        telefono_familia: datos.telefono,
        email_familia: datos.email,
        nivel_id: datos.nivelId,
        mensaje: datos.mensaje || null,
        es_tutor_legal: datos.esTutorLegal,
        acepta_privacidad: datos.aceptaPrivacidad,

        estado: 'pendiente_profesor',
        codigo: await codigoLibre(),
        token_familia: tokenNuevo(),
        token_profesor: tokenNuevo(),
        importe,
        vale_de: vale?.id ?? null,
      },
      select: {
        id: true,
        codigo: true,
        token_familia: true,
        token_profesor: true,
        importe: true,
      },
    });

    // Gastar el vale es quitárselo a la solicitud vieja, no borrar nada: así
    // queda el rastro de que existió y de dónde se fue.
    if (vale) {
      await db.contactos.update({
        where: { id: vale.id },
        // La fecha se va con el vale. Dejarla puesta sobre un vale ya gastado
        // sería un dato que no significa nada, y la restricción de la base de
        // datos exige que las dos cosas vayan juntas.
        data: { vale_concedido: false, vale_caduca_en: null },
      });
    }

    await avisarAlProfesor(
      profesor,
      datos,
      solicitud.token_profesor,
      solicitud.id,
    );

    // Y a la familia, su resguardo. Es lo que sustituye a «guarda esta página o
    // te quedas sin nada»: aunque cierre el navegador sin apuntar el enlace, lo
    // tiene en su correo.
    await enviar(
      correoSolicitudRecibida({
        para: datos.email,
        nombreFamilia: datos.nombreFamilia,
        nombreProfesor: nombrePublico(profesor.nombre, profesor.apellidos),
        tokenFamilia: solicitud.token_familia,
        codigo: solicitud.codigo,
      }),
    );

    return {
      ok: true,
      token: solicitud.token_familia,
      codigo: solicitud.codigo,
    };
  } catch (error) {
    console.error('[solicitud] no se ha podido crear:', error);
    return { ok: false, motivo: 'error' };
  }
}

/**
 * Un código que no esté cogido.
 *
 * Con cinco caracteres de un alfabeto de treinta y uno hay veintiocho millones
 * de combinaciones, así que la colisión es rarísima. Pero «rarísima» no es
 * «imposible», y dos solicitudes con el mismo código serían dos familias
 * pagando al mismo sitio. Se comprueba.
 */
async function codigoLibre(): Promise<string> {
  for (let intento = 0; intento < 10; intento++) {
    const codigo = codigoNuevo();
    const cogido = await db.contactos.findUnique({
      where: { codigo },
      select: { id: true },
    });
    if (!cogido) return codigo;
  }
  throw new Error('No se ha podido generar un código libre en diez intentos');
}

// -----------------------------------------------------------------------------
// El profesor decide
// -----------------------------------------------------------------------------

export type Decision = 'aceptar' | 'rechazar';

export async function decidir(
  tokenProfesor: string,
  decision: Decision,
  motivo?: string,
): Promise<boolean> {
  // Sólo se puede decidir sobre lo que sigue esperando. Un enlace reenviado o
  // pulsado dos veces no debe deshacer nada.
  const solicitud = await db.contactos.findFirst({
    where: { token_profesor: tokenProfesor, estado: 'pendiente_profesor' },
    select: {
      id: true,
      codigo: true,
      token_familia: true,
      email_familia: true,
      nombre_familia: true,
      importe: true,
      profesores: { select: { nombre: true, apellidos: true } },
    },
  });

  if (!solicitud) return false;

  await db.contactos.update({
    where: { id: solicitud.id },
    data:
      decision === 'aceptar'
        ? { estado: 'aceptada', aceptada_en: new Date() }
        : {
            estado: 'rechazada',
            rechazada_en: new Date(),
            motivo_rechazo: motivo?.trim() || null,
          },
  });

  /*
   * Un contacto que no cuesta nada se abre solo.
   *
   * Pasa cuando la familia ha gastado un vale: el importe es cero y nadie va a
   * hacer un Bizum de cero euros. Antes esto le decía «escríbenos y te lo
   * abrimos», o sea que el vale que existe para no depender de nadie dependía
   * de alguien.
   *
   * Se cobra a sí mismo, en el sentido de que pasa por el mismo camino que un
   * pago normal: se abren los teléfonos y salen los mismos avisos.
   */
  if (decision === 'aceptar' && Number(solicitud.importe ?? 0) === 0) {
    await confirmarPago(solicitud.codigo);
    return true;
  }

  // La familia se entera sin tener que estar mirando su página. Es el aviso más
  // rentable de todos: cuando acepta, hay que pagar, y quien no se entera no
  // paga.
  if (solicitud.email_familia) {
    const profesor = nombrePublico(
      solicitud.profesores.nombre,
      solicitud.profesores.apellidos,
    );

    await enviar(
      decision === 'aceptar'
        ? correoProfesorAcepta({
            para: solicitud.email_familia,
            nombreFamilia: solicitud.nombre_familia,
            nombreProfesor: profesor,
            tokenFamilia: solicitud.token_familia,
            codigo: solicitud.codigo,
            importe: Number(solicitud.importe ?? 0),
          })
        : correoProfesorRechaza({
            para: solicitud.email_familia,
            nombreFamilia: solicitud.nombre_familia,
            nombreProfesor: profesor,
            motivo: motivo?.trim() || null,
          }),
    );
  }

  return true;
}

// -----------------------------------------------------------------------------
// El pago
// -----------------------------------------------------------------------------

export type ResultadoPago =
  | { ok: true; nombreFamilia: string; profesor: string; importe: number }
  | { ok: false; motivo: 'no-existe' | 'estado-incorrecto' };

/** Busca un código para poder mirarlo antes de confirmar nada. */
export async function buscarPorCodigo(codigo: string) {
  return db.contactos.findUnique({
    where: { codigo: codigo.trim().toUpperCase() },
    select: {
      codigo: true,
      estado: true,
      nombre_familia: true,
      telefono_familia: true,
      importe: true,
      enviado_en: true,
      niveles: { select: { nombre: true } },
      profesores: { select: { nombre: true, apellidos: true } },
    },
  });
}

/**
 * Lucía confirma que el Bizum ha llegado.
 *
 * Es el único punto de todo el sistema donde se abren los teléfonos, y por eso
 * exige que la solicitud esté aceptada: no se puede pagar por un contacto que
 * el profesor no ha aprobado, ni pagar dos veces el mismo.
 */
export async function confirmarPago(codigo: string): Promise<ResultadoPago> {
  const solicitud = await db.contactos.findUnique({
    where: { codigo: codigo.trim().toUpperCase() },
    select: {
      id: true,
      profesor_id: true,
      estado: true,
      nombre_familia: true,
      telefono_familia: true,
      email_familia: true,
      token_familia: true,
      mensaje: true,
      importe: true,
      niveles: { select: { nombre: true } },
      profesores: {
        select: { nombre: true, apellidos: true, email: true, telefono: true },
      },
    },
  });

  if (!solicitud) return { ok: false, motivo: 'no-existe' };
  if (solicitud.estado !== 'aceptada') {
    return { ok: false, motivo: 'estado-incorrecto' };
  }

  await db.contactos.update({
    where: { id: solicitud.id },
    data: { estado: 'pagada', pagada_en: new Date() },
  });

  await avisarDelPago(solicitud);

  // Y a la familia, con el teléfono dentro. Es el momento por el que ha pagado:
  // no debería tener que volver a una página a buscarlo.
  if (solicitud.email_familia) {
    await enviar(
      correoPagoConfirmado({
        para: solicitud.email_familia,
        nombreFamilia: solicitud.nombre_familia,
        nombreProfesor: nombrePublico(
          solicitud.profesores.nombre,
          solicitud.profesores.apellidos,
        ),
        telefonoProfesor: formatearTelefono(solicitud.profesores.telefono ?? ''),
        tokenFamilia: solicitud.token_familia,
      }),
    );
  }

  return {
    ok: true,
    nombreFamilia: solicitud.nombre_familia,
    profesor: nombrePublico(
      solicitud.profesores.nombre,
      solicitud.profesores.apellidos,
    ),
    importe: Number(solicitud.importe ?? 0),
  };
}

/** Le da a una familia derecho a otro contacto sin pagar. Desde el panel. */
export async function concederVale(codigo: string): Promise<boolean> {
  const solicitud = await db.contactos.findFirst({
    where: { codigo: codigo.trim().toUpperCase(), estado: 'pagada' },
    select: { id: true },
  });

  if (!solicitud) return false;

  await db.contactos.update({
    where: { id: solicitud.id },
    data: { vale_concedido: true, vale_caduca_en: caducidadDelVale() },
  });

  return true;
}

/**
 * La familia contesta al recordatorio de pago.
 *
 * «Sí» no cobra nada: sólo apunta la intención, para que el panel distinga a
 * quien dijo que iba a pagar de quien no contestó. «No» cierra la solicitud y
 * avisa al profesor, que lleva días esperando.
 */
export async function responderAlRecordatorio(
  tokenFamilia: string,
  va: boolean,
  motivo?: MotivoCierre,
): Promise<boolean> {
  const solicitud = await db.contactos.findFirst({
    where: { token_familia: tokenFamilia, estado: 'aceptada' },
    select: {
      id: true,
      nombre_familia: true,
      niveles: { select: { nombre: true } },
      profesores: { select: { nombre: true, email: true } },
    },
  });

  if (!solicitud) return false;

  /*
   * El motivo se guarda sólo al irse, y sólo si es de la lista de quien no ha
   * llegado a pagar. Un motivo de los de «ya hemos hablado» aquí no tendría
   * sentido: esta familia y este profesor no han hablado nunca.
   */
  const cierre =
    !va && motivo && MOTIVOS_SIN_PAGAR.includes(motivo) ? motivo : null;

  await db.contactos.update({
    where: { id: solicitud.id },
    data: va
      ? { intencion_pago: 'si' }
      : {
          intencion_pago: 'no',
          estado: 'cancelada',
          cancelada_en: new Date(),
          ...(cierre
            ? { motivo_cierre: cierre, motivo_cierre_en: new Date() }
            : {}),
        },
  });

  if (!va) {
    await enviar(
      correoFamiliaNoSigue({
        para: solicitud.profesores.email,
        nombreProfesor: solicitud.profesores.nombre,
        nombreFamilia: solicitud.nombre_familia,
        nivel: solicitud.niveles?.nombre ?? null,
        seRetiro: true,
      }),
    );
  }

  return true;
}

/**
 * «Ya he hecho el Bizum».
 *
 * Esto no es un pago. No abre ningún teléfono, no cambia el estado y no se fía
 * de nadie: el contacto sigue cerrado hasta que Lucía vea el Bizum de verdad.
 *
 * Lo que arregla es otra cosa. Confirmar los pagos es manual, así que entre que
 * una familia paga y alguien lo comprueba pasan horas o días, y durante ese rato
 * la plataforma la trata como si no hubiera pagado: le reclama el pago a los dos
 * días y le cierra la solicitud a los siete. Cobrarle a alguien y luego echarle
 * es la peor cosa que puede hacer este sistema, y era cuestión de tiempo.
 *
 * Mentir aquí no sirve para nada, que es lo que lo hace seguro. Quien lo pulse
 * sin haber pagado consigue exactamente lo mismo que si no lo pulsa: esperar.
 *
 * No confundir con `avisarDelPago`, que es la de más abajo y hace lo contrario:
 * avisar al profesor de que el pago ya está confirmado y puede llamar.
 */
export async function familiaDiceQueHaPagado(
  tokenFamilia: string,
): Promise<boolean> {
  const { count } = await db.contactos.updateMany({
    // Sólo desde «aceptada», y sólo una vez. Repetirlo reiniciaría el reloj que
    // pone en rojo los pagos que llevan días sin comprobar, y ese reloj existe
    // justamente para que nadie se quede esperando en silencio.
    where: {
      token_familia: tokenFamilia,
      estado: 'aceptada',
      pago_avisado_en: null,
    },
    data: { pago_avisado_en: new Date() },
  });

  return count > 0;
}

/**
 * La familia corrige su correo.
 *
 * Sólo se puede desde su propia página, que es donde llega justo después de
 * enviar el formulario: el momento exacto en que se da cuenta de que escribió
 * «gmial». Después de eso ya no vuelve, porque no le llega ningún correo.
 */
export async function corregirCorreo(
  tokenFamilia: string,
  email: string,
): Promise<boolean> {
  const limpio = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) return false;

  const solicitud = await db.contactos.findUnique({
    where: { token_familia: tokenFamilia },
    select: { id: true },
  });

  if (!solicitud) return false;

  await db.contactos.update({
    where: { id: solicitud.id },
    data: { email_familia: limpio },
  });

  return true;
}

/**
 * Se ha devuelto el dinero.
 *
 * Lo apunta Lucía después de hacer el Bizum de vuelta. La plataforma no mueve
 * dinero, pero sí tiene que saber que se movió: sin esto, una devolución es un
 * apunte suelto en un banco y dentro de dos meses no hay forma de saber a quién
 * fue ni por qué.
 *
 * Los teléfonos siguen visibles después de devolver. Ya hablaron; quitarles el
 * número a estas alturas no protege a nadie.
 */
export async function registrarDevolucion(
  codigo: string,
  importe: number,
  motivo: string,
): Promise<boolean> {
  const solicitud = await db.contactos.findFirst({
    where: { codigo: codigo.trim().toUpperCase(), estado: 'pagada' },
    select: {
      id: true,
      nombre_familia: true,
      email_familia: true,
      token_familia: true,
    },
  });

  if (!solicitud) return false;

  await db.contactos.update({
    where: { id: solicitud.id },
    data: {
      estado: 'devuelta',
      devuelta_en: new Date(),
      importe_devuelto: importe,
      motivo_devolucion: motivo.trim() || 'Sin motivo indicado',
      // Un vale sin usar deja de tener sentido: ya se le ha devuelto el dinero.
      // La fecha se va con él, que es lo que exige la base de datos y lo que
      // evita dejar una caducidad colgando de un vale que ya no existe.
      vale_concedido: false,
      vale_caduca_en: null,
    },
  });

  // Un Bizum de vuelta sin explicación desconcierta más que tranquiliza.
  if (solicitud.email_familia) {
    await enviar(
      correoDevolucion({
        para: solicitud.email_familia,
        nombreFamilia: solicitud.nombre_familia,
        importe,
        tokenFamilia: solicitud.token_familia,
      }),
    );
  }

  return true;
}

// -----------------------------------------------------------------------------
// El vale que se pide solo
// -----------------------------------------------------------------------------

/** Días que hay que esperar tras pagar antes de poder decir que no hubo contacto. */
export const DIAS_PARA_RECLAMAR = 3;

/** Vales que ha provocado un profesor antes de que su ficha se pause sola. */
const VALES_PARA_PAUSAR = 2;

/**
 * Días que dura un contacto gratis desde que se concede.
 *
 * Antes no duraba nada porque duraba siempre. El código daba por hecho que el
 * vale moría con su solicitud a los noventa días, y era falso: la limpieza no
 * borra las solicitudes pagadas, las anonimiza, y no tocaba `vale_concedido`.
 * Así que el vale seguía siendo canjeable indefinidamente mientras un correo
 * avisaba de una caducidad que no existía.
 *
 * Noventa días es el mismo plazo que se le prometió a la familia en la política
 * de privacidad para sus datos. Que las dos cosas caduquen a la vez no es
 * casualidad: pasado ese punto ya no queda nada suyo con lo que rehacer nada.
 */
export const DIAS_DE_VALE = 90;

function caducidadDelVale(): Date {
  return new Date(Date.now() + DIAS_DE_VALE * 24 * 60 * 60 * 1000);
}

export type MotivoVale = 'sin-contacto' | 'no-funciono';

export type ResultadoVale =
  | { ok: true }
  | {
      ok: false;
      motivo:
        | 'no-existe'
        | 'no-pagada'
        | 'demasiado-pronto'
        | 'ya-lo-tiene'
        | 'falta-motivo';
    };

/**
 * La familia pide su contacto gratis, ella sola.
 *
 * Antes esto lo concedía Lucía leyendo un correo. Ahora lo pide la familia
 * desde su propia página y se le da al momento, porque el peor rato para
 * depender de que alguien conteste es justo cuando has pagado y no ha
 * funcionado.
 *
 * Hay dos frenos, y ninguno estorba a quien va de buena fe:
 *
 *   - Tres días desde el pago. Un profesor puede tardar un día en llamar, y
 *     reclamar a las dos horas es reclamar antes de que haya pasado nada.
 *   - Un vale activo a la vez. No se pueden acumular para gastarlos de golpe.
 *
 * No hay límite de cuántos puede pedir en total: si a alguien no le funciona
 * tres veces, el problema no es suyo. Las cadenas largas salen marcadas en el
 * panel para poder mirarlas, pero no se bloquean.
 */
export async function pedirVale(
  tokenFamilia: string,
  motivo: MotivoVale,
  detalle?: MotivoCierre,
): Promise<ResultadoVale> {
  const solicitud = await db.contactos.findUnique({
    where: { token_familia: tokenFamilia },
    select: {
      id: true,
      estado: true,
      pagada_en: true,
      vale_concedido: true,
      profesor_id: true,
      telefono_familia: true,
    },
  });

  if (!solicitud) return { ok: false, motivo: 'no-existe' };
  if (solicitud.estado !== 'pagada') return { ok: false, motivo: 'no-pagada' };
  if (solicitud.vale_concedido) return { ok: false, motivo: 'ya-lo-tiene' };

  /*
   * Quien dice que habló y no funcionó tiene que decir por qué.
   *
   * Se comprueba aquí y no sólo en el formulario porque el formulario se puede
   * saltar: la acción del servidor es lo único que ve de verdad toda petición.
   *
   * «No conseguí hablar con él» no lleva pregunta añadida: el motivo ya es el
   * botón. Preguntarle a esa familia «¿y por qué no?» sería pedirle que
   * adivinara algo que precisamente no sabe.
   */
  const cierre: MotivoCierre | null =
    motivo === 'sin-contacto'
      ? 'sin-contacto'
      : detalle && MOTIVOS_TRAS_HABLAR.includes(detalle)
        ? detalle
        : null;

  if (!cierre) return { ok: false, motivo: 'falta-motivo' };

  const dias =
    (Date.now() - new Date(solicitud.pagada_en ?? new Date()).getTime()) /
    (1000 * 60 * 60 * 24);

  // Sólo se espera para decir que no hubo contacto. Quien ya ha dado clases y
  // dice que no funcionó no tiene por qué esperar a nada.
  if (motivo === 'sin-contacto' && dias < DIAS_PARA_RECLAMAR) {
    return { ok: false, motivo: 'demasiado-pronto' };
  }

  await db.contactos.update({
    where: { id: solicitud.id },
    data: {
      vale_concedido: true,
      vale_caduca_en: caducidadDelVale(),
      motivo_vale: motivo,
      vale_pedido_en: new Date(),
      motivo_cierre: cierre,
      motivo_cierre_en: new Date(),
    },
  });

  if (motivo === 'sin-contacto') {
    await revisarProfesor(solicitud.profesor_id);
  }

  return { ok: true };
}

/**
 * Un profesor al que dos familias no han conseguido localizar.
 *
 * Se le pausa la ficha. No es un castigo ni una acusación: puede haber cambiado
 * de número, estar de exámenes o haberse olvidado de que se dio de alta. Pero
 * mientras eso pase, cada familia que le escriba va a perder tiempo y dinero, y
 * eso hay que cortarlo sin esperar a que alguien lo mire.
 *
 * Se pausa, no se borra: vuelve con un botón desde su propio enlace.
 *
 * Sólo cuentan los vales por «no conseguí hablar con él». Que dos familias
 * hayan dado clases y no hayan encajado no dice nada malo de nadie.
 */
async function revisarProfesor(profesorId: string): Promise<void> {
  /*
   * Se cuentan sólo los de los últimos tres meses.
   *
   * Contarlos desde el principio de los tiempos tenía un efecto que no se ve
   * hasta el segundo año: pasados dos incidentes, el profesor se queda con el
   * gatillo puesto para siempre, y cualquier vale posterior —aunque sea dos
   * años después y con una racha impecable en medio— le vuelve a pausar la
   * ficha al instante.
   *
   * Lo que interesa saber no es «¿ha fallado alguna vez?» sino «¿está fallando
   * ahora?». Una ventana de tres meses responde a la segunda pregunta.
   */
  const desde = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const vales = await db.contactos.count({
    where: {
      profesor_id: profesorId,
      motivo_vale: 'sin-contacto',
      vale_pedido_en: { gt: desde },
    },
  });

  if (vales < VALES_PARA_PAUSAR) return;

  const profesor = await db.profesores.update({
    where: { id: profesorId },
    data: { disponible: false, pausada_auto_en: new Date() },
    select: { id: true, nombre: true, email: true },
  });

  const token = await tokenDelPanel(profesor.id);

  /*
   * Por los dos canales, no sólo por correo.
   *
   * A este profesor le acaba de desaparecer la ficha del directorio sin que él
   * haya hecho nada, y sin enterarse no va a volver: no tiene ningún motivo para
   * entrar a mirar una página que él cree publicada. Si el correo se pierde
   * —cae en spam, la dirección estaba mal escrita, el servicio falla ese día— el
   * resultado es un profesor perdido para siempre y un hueco en el directorio
   * que nadie sabe explicar.
   *
   * Con el aviso al móvil hay una segunda oportunidad, para quien lo tenga
   * activado. Y para quien no, queda la lista del panel.
   */
  await avisar(
    profesor.id,
    {
      titulo: 'Hemos pausado tu ficha',
      cuerpo: 'Dos familias no han conseguido hablar contigo. Entra y cuéntanos.',
      url: `/mi-ficha/${token}`,
      etiqueta: `pausada-${profesor.id}`,
    },
    correoFichaPausada({
      para: profesor.email,
      nombreProfesor: profesor.nombre,
      tokenPanel: token,
      familias: vales,
    }),
  );
}

// -----------------------------------------------------------------------------
// Avisos
// -----------------------------------------------------------------------------

async function avisarAlProfesor(
  profesor: { id: string; nombre: string; email: string },
  datos: DatosContacto,
  tokenProfesor: string,
  solicitudId: string,
): Promise<void> {
  const nivel = await db.niveles.findUnique({
    where: { id: datos.nivelId },
    select: { nombre: true },
  });

  const ruta = `/aceptar/${tokenProfesor}`;

  const resultado = await avisar(
    profesor.id,
    {
      titulo: 'Una familia quiere clases contigo',
      cuerpo: `${nivel?.nombre ?? 'Nueva solicitud'} · toca para contestar`,
      url: ruta,
      etiqueta: `solicitud-${solicitudId}`,
    },
    correoSolicitud({
      para: profesor.email,
      nombreProfesor: profesor.nombre,
      nivel: nivel?.nombre ?? 'sin especificar',
      mensaje: datos.mensaje || null,
      tokenProfesor,
      tokenPanel: await tokenDelPanel(profesor.id),
      importe: await precioVigente(),
    }),
  );

  // Se apunta por dónde salió. Cuando una solicitud lleve tres días parada, la
  // pregunta será si el profesor se enteró, y sin esto no hay respuesta.
  await db.contactos.update({
    where: { id: solicitudId },
    data: {
      avisado_push: resultado.push,
      avisado_correo: resultado.correo,
    },
  });
}

async function avisarDelPago(solicitud: {
  id: string;
  profesor_id: string;
  nombre_familia: string;
  telefono_familia: string | null;
  mensaje: string | null;
  niveles: { nombre: string } | null;
  profesores: { nombre: string; email: string };
}): Promise<void> {
  await avisar(
    solicitud.profesor_id,
    {
      titulo: `Ya puedes llamar a ${solicitud.nombre_familia}`,
      cuerpo: formatearTelefono(solicitud.telefono_familia ?? ''),
      url: '/',
      etiqueta: `pagada-${solicitud.id}`,
    },
    correoContactoAbierto({
      para: solicitud.profesores.email,
      nombreProfesor: solicitud.profesores.nombre,
      nombreFamilia: solicitud.nombre_familia,
      telefonoFamilia: formatearTelefono(solicitud.telefono_familia ?? ''),
      nivel: solicitud.niveles?.nombre ?? 'sin especificar',
      mensaje: solicitud.mensaje,
      tokenPanel: await tokenDelPanel(solicitud.profesor_id),
    }),
  );
}
