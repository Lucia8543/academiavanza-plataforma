import { db } from '@/backend/repositories/cliente';
import { nombrePublico } from '@/backend/repositories/directorio';
import { tokenDelPanel } from '@/backend/services/acceso-profesor';
import { avisar } from '@/backend/services/avisos';
import { enviar } from '@/backend/services/correo';
import {
  correoConfirmarDisponibilidad,
  correoFamiliaNoSigue,
  correoFichaPausadaSinContestar,
  correoRecordatorioPago,
  correoResumenDiario,
  correoSolicitudCaducada,
  correoSolicitudSinContestar,
  correoValeCaduca,
} from '@/backend/services/plantillas-correo';
import { caducadasSinContestar } from '@/backend/repositories/mi-ficha';
import {
  loQueEsperaAUnaPersona,
  ultimoMantenimiento,
} from '@/backend/repositories/solicitudes';
import {
  CADUCADAS_PARA_PAUSAR,
  PLAZO_MINIMO,
  PLAZOS_DE_CIERRE,
  plazoDe,
  RECORDATORIO_MAS_TEMPRANO,
} from '@/shared/reglas/cobro';

/**
 * Lo que la plataforma hace sola, sin que nadie entre.
 *
 * Son cuatro tareas y todas responden al mismo principio del CLAUDE.md: nada
 * debe requerir intervención diaria. Una plataforma que se degrada si su dueña
 * no la mira no es una plataforma, es un trabajo.
 *
 * Ninguna de estas funciones lanza excepciones hacia arriba si puede evitarlo:
 * que falle el recordatorio no debe impedir que se borren los contactos viejos.
 */

/*
 * El plazo ya no es una constante de aquí: lo elige la familia al escribir y
 * cada solicitud lleva el suyo. Lo que se importa son los dos suelos —el plazo
 * más corto y el primer día en que se recuerda algo— y sirven sólo para no
 * traerse de la base de datos filas a las que seguro que no les toca nada. El
 * razonamiento de los plazos está en `shared/reglas/cobro.ts`.
 */

/** Días que se guarda el mensaje de una familia. Está prometido en el esquema. */
const DIAS_DE_CONSERVACION = 90;

/** Meses entre recordatorios de disponibilidad. */
const MESES_ENTRE_RECORDATORIOS = 3;

/** Días que se espera una respuesta al recordatorio antes de pausar la ficha. */
const DIAS_PARA_PAUSAR = 14;

function haceDias(dias: number): Date {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

/**
 * Días desde que el profesor acepta hasta que se le recuerda a la familia que
 * tiene un pago pendiente.
 */
const DIAS_PARA_RECORDAR_PAGO = 2;

/**
 * Días más que se le dan tras el recordatorio antes de cerrar la solicitud.
 *
 * Siete en total. Pasado ese plazo hay un profesor esperando una respuesta que
 * no va a llegar, y dejarle colgado indefinidamente es peor que cerrarlo. La
 * familia no pierde nada: puede volver a escribirle cuando quiera.
 */
const DIAS_TRAS_RECORDATORIO = PLAZOS_DE_CIERRE.trasRecordatorio;

/**
 * Tope absoluto desde que el profesor acepta, pase lo que pase.
 *
 * Catorce y no siete porque este plazo se aplica también cuando el correo falló
 * y la familia no llegó a recibir el recordatorio. Cerrarle la solicitud a la
 * semana a alguien a quien nadie ha avisado de nada sería injusto; a las dos
 * semanas ya no hay nada que esperar.
 */
const DIAS_LIMITE_ACEPTADA = PLAZOS_DE_CIERRE.desdeAceptada;

/**
 * Tope desde que la familia dice que ha hecho el Bizum.
 *
 * Treinta días, el doble que el otro tope, porque este caso es el único en el
 * que puede haber dinero de verdad esperando: si se cierra antes de tiempo, se
 * le cierra la puerta a alguien que sí pagó. Pero tampoco puede ser infinito,
 * que es lo que era: el botón no comprueba nada, así que sin plazo cualquiera
 * podía dejar una solicitud viva para siempre pulsándolo sin pagar.
 *
 * Antes de que caduque hay treinta oportunidades de verlo: sale arriba del todo
 * en el panel, en rojo pasadas veinticuatro horas, y entra en el correo diario.
 */
const DIAS_LIMITE_PAGO_AVISADO = PLAZOS_DE_CIERRE.desdeAvisoDePago;

export type ResumenMantenimiento = {
  caducadas: number;
  /** Recordatorios a profesores que tienen una familia esperando. */
  profesoresRecordados: number;
  borradas: number;
  /** Incidencias del buzón resueltas hace más de un año. */
  incidenciasBorradas: number;
  recordatorios: number;
  pausadas: number;
  pagosRecordados: number;
  pagosCaducados: number;
  valesPorCaducar: number;
  errores: string[];
};

export async function pasarMantenimiento(): Promise<ResumenMantenimiento> {
  const empezado = Date.now();
  const errores: string[] = [];
  const contar = async (nombre: string, tarea: () => Promise<number>) => {
    try {
      return await tarea();
    } catch (error) {
      console.error(`[mantenimiento] ${nombre}:`, error);
      errores.push(nombre);
      return 0;
    }
  };

  const resumen: ResumenMantenimiento = {
    /*
     * El orden importa: primero se recuerda y después se caduca.
     *
     * Al revés, una solicitud que cumple hoy su plazo se cerraría en la misma
     * pasada en la que le tocaba el segundo recordatorio, y el profesor
     * recibiría un «te queda una familia sin contestar» de algo ya cerrado.
     */
    profesoresRecordados: await contar(
      'recordar-profesor',
      recordarSolicitudesSinContestar,
    ),
    caducadas: await contar('caducar', caducarSolicitudes),
    borradas: await contar('borrar', borrarContactosViejos),
    incidenciasBorradas: await contar('borrar-incidencias', borrarIncidenciasViejas),
    recordatorios: await contar('recordar', mandarRecordatorios),
    pausadas: await contar('pausar', pausarSinRespuesta),
    pagosRecordados: await contar('recordar-pago', recordarPagos),
    pagosCaducados: await contar('caducar-pago', caducarPagosSinRespuesta),
    valesPorCaducar: await contar('avisar-vale', avisarValesQueCaducan),
    errores,
  };

  /*
   * Dejar constancia de que esto ha corrido.
   *
   * Es lo que convierte «no ha pasado nada» en dos cosas distinguibles: que no
   * había nada que hacer, o que el proceso lleva días sin ejecutarse. Sin esta
   * fila las dos se ven exactamente igual desde fuera —la web funcionando y
   * nadie quejándose— y la segunda significa que los datos de las familias han
   * dejado de borrarse.
   *
   * Va en su propio try. Que falle la caja negra no puede tumbar el vuelo.
   */
  try {
    await db.mantenimiento_ejecuciones.create({
      data: {
        // Los errores van en su propia columna, no repetidos dentro del JSON.
        resumen: {
          caducadas: resumen.caducadas,
          profesoresRecordados: resumen.profesoresRecordados,
          borradas: resumen.borradas,
          incidenciasBorradas: resumen.incidenciasBorradas,
          recordatorios: resumen.recordatorios,
          pausadas: resumen.pausadas,
          pagosRecordados: resumen.pagosRecordados,
          pagosCaducados: resumen.pagosCaducados,
          valesPorCaducar: resumen.valesPorCaducar,
        },
        errores,
        duracion_ms: Date.now() - empezado,
      },
    });
  } catch (error) {
    console.error('[mantenimiento] no se ha podido apuntar la ejecución:', error);
  }

  // El resumen diario va después de apuntar, y no antes, para que el correo
  // pueda contar entre sus pendientes lo que acabe de aparecer.
  await avisarADireccion(resumen);

  return resumen;
}

/**
 * Horas sin que corra el proceso antes de considerarlo parado.
 *
 * Treinta y seis y no veinticuatro porque el cron de Vercel es aproximado en la
 * hora: dos ejecuciones seguidas pueden separarse bastante más de un día sin que
 * pase nada malo. A las treinta y seis horas ya no es holgura, es que no corre.
 */
const HORAS_PARA_ALARMA = 36;

/**
 * El correo diario a quien lleva esto.
 *
 * Existe por una razón concreta: hay dos cosas que la plataforma no sabe hacer
 * sola —confirmar un Bizum y aprobar una ficha— y las dos dejan a alguien
 * esperando. Mientras Lucía estuviera en Madrid bastaba con que se acordara de
 * entrar. Desde Erasmus no basta.
 *
 * **No se manda si no hay nada que hacer.** Es la decisión importante de esta
 * función y la que hace que sirva de algo: un correo que llega todos los días se
 * ignora a la semana. Que este llegue tiene que significar, por sí solo, que hay
 * trabajo.
 *
 * Falla en silencio si no hay dirección configurada. No es un aviso a un
 * usuario, es una comodidad para la administración, y no merece ruido en el
 * registro cada día.
 */
async function avisarADireccion(resumen: ResumenMantenimiento): Promise<void> {
  const para = process.env.EMAIL_ADMIN;
  if (!para) return;

  try {
    const [pendiente, ultima] = await Promise.all([
      loQueEsperaAUnaPersona(),
      ultimoMantenimiento(),
    ]);

    const total =
      pendiente.pagosPorConfirmar +
      pendiente.fichasPorRevisar +
      pendiente.profesoresSinAvisar;

    // Los fallos y el proceso parado sí son motivo suficiente por sí solos,
    // aunque no haya nada pendiente: significan que la plataforma está rota.
    const paradoHoras =
      ultima && ultima.horasDesde >= HORAS_PARA_ALARMA
        ? ultima.horasDesde
        : undefined;

    if (total === 0 && resumen.errores.length === 0 && !paradoHoras) return;

    await enviar(
      correoResumenDiario({
        para,
        ...pendiente,
        procesoParadoHoras: paradoHoras,
        fallos: resumen.errores,
      }),
    );
  } catch (error) {
    console.error('[mantenimiento] el resumen diario no ha salido:', error);
  }
}

/**
 * «Te queda un contacto gratis y se acaba en diez días».
 *
 * Antes esto se calculaba a partir de la fecha de la solicitud, dando por hecho
 * que el vale moría con ella a los noventa días. Era falso: la limpieza no borra
 * las solicitudes pagadas, las anonimiza, así que el vale seguía siendo
 * canjeable para siempre y este correo metía prisa por una caducidad inventada.
 * Ahora el vale tiene su propia fecha y esto se limita a leerla.
 *
 * **Sin cota inferior, a propósito.** La versión anterior sólo miraba una
 * ventana de diez días: si el proceso diario no corría durante ese rato, o si
 * había más de cincuenta en cola, esos vales caducaban sin que nadie avisara a
 * nadie —justo el fallo que esta función existe para evitar—. Ahora entra todo
 * lo que caduque en los próximos diez días y no se haya avisado aún, se haya
 * pasado el plazo o no.
 */
export async function avisarValesQueCaducan(): Promise<number> {
  const conVale = await db.contactos.findMany({
    where: {
      vale_concedido: true,
      email_familia: { not: null },
      aviso_vale_caduca_en: null,
      // Un «menor que» ya deja fuera a los que no tienen fecha, que son los
      // vales anteriores a que existiera la caducidad. Ésos no se pueden gastar
      // y tampoco tiene sentido avisar de ellos.
      vale_caduca_en: { lt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      codigo: true,
      email_familia: true,
      nombre_familia: true,
      vale_caduca_en: true,
    },
    // Primero los que menos tiempo tienen: si hay cola, que no se quede fuera
    // justo el que caduca mañana.
    orderBy: { vale_caduca_en: 'asc' },
    take: 50,
  });

  let mandados = 0;

  for (const c of conVale) {
    const diasQueQuedan = Math.max(
      1,
      Math.ceil(
        (new Date(c.vale_caduca_en as Date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const salio = await enviar(
      correoValeCaduca({
        para: c.email_familia as string,
        nombreFamilia: c.nombre_familia,
        codigo: c.codigo,
        dias: diasQueQuedan,
      }),
    );

    if (salio) {
      await db.contactos.update({
        where: { id: c.id },
        data: { aviso_vale_caduca_en: new Date() },
      });
      mandados += 1;
    }
  }

  return mandados;
}

/**
 * «¿Sigues queriendo estas clases?»
 *
 * A los dos días de que el profesor acepte sin que la familia haya pagado. No
 * es una reclamación de deuda: es una pregunta con dos respuestas, y una de
 * ellas es «déjalo». Quien no piensa seguir adelante agradece poder decirlo, y
 * el profesor agradece enterarse.
 */
export async function recordarPagos(): Promise<number> {
  const pendientes = await db.contactos.findMany({
    where: {
      estado: 'aceptada',
      aceptada_en: { lt: haceDias(DIAS_PARA_RECORDAR_PAGO) },
      recordatorio_pago_en: null,
      email_familia: { not: null },
      // Quien ya ha dicho que pagó no recibe un recordatorio de pago. Es la
      // diferencia entre «se te ha olvidado» y «no me estás escuchando».
      pago_avisado_en: null,
    },
    select: {
      id: true,
      codigo: true,
      token_familia: true,
      email_familia: true,
      nombre_familia: true,
      importe: true,
      profesores: { select: { nombre: true, apellidos: true } },
    },
    take: 50,
  });

  let mandados = 0;

  for (const p of pendientes) {
    const salio = await enviar(
      correoRecordatorioPago({
        para: p.email_familia as string,
        nombreFamilia: p.nombre_familia,
        nombreProfesor: nombrePublico(
          p.profesores.nombre,
          p.profesores.apellidos,
        ),
        tokenFamilia: p.token_familia,
        codigo: p.codigo,
        importe: Number(p.importe ?? 0),
        diasParaCerrar: DIAS_TRAS_RECORDATORIO,
      }),
    );

    // Igual que con el recordatorio de disponibilidad: sólo se apunta si el
    // correo ha salido. Si no salió, la solicitud no se cierra por un silencio
    // que nadie provocó.
    if (salio) {
      await db.contactos.update({
        where: { id: p.id },
        data: { recordatorio_pago_en: new Date() },
      });
      mandados += 1;
    }
  }

  return mandados;
}

/**
 * Cerrar lo que nadie contesta.
 *
 * Cinco días después del recordatorio. Se avisa al profesor, que es quien lleva
 * una semana esperando: se le dice que esa familia no ha seguido adelante y que
 * no tiene que hacer nada.
 *
 * Quien dijo «sí, voy a pagar» y no pagó entra igual. La intención se apuntó,
 * pero el plazo es el mismo para todos: si de verdad quería, tuvo cinco días.
 *
 * **La red de debajo.** Ese camino depende de que el recordatorio saliera, y el
 * recordatorio depende del correo. Mientras el correo estuvo apagado,
 * `recordatorio_pago_en` no se rellenaba nunca y por tanto una solicitud
 * aceptada no caducaba **jamás**: el profesor se quedaba esperando un pago para
 * siempre, sin ningún botón que le sacara de ahí, y la única forma de cerrar el
 * asunto era que la familia se rindiera.
 *
 * Por eso hay un segundo plazo, absoluto y desde que el profesor aceptó, que no
 * depende de que salga ningún correo ni de que nadie conteste nada. Es más largo
 * a propósito: es una red, no el camino.
 *
 * **Y quien dice que ha pagado no queda fuera de esa red.** Esto fue un fallo.
 * El botón de «ya he hecho el Bizum» se puso para que no se le reclamara el pago
 * a quien ya había pagado, y de paso le sacaba de todos los cierres, incluido el
 * absoluto. Como el botón no comprueba nada —ni puede: el Bizum se mira a mano—
 * bastaba con pulsarlo sin pagar para dejar la solicitud viva indefinidamente y
 * al profesor esperando algo que no iba a llegar.
 *
 * Lo que hace ese aviso es frenar los recordatorios, no la caducidad. Por eso se
 * le da un plazo más largo, no infinito: tiempo de sobra para que alguien
 * compruebe un Bizum, y un final si resulta que no había ninguno.
 */
export async function caducarPagosSinRespuesta(): Promise<number> {
  const caducadas = await db.contactos.findMany({
    where: {
      estado: 'aceptada',
      OR: [
        // El camino normal: se le recordó y no contestó.
        {
          pago_avisado_en: null,
          recordatorio_pago_en: { lt: haceDias(DIAS_TRAS_RECORDATORIO) },
        },
        // La red, para quien nunca llegó a recibir el recordatorio.
        {
          pago_avisado_en: null,
          aceptada_en: { lt: haceDias(DIAS_LIMITE_ACEPTADA) },
        },
        // Y la red de quien dijo que había pagado. Más larga, porque aquí sí
        // puede haber dinero de verdad esperando a que alguien lo mire.
        { pago_avisado_en: { lt: haceDias(DIAS_LIMITE_PAGO_AVISADO) } },
      ],
    },
    select: {
      id: true,
      nombre_familia: true,
      niveles: { select: { nombre: true } },
      profesores: { select: { nombre: true, email: true } },
    },
    take: 50,
  });

  for (const c of caducadas) {
    await db.contactos.update({
      where: { id: c.id },
      data: { estado: 'caducada' },
    });

    await enviar(
      correoFamiliaNoSigue({
        para: c.profesores.email,
        nombreProfesor: c.profesores.nombre,
        nombreFamilia: c.nombre_familia,
        nivel: c.niveles?.nombre ?? null,
        seRetiro: false,
      }),
    );
  }

  return caducadas.length;
}

/**
 * Solicitudes que nadie ha contestado.
 *
 * A los treinta días se dan por muertas. No es una limpieza cosmética: mientras
 * una solicitud sigue «esperando al profesor», la familia que la mandó ve en su
 * página que aún puede pasar algo. Marcarla como caducada es dejar de darle
 * falsas esperanzas.
 *
 * Sólo caducan las que esperan al profesor. Una aceptada y sin pagar se queda
 * como está: ahí la pelota la tiene la familia y puede pagar cuando quiera.
 */
export async function caducarSolicitudes(): Promise<number> {
  /*
   * Se traen las candidatas por el plazo más corto que existe y se filtra
   * después por el de cada una. Filtrar en SQL exigiría meter los días en la
   * consulta, y entonces los plazos vivirían en dos sitios: aquí y en
   * `cobro.ts`. Son pocas filas y se miran una vez al día.
   */
  const candidatas = await db.contactos.findMany({
    where: {
      estado: 'pendiente_profesor',
      enviado_en: { lt: haceDias(PLAZO_MINIMO) },
      /*
       * No se cierra lo que el profesor nunca llegó a saber.
       *
       * Si no le salió ni el correo ni el aviso al móvil, su silencio no es
       * suyo: es nuestro. Cerrarlo y decirle a la familia «no ha contestado»
       * sería contarle una mentira y, de paso, castigar al profesor por un
       * fallo de Resend.
       *
       * Estas solicitudes no se pierden: salen en el panel y en el correo
       * diario como «profesores sin avisar», que es donde tiene que verlas una
       * persona.
       */
      OR: [{ avisado_correo: true }, { avisado_push: true }],
    },
    select: {
      id: true,
      enviado_en: true,
      urgencia: true,
      email_familia: true,
      nombre_familia: true,
      profesor_id: true,
      niveles: { select: { nombre: true } },
      profesores: { select: { nombre: true, apellidos: true } },
    },
    /*
     * El orden importa tanto como el filtro, y por un motivo que no se ve.
     *
     * El corte se aplica **antes** que el filtro por plazo, así que sin orden
     * las 200 filas que se trae la consulta podían ser todas de plazo largo, el
     * filtro descartarlas todas, y la de treinta y un días no cerrarse nunca.
     * Y como el orden sin `ORDER BY` es estable mientras la tabla no cambie,
     * mañana pasaría lo mismo: una familia esperando indefinidamente por un
     * detalle del plan de ejecución.
     */
    orderBy: { enviado_en: 'asc' },
    take: 200,
  });

  const muertas = candidatas.filter(
    (c) => c.enviado_en < haceDias(plazoDe(c.urgencia).dias),
  );

  let caducadas = 0;

  for (const s of muertas) {
    await db.contactos.update({
      where: { id: s.id },
      data: { estado: 'caducada' },
    });
    caducadas += 1;

    /*
     * Y se le dice a la familia, que es lo que no se hacía.
     *
     * Antes esto era un `updateMany` mudo: la solicitud cambiaba de estado y
     * la familia se quedaba mirando una página que ponía «esperando» hasta que
     * un día ponía otra cosa. Nadie se lo contaba.
     *
     * El correo va después del cambio de estado y no antes: si falla el envío,
     * la solicitud queda cerrada igual. Es preferible una familia sin correo
     * que una familia esperando indefinidamente a alguien que no va a venir.
     */
    if (s.email_familia) {
      await enviar(
        correoSolicitudCaducada({
          para: s.email_familia,
          nombreFamilia: s.nombre_familia,
          nombreProfesor: nombrePublico(
            s.profesores.nombre,
            s.profesores.apellidos,
          ),
          nivel: s.niveles?.nombre ?? 'clases particulares',
        }),
      );
    }

    await pausarSiAcumulaCaducadas(s.profesor_id);
  }

  return caducadas;
}

/**
 * Al profesor que deja cinco solicitudes sin contestar se le retira la ficha.
 *
 * No es un castigo, es aritmética: si cinco familias distintas le han escrito y
 * ninguna ha tenido respuesta, la sexta tampoco la va a tener, y la plataforma
 * lo sabe antes que ella. Dejarle en el directorio es mandar gente a esperar
 * para nada.
 *
 * Es el mismo mecanismo que ya se aplica cuando dos familias dicen que no
 * consiguieron hablar con él: `pausada_auto_en` marca que ha salido del
 * directorio sin pedirlo, y el correo que se le manda lleva un botón para
 * volver. Quien estaba de exámenes no pierde nada y vuelve con un clic.
 */
async function pausarSiAcumulaCaducadas(profesorId: string): Promise<void> {
  const ficha = await db.profesores.findUnique({
    where: { id: profesorId },
    select: { id: true, nombre: true, email: true, disponible: true },
  });

  // Si ya está fuera del directorio no hay nada que pausar, y sobre todo no hay
  // que volver a mandarle el mismo correo cada día.
  if (!ficha || !ficha.disponible) return;

  /*
   * Sólo cuentan las que caducaron por su silencio, y sólo las recientes.
   *
   * Las dos condiciones son necesarias y por motivos distintos:
   *
   * `aceptada_en: null` distingue esto de la otra vía por la que una solicitud
   * llega a «caducada»: que él aceptara y la familia no pagara. Sin este
   * filtro, un profesor impecable que acepta dos veces y cuyas dos familias no
   * hacen el Bizum sale del directorio por algo que no ha hecho.
   *
   * La ventana de noventa días es la misma que usa `revisarProfesor` y por la
   * misma razón: sin ella, pasados dos despistes el profesor se queda con el
   * gatillo puesto para siempre, y cualquier caducada dos años después le
   * vuelve a pausar la ficha al instante. La pregunta no es «¿ha fallado
   * alguna vez?», es «¿está fallando ahora?».
   */
  const caducadas = await db.contactos.count({
    where: {
      profesor_id: profesorId,
      estado: 'caducada',
      aceptada_en: null,
      enviado_en: { gt: haceDias(DIAS_DE_CONSERVACION) },
    },
  });

  if (caducadas < CADUCADAS_PARA_PAUSAR) return;

  await db.profesores.update({
    where: { id: profesorId },
    data: { disponible: false, pausada_auto_en: new Date() },
  });

  // Por los dos canales, no sólo por correo. Desaparecer del directorio sin
  // enterarse es exactamente lo que esta ficha lleva un mes sin poder evitar.
  await avisar(
    ficha.id,
    {
      titulo: 'Hemos pausado tu ficha',
      cuerpo: `Han caducado ${caducadas} solicitudes sin contestar. Puedes volver cuando quieras.`,
      url: '/mi-ficha',
    },
    correoFichaPausadaSinContestar({
      para: ficha.email,
      nombreProfesor: ficha.nombre,
      tokenPanel: await tokenDelPanel(ficha.id),
      solicitudes: caducadas,
    }),
  );
}

/**
 * «Oye, que tienes una familia esperando.»
 *
 * Esto no existía, y era el agujero por el que se caía el recorrido entero: al
 * profesor se le mandaba un correo el primer día y **nunca más**. Quien lo abría
 * en el metro y pensaba «luego lo miro» no volvía a acordarse.
 *
 * Se le insiste dos veces, los días que diga el plazo de esa solicitud, y ahí
 * se para. Quien no contesta a dos no va a contestar a cinco, y a partir de ahí
 * insistir deja de ser un recordatorio.
 *
 * El contador se guarda en la fila y no se deduce de las fechas: deducirlo
 * significaba volver a mandar el mismo recordatorio cada día que la tarea
 * corriera, que es como se convierte un aviso en una plaga.
 */
export async function recordarSolicitudesSinContestar(): Promise<number> {
  let mandados = 0;

  for (const vuelta of [0, 1]) {
    const pendientes = await db.contactos.findMany({
      where: {
        estado: 'pendiente_profesor',
        // El día concreto depende del plazo de cada una, así que aquí se acota
        // por el recordatorio más temprano que existe y se filtra abajo.
        enviado_en: { lt: haceDias(RECORDATORIO_MAS_TEMPRANO) },
        // La vuelta 0 busca los que no han recibido ninguno; la 1, los que han
        // recibido exactamente uno.
        recordatorios_profesor: vuelta,
        /*
         * Y el segundo no puede salir el mismo día que el primero.
         *
         * Sin esta condición pasaba algo que no se ve leyendo el bucle: la
         * vuelta 1 hace su propia consulta *después* de que la vuelta 0 haya
         * escrito, así que leía el contador recién puesto a 1 y mandaba el
         * segundo aviso a los pocos segundos del primero. Le ocurría a toda
         * solicitud que llegara con el contador a cero y más de cinco días
         * encima: las de después de un fin de semana sin cron, por ejemplo.
         */
        ...(vuelta === 0
          ? {}
          : { recordatorio_profesor_en: { lt: haceDias(1) } }),
      },
      select: {
        id: true,
        enviado_en: true,
        urgencia: true,
        token_profesor: true,
        niveles: { select: { nombre: true } },
        profesores: { select: { id: true, nombre: true, email: true } },
      },
      // Las más antiguas primero, por lo mismo que en `caducarSolicitudes`: el
      // corte va antes que el filtro, y sin orden las de plazo largo podían
      // comerse las cien plazas y dejar sin aviso a las que tienen prisa.
      orderBy: { enviado_en: 'asc' },
      take: 100,
    });

    for (const s of pendientes) {
      const plazo = plazoDe(s.urgencia);
      const diasEsperando = Math.floor(
        (Date.now() - s.enviado_en.getTime()) / (24 * 60 * 60 * 1000),
      );

      // A esta solicitud, con su plazo, ¿le toca ya este recordatorio?
      if (diasEsperando < plazo.recordatorios[vuelta]) continue;

      const quedan = Math.max(plazo.dias - diasEsperando, 1);
      const nivel = s.niveles?.nombre ?? 'clases particulares';

      const { push, correo } = await avisar(
        s.profesores.id,
        {
          titulo: 'Tienes una familia esperando',
          cuerpo: `Te escribieron para ${nivel} y sigues sin contestar.`,
          url: `/aceptar/${s.token_profesor}`,
        },
        correoSolicitudSinContestar({
          para: s.profesores.email,
          nombreProfesor: s.profesores.nombre,
          nivel,
          tokenProfesor: s.token_profesor,
          tokenPanel: await tokenDelPanel(s.profesores.id),
          diasQueQuedan: quedan,
          caducadas: await caducadasSinContestar(s.profesores.id),
        }),
      );

      /*
       * Se apunta si llegó por cualquiera de los dos canales.
       *
       * Antes esto miraba sólo el correo, y tenía una consecuencia fea: con el
       * correo apagado el contador no subía nunca, así que al profesor le
       * entraba el mismo aviso al móvil **todos los días** del segundo al
       * séptimo. Un recordatorio que se repite a diario deja de serlo en
       * cuarenta y ocho horas.
       *
       * Si no llegó por ninguno, no se apunta y se reintenta mañana. No hay
       * riesgo de cerrarle la solicitud por un silencio que no es suyo: de eso
       * se encarga `caducarSolicitudes`, que no cierra lo que el profesor nunca
       * supo.
       */
      if (push || correo) {
        await db.contactos.update({
          where: { id: s.id },
          data: {
            recordatorios_profesor: vuelta + 1,
            recordatorio_profesor_en: new Date(),
          },
        });
        mandados += 1;
      }
    }
  }

  return mandados;
}

/**
 * Borrado de los mensajes de familias a los noventa días.
 *
 * Son nombres y teléfonos de tutores de menores, y el esquema promete por
 * escrito que se borran. Guardarlos «por si acaso» no tiene ninguna utilidad:
 * a los tres meses, o hubo clases o no las hubo, y en ninguno de los dos casos
 * sirve de nada tener el teléfono.
 *
 * Se borra la fila entera, no se anonimiza. Media medida aquí sería quedarse
 * con lo que no hace falta.
 */
export async function borrarContactosViejos(): Promise<number> {
  const viejas = { enviado_en: { lt: haceDias(DIAS_DE_CONSERVACION) } };

  /*
   * Lo que no llegó a cobrarse se borra entero.
   *
   * Una solicitud que el profesor no contestó, o que se canceló, no tiene nada
   * que aportar a los tres meses. Es sólo un nombre y un teléfono guardados sin
   * motivo.
   */
  const { count: borradas } = await db.contactos.deleteMany({
    where: { ...viejas, estado: { notIn: ['pagada', 'devuelta'] } },
  });

  /*
   * Lo que sí se cobró se anonimiza, no se borra.
   *
   * Aquí hay dos cosas que proteger y tiran en direcciones contrarias. Por un
   * lado, el nombre y el teléfono de un tutor de un menor no deben seguir
   * guardados pasados noventa días. Por otro, borrar la fila entera destruye la
   * única constancia de que ese dinero entró y, si se devolvió, de a quién y
   * por qué.
   *
   * Se resuelve quedándose con lo que no identifica a nadie —las fechas, el
   * importe, el motivo de la devolución— y vaciando lo que sí. El resultado no
   * es «Ana, 600...»: es «una familia pagó 10 € el 3 de marzo».
   *
   * El mensaje libre se vacía también: es lo que más probabilidades tiene de
   * contener algo personal que se coló pese al filtro.
   */
  const { count: anonimizadas } = await db.contactos.updateMany({
    where: {
      ...viejas,
      estado: { in: ['pagada', 'devuelta'] },
      // `nombre_familia` es NOT NULL, así que se marca en vez de vaciarse. Y
      // sirve para no volver a procesar las que ya están anonimizadas.
      nombre_familia: { not: '(borrado)' },
    },
    data: {
      nombre_familia: '(borrado)',
      telefono_familia: null,
      email_familia: null,
      mensaje: null,
    },
  });

  return borradas + anonimizadas;
}

/**
 * El buzón también caduca.
 *
 * Recoge texto libre de cualquiera que entre en la web, y a veces un correo. Se
 * quedaba para siempre: no aparecía en la política de privacidad, no tenía plazo
 * y no se borraba cuando un profesor se daba de baja.
 *
 * Un año desde que se resuelve. Antes de resolverse no se toca, porque una
 * incidencia pendiente sigue siendo trabajo por hacer; después, lo que queda es
 * un texto que ya no sirve para nada y un correo de alguien que sólo quería
 * avisar de que un botón no iba.
 */
export async function borrarIncidenciasViejas(): Promise<number> {
  const { count } = await db.incidencias.deleteMany({
    where: {
      estado: 'resuelta',
      resuelto_en: { lt: haceDias(365) },
    },
  });

  return count;
}

/**
 * «¿Sigues dando clase?», cada tres meses.
 *
 * Es lo que evita que dentro de un año el directorio esté lleno de gente que ya
 * no da clase. Sin esto, la primera experiencia de muchas familias sería
 * escribir a alguien que no contesta.
 *
 * Se manda a quien lleva tres meses sin confirmar y a quien no se le haya
 * escrito ya. `ultimo_recordatorio_en` es lo que evita mandarlo todos los días.
 */
export async function mandarRecordatorios(): Promise<number> {
  const profesores = await db.profesores.findMany({
    where: {
      estado: 'activo',
      disponible: true,
      disponibilidad_confirmada_en: {
        lt: haceDias(MESES_ENTRE_RECORDATORIOS * 30),
      },
      ultimo_recordatorio_en: null,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      disponibilidad_confirmada_en: true,
    },
    take: 50,
  });

  let mandados = 0;

  for (const p of profesores) {
    const meses = Math.floor(
      (Date.now() - new Date(p.disponibilidad_confirmada_en).getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    );

    const salio = await enviar(
      correoConfirmarDisponibilidad({
        para: p.email,
        nombreProfesor: p.nombre,
        tokenPanel: await tokenDelPanel(p.id),
        meses,
      }),
    );

    // La fecha se apunta SÓLO si el correo ha salido de verdad, y esto es
    // importante: catorce días después de apuntarla, a quien no haya contestado
    // se le pausa la ficha.
    //
    // Si se apuntara igualmente cuando el envío falla —hoy falla siempre,
    // porque el dominio no está verificado— pasaría lo siguiente: nadie recibe
    // el recordatorio, nadie contesta, y dos semanas después el directorio se
    // vacía solo sin que ningún profesor haya sabido nunca que le preguntaron.
    //
    // Con esto, si el correo no sale, el recordatorio se queda pendiente y no
    // se pausa a nadie. Es el fallo en la dirección correcta.
    if (salio) {
      await db.profesores.update({
        where: { id: p.id },
        data: { ultimo_recordatorio_en: new Date() },
      });
      mandados += 1;
    }
  }

  return mandados;
}

/**
 * Quien no contesta al recordatorio, se pausa.
 *
 * No se borra ni se desactiva: se pausa, que es reversible con un botón desde
 * su propio enlace. La ficha, las asignaturas y el horario siguen ahí.
 *
 * Es la parte incómoda y es la que da valor a todo lo demás: un directorio
 * donde todos contestan vale mucho más que uno con el triple de fichas donde la
 * mitad ya no da clase.
 */
export async function pausarSinRespuesta(): Promise<number> {
  const { count } = await db.profesores.updateMany({
    where: {
      estado: 'activo',
      disponible: true,
      ultimo_recordatorio_en: { lt: haceDias(DIAS_PARA_PAUSAR) },
    },
    data: { disponible: false },
  });

  return count;
}

/**
 * Mantener despierta la base de datos.
 *
 * El plan gratuito de Supabase pausa el proyecto tras siete días sin actividad,
 * y despertarlo tarda medio minuto. Una familia que entra un martes de agosto y
 * se encuentra la web colgada no vuelve.
 *
 * Una consulta trivial una vez por semana basta.
 */
export async function despertar(): Promise<boolean> {
  try {
    await db.profesores.count();
    return true;
  } catch (error) {
    console.error('[mantenimiento] no se ha podido despertar la base:', error);
    return false;
  }
}
