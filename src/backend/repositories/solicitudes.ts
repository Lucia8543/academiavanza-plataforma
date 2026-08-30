import { nombrePublico } from '@/backend/repositories/directorio';
import { PLAZOS, plazoDe, type Urgencia } from '@/shared/reglas/cobro';
import { elProfesorVeElTelefono } from '@/shared/reglas/solicitud';
import { zonaCompleta } from '@/shared/datos/zonas';
import { formatearTelefono } from '@/shared/schemas/telefono';
import type {
  EstadoSolicitud,
  SolicitudFamilia,
  SolicitudProfesor,
} from '@/shared/types/solicitud';
import { db } from './cliente';

/**
 * Consultas sobre solicitudes.
 *
 * La regla que gobierna este fichero: **un teléfono sólo sale de aquí si la
 * solicitud está pagada**. No se filtra en la pantalla, se filtra al construir
 * el objeto. Una pantalla puede tener un descuido; un objeto al que le falta el
 * campo, no.
 */

/** Lo que ve la familia en su dirección privada de seguimiento. */
export async function porTokenFamilia(
  token: string,
): Promise<SolicitudFamilia | null> {
  const s = await db.contactos.findUnique({
    where: { token_familia: token },
    select: {
      codigo: true,
      estado: true,
      nombre_familia: true,
      importe: true,
      motivo_rechazo: true,
      enviado_en: true,
      pagada_en: true,
      telefono_familia: true,
      email_familia: true,
      intencion_pago: true,
      pago_avisado_en: true,
      vale_de: true,
      vale_concedido: true,
      niveles: { select: { nombre: true, precio_referencia: true } },
      profesores: {
        select: {
          nombre: true,
          apellidos: true,
          slug: true,
          telefono: true,
          colegios: { select: { nombre: true, nombre_corto: true } },
        },
      },
    },
  });

  if (!s) return null;

  /*
   * Aquí ya no se calcula nada sobre teléfonos.
   *
   * Esta función devuelve lo que ve la FAMILIA, y a la familia no se le enseña
   * ningún teléfono del profesor en ningún estado. La regla sigue existiendo,
   * pero sólo gobierna la vista del profesor, unas líneas más abajo.
   */

  return {
    codigo: s.codigo,
    estado: s.estado as EstadoSolicitud,
    nombreFamilia: s.nombre_familia,
    profesor: nombrePublico(s.profesores.nombre, s.profesores.apellidos),
    slugProfesor: s.profesores.slug,
    colegio:
      s.profesores.colegios?.nombre_corto ??
      s.profesores.colegios?.nombre ??
      null,
    nivel: s.niveles?.nombre ?? null,
    precioReferencia:
      s.niveles?.precio_referencia == null
        ? null
        : Number(s.niveles.precio_referencia),
    importe: Number(s.importe ?? 0),
    gratisPorVale: Boolean(s.vale_de),
    tieneVale: s.vale_concedido,
    telefonoFamilia: s.telefono_familia ?? '',
    emailFamilia: s.email_familia ?? '',
    intencionPago: s.intencion_pago,
    avisoDePago: s.pago_avisado_en !== null,
    diasDesdePago: s.pagada_en
      ? Math.floor(
          (Date.now() - new Date(s.pagada_en).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null,
    motivoRechazo: s.motivo_rechazo,
    enviadaEn: s.enviado_en,
    /*
     * El teléfono del profesor no se devuelve nunca, ni siquiera pagada.
     *
     * Antes se añadía aquí cuando la solicitud estaba pagada. Se ha quitado
     * porque una parte de los profesores es menor de edad, y darle a un adulto
     * el móvil de un menor es exactamente el riesgo que no se puede asumir.
     *
     * El contacto va en un solo sentido: al profesor se le da el teléfono de la
     * familia, y decide él si llama, si escribe o si le pasa su número.
     */
  };
}

/** Lo que ve el profesor en el enlace donde decide. */
export async function porTokenProfesor(
  token: string,
): Promise<SolicitudProfesor | null> {
  const s = await db.contactos.findUnique({
    where: { token_profesor: token },
    select: {
      estado: true,
      nombre_familia: true,
      telefono_familia: true,
      mensaje: true,
      zona: true,
      barrio: true,
      enviado_en: true,
      niveles: { select: { nombre: true } },
      profesores: {
        select: {
          cupo: true,
          disponible: true,
          _count: {
            select: { suscripciones_push: { where: { fallo_en: null } } },
          },
        },
      },
    },
  });

  if (!s) return null;

  // Lo que se compró: al pagar, el profesor ve el teléfono de la familia.
  const pagada = elProfesorVeElTelefono(s.estado as EstadoSolicitud);

  return {
    estado: s.estado as EstadoSolicitud,
    nombreFamilia: s.nombre_familia,
    nivel: s.niveles?.nombre ?? null,
    mensaje: s.mensaje,
    // Al profesor se le da ya montado: «Ríos Rosas (Chamberí)».
    zona: zonaCompleta(s.zona, s.barrio),
    enviadaEn: s.enviado_en,
    avisadoPorMovil: s.profesores._count.suscripciones_push > 0,
    cupo: s.profesores.cupo === 'justo' ? 'justo' : 'busca',
    pausado: !s.profesores.disponible,
    ...(pagada && s.telefono_familia
      ? { telefonoFamilia: formatearTelefono(s.telefono_familia) }
      : {}),
  };
}

/**
 * Las demás solicitudes de la misma familia.
 *
 * Una familia con dos hijos, o con un hijo que necesita mates e inglés, acaba
 * con tres o cuatro solicitudes y otros tantos enlaces sueltos por el correo.
 * Aquí se le enseñan todas juntas desde cualquiera de ellas.
 *
 * Se identifican por teléfono, y quien esté mirando esta página ya ha
 * demostrado que es suyo: tiene el enlace privado de una de ellas, que no se
 * adivina. No hace falta pedirle nada más.
 */
export async function otrasDeLaMismaFamilia(
  telefono: string,
  tokenActual: string,
) {
  const otras = await db.contactos.findMany({
    where: {
      telefono_familia: telefono,
      token_familia: { not: tokenActual },
    },
    select: {
      codigo: true,
      estado: true,
      token_familia: true,
      enviado_en: true,
      niveles: { select: { nombre: true } },
      profesores: { select: { nombre: true, apellidos: true } },
    },
    orderBy: { enviado_en: 'desc' },
    take: 10,
  });

  return otras.map((o) => ({
    codigo: o.codigo,
    estado: o.estado as EstadoSolicitud,
    token: o.token_familia,
    nivel: o.niveles?.nombre ?? null,
    profesor: nombrePublico(o.profesores.nombre, o.profesores.apellidos),
    enviadaEn: o.enviado_en,
  }));
}

export type OtraSolicitud = Awaited<
  ReturnType<typeof otrasDeLaMismaFamilia>
>[number];

/**
 * Recuperación para quien ha perdido su dirección.
 *
 * Sin correo de por medio, la dirección privada es lo único que tiene la
 * familia. Esto es la red: con el código —que está en el concepto de su
 * Bizum— y su propio teléfono, se recupera. Hacen falta los dos, y el código
 * por sí solo no abre nada.
 */
export async function recuperarToken(
  codigo: string,
  telefono: string,
): Promise<string | null> {
  const s = await db.contactos.findFirst({
    where: {
      codigo: codigo.trim().toUpperCase(),
      telefono_familia: telefono,
    },
    select: { token_familia: true },
  });

  return s?.token_familia ?? null;
}

/**
 * Todas las solicitudes, para el panel.
 *
 * Aquí sí van los teléfonos y los enlaces: es la pantalla de Lucía, y mientras
 * el correo esté apagado es ella quien tiene que pasarle al profesor el enlace
 * donde decide.
 */
export async function listarSolicitudes(limite = 60) {
  return db.contactos.findMany({
    select: {
      id: true,
      codigo: true,
      estado: true,
      nombre_familia: true,
      telefono_familia: true,
      mensaje: true,
      importe: true,
      enviado_en: true,
      motivo_rechazo: true,
      vale_concedido: true,
      vale_de: true,
      motivo_vale: true,
      vale_pedido_en: true,
      token_profesor: true,
      token_familia: true,
      intencion_pago: true,
      pago_avisado_en: true,
      recordatorio_pago_en: true,
      devuelta_en: true,
      importe_devuelto: true,
      motivo_devolucion: true,
      // Por dónde se le avisó. El panel lo enseña para que Lucía no escriba
      // por WhatsApp a alguien que ya tiene el aviso en el móvil.
      avisado_push: true,
      avisado_correo: true,
      niveles: { select: { nombre: true } },
      profesores: {
        select: { nombre: true, apellidos: true, email: true, telefono: true },
      },
    },
    orderBy: { enviado_en: 'desc' },
    take: limite,
  });
}

export type SolicitudPanel = Awaited<
  ReturnType<typeof listarSolicitudes>
>[number];

/**
 * Familias que dicen haber pagado y siguen esperando a que alguien lo confirme.
 *
 * Es lo único del panel donde hay una persona con su dinero fuera y sin nada a
 * cambio, así que se consulta aparte y se enseña lo primero.
 *
 * Las horas se cuentan aquí y no al pintar la página. La regla de React es que
 * un componente tiene que dar el mismo resultado siempre que se le llame con lo
 * mismo, y `Date.now()` no lo cumple: mirar el reloj es trabajo de la capa que
 * ya está mirando la base de datos.
 */
export async function pagosPorConfirmar() {
  const filas = await db.contactos.findMany({
    where: { estado: 'aceptada', pago_avisado_en: { not: null } },
    select: {
      id: true,
      codigo: true,
      nombre_familia: true,
      importe: true,
      pago_avisado_en: true,
    },
    // El que más lleva esperando, primero.
    orderBy: { pago_avisado_en: 'asc' },
  });

  const ahora = Date.now();

  return filas.map((f) => ({
    id: f.id,
    codigo: f.codigo,
    nombreFamilia: f.nombre_familia,
    importe: Number(f.importe ?? 0),
    horasEsperando: Math.floor(
      (ahora - new Date(f.pago_avisado_en as Date).getTime()) /
        (1000 * 60 * 60),
    ),
  }));
}

export async function contarPorEstado() {
  const filas = await db.contactos.groupBy({
    by: ['estado'],
    _count: { _all: true },
  });

  const cuenta: Record<string, number> = {};
  for (const fila of filas) cuenta[String(fila.estado)] = fila._count._all;
  return cuenta;
}

/**
 * Lo que está esperando a que alguien lo mire.
 *
 * Son los tres cuellos de botella que la plataforma no puede resolver sola:
 * confirmar un Bizum, revisar una ficha nueva y avisar a mano a un profesor
 * cuando el aviso automático no llegó. Todo lo demás corre sin nadie.
 *
 * Se cuenta aquí, junto, porque es lo que va en el correo diario. Lo importante
 * no es el número: es que si los tres son cero, ese correo no se manda. Un aviso
 * que llega todos los días deja de leerse en una semana.
 */
export async function loQueEsperaAUnaPersona(): Promise<{
  pagosPorConfirmar: number;
  fichasPorRevisar: number;
  profesoresSinAvisar: number;
}> {
  const [pagos, fichas, sinAvisar] = await Promise.all([
    db.contactos.count({
      where: { estado: 'aceptada', pago_avisado_en: { not: null } },
    }),
    db.profesores.count({ where: { estado: 'pendiente' } }),
    // Ni por el móvil ni por correo. Ese profesor no sabe que le han escrito, y
    // la familia está esperando una respuesta que no va a llegar nunca.
    db.contactos.count({
      where: {
        estado: 'pendiente_profesor',
        avisado_push: false,
        avisado_correo: false,
      },
    }),
  ]);

  return {
    pagosPorConfirmar: pagos,
    fichasPorRevisar: fichas,
    profesoresSinAvisar: sinAvisar,
  };
}

/**
 * Cuándo corrió por última vez el proceso diario, y si algo falló.
 *
 * Devuelve null si no hay ninguna ejecución apuntada, que es lo que pasa el
 * primer día y también si la tabla no existe todavía.
 */
export async function ultimoMantenimiento(): Promise<{
  ejecutadoEn: Date;
  errores: string[];
  horasDesde: number;
} | null> {
  const fila = await db.mantenimiento_ejecuciones.findFirst({
    orderBy: { ejecutado_en: 'desc' },
    select: { ejecutado_en: true, errores: true },
  });

  if (!fila) return null;

  return {
    ejecutadoEn: fila.ejecutado_en,
    errores: fila.errores,
    horasDesde: Math.floor(
      (Date.now() - new Date(fila.ejecutado_en).getTime()) / (1000 * 60 * 60),
    ),
  };
}

/**
 * Por qué no sigue la gente, en total y sin filtrar por profesor.
 *
 * El profesor ve sus motivos porque le ayudan a él. Este recuento es para otra
 * cosa: es la única forma de saber si el peaje de los diez euros está echando a
 * la gente, o si los precios de referencia están mal puestos. Son las dos
 * únicas cifras del proyecto que pueden obligar a cambiar el modelo de negocio,
 * y hasta ahora no existían.
 *
 * Aquí no se esconde nada, ni siquiera «no quiso pagar el contacto». Al profesor
 * se le ahorra ese motivo porque no puede hacer nada con él; a quien decide el
 * precio es justo el que tiene que verlo.
 */
export async function porQueNoSiguen(): Promise<
  { motivo: string; veces: number }[]
> {
  const filas = await db.contactos.groupBy({
    by: ['motivo_cierre'],
    where: { motivo_cierre: { not: null } },
    _count: { _all: true },
  });

  return filas
    .map((f) => ({ motivo: String(f.motivo_cierre), veces: f._count._all }))
    .sort((a, b) => b.veces - a.veces);
}

/**
 * Solicitudes a punto de caducar, con el teléfono del profesor.
 *
 * Es la lista del apartado de rescate del panel: profesores a los que ya se les
 * ha insistido dos veces por correo y por el móvil y siguen sin contestar, y a
 * los que les quedan uno o dos días antes de que la solicitud se cierre sola.
 *
 * **Esto es un extra y no una pieza del circuito.** Todo lo que hay debajo
 * funciona igual si nadie abre nunca esta pantalla: se recuerda solo, se cierra
 * solo y se avisa solo a la familia. Existe porque un mensaje de WhatsApp de una
 * persona rescata a un profesor de veinte años que no abre el correo, y mientras
 * haya alguien en Madrid para mandarlo, merece la pena mandarlo.
 *
 * Devuelve el teléfono del profesor, que no sale en ninguna otra pantalla de
 * administración. Es el mismo dato que ya se ve al revisar una ficha, y quien
 * está aquí ha pasado por la contraseña del panel.
 */
export async function aPuntoDeCaducar(): Promise<
  {
    codigo: string;
    nivel: string;
    diasEsperando: number;
    diasQueQuedan: number;
    profesor: string;
    telefono: string | null;
    enlace: string;
  }[]
> {
  const dia = 24 * 60 * 60 * 1000;

  /*
   * Una consulta por plazo, y no una sola para todas.
   *
   * Con una sola no salía: había que traer por el plazo más corto y filtrar
   * después, y entonces el corte se aplicaba antes que el filtro. Cien
   * solicitudes de treinta días llenaban el cupo y **la de cinco días que se
   * cerraba pasado mañana no aparecía nunca**, que es exactamente la que esta
   * pantalla existe para rescatar. Ordenar por antigüedad lo empeoraba: pone
   * delante justo a las que menos prisa tienen.
   *
   * Tres consultas pequeñas, cada una con su propio «le quedan dos días», lo
   * resuelven sin aritmética rara.
   */
  const porPlazo = await Promise.all(
    (Object.keys(PLAZOS) as Urgencia[]).map((urgencia) =>
      db.contactos.findMany({
        where: {
          estado: 'pendiente_profesor',
          urgencia,
          enviado_en: {
            lt: new Date(Date.now() - (PLAZOS[urgencia].dias - 2) * dia),
          },
          // Si al profesor no le llegó ningún aviso, `caducarSolicitudes` no la
          // va a cerrar, así que decir «se cierra mañana» sería mentira. Ésas
          // salen en el panel por otro sitio, como profesores sin avisar.
          OR: [{ avisado_correo: true }, { avisado_push: true }],
        },
        select: {
          codigo: true,
          enviado_en: true,
          urgencia: true,
          token_profesor: true,
          niveles: { select: { nombre: true } },
          profesores: {
            select: { nombre: true, apellidos: true, telefono: true },
          },
        },
        orderBy: { enviado_en: 'asc' },
        take: 25,
      }),
    ),
  );

  return porPlazo
    .flat()
    .map((f) => {
      const diasEsperando = Math.floor(
        (Date.now() - f.enviado_en.getTime()) / dia,
      );

      return {
        codigo: f.codigo,
        nivel: f.niveles?.nombre ?? 'clases particulares',
        diasEsperando,
        diasQueQuedan: Math.max(plazoDe(f.urgencia).dias - diasEsperando, 0),
        profesor: `${f.profesores.nombre} ${f.profesores.apellidos}`.trim(),
        telefono: f.profesores.telefono,
        enlace: `/aceptar/${f.token_profesor}`,
      };
    })
    // Las que menos tiempo les queda, primero: es el orden en que hay que
    // llamarles.
    .sort((a, b) => a.diasQueQuedan - b.diasQueQuedan)
    .slice(0, 25);
}
