import { type Cupo, normalizarCupo } from '@/shared/reglas/cupo';
import { FRANJAS, type Franja } from '@/shared/schemas/profesor';
import { formatearTelefono } from '@/shared/schemas/telefono';
import {
  esMotivoCierre,
  seLeCuentaAlProfesor,
  type MotivoCierre,
} from '@/shared/textos/motivos-cierre';
import { db } from './cliente';

/**
 * Cuánto tiempo se le enseña a un profesor por qué no siguieron con él.
 *
 * Medio año. Menos sería no dejarle ver un patrón —con pocas solicitudes al
 * trimestre, tres meses pueden no contener nada— y más sería reprocharle en
 * enero algo que arregló en marzo del año anterior.
 */
const MESES_DE_MOTIVOS = 6;

/**
 * La ficha vista por su propio dueño.
 *
 * Aquí sí aparecen el correo y el teléfono: son suyos. Lo que no aparece son
 * los datos de ninguna familia, porque para eso está el enlace de cada
 * solicitud.
 */

export type MiFicha = {
  id: string;
  slug: string;
  nombre: string;
  nombrePublico: string;
  email: string;
  telefono: string;
  colegio: string | null;
  estado: string;
  disponible: boolean;
  cupo: Cupo;
  motivoRechazo: string | null;
  asignaturas: string[];
  niveles: string[];
  idiomas: string[];
  disponibilidad: { dia: number; franja: Franja }[];
  puntosFuertes: string | null;
  anosExperiencia: number | null;
  modalidad: string;
  zona: string | null;
  desplazamientoFlexible: boolean;
  /** Solicitudes pendientes de contestar, con su enlace. */
  pendientes: { token: string; nivel: string | null; enviadaEn: Date }[];
  /** Cuántas familias han llegado a pagar por hablar con él. */
  contactosPagados: number;
  /**
   * Por qué no siguieron las familias que no siguieron.
   *
   * Agrupado y contado, nunca en forma de lista de casos. La diferencia importa:
   * con seis solicitudes al trimestre, «el 4 de marzo alguien dijo que le venías
   * lejos» es una familia identificable, y «2 · le venía lejos» no lo es.
   *
   * Por lo mismo no lleva fechas. Un profesor sabe perfectamente qué día le
   * escribió cada familia, así que una fecha aquí sería un nombre escrito con
   * otras letras.
   */
  motivosCierre: { motivo: MotivoCierre; veces: number }[];
  /**
   * Meses desde la última vez que confirmó que sigue disponible.
   *
   * Se calcula aquí y no al pintar la página. La regla de React es que un
   * componente tiene que dar el mismo resultado siempre que se le llame con lo
   * mismo, y `Date.now()` no lo cumple: leer el reloj es trabajo de la capa que
   * ya está leyendo datos.
   */
  mesesSinConfirmar: number;
};

function franjaDeHora(hora: Date): Franja | null {
  const hhmm = hora.toISOString().slice(11, 16);
  return (
    (Object.keys(FRANJAS) as Franja[]).find(
      (f) => FRANJAS[f].inicio === hhmm,
    ) ?? null
  );
}

export async function cargarMiFicha(
  profesorId: string,
): Promise<MiFicha | null> {
  const p = await db.profesores.findUnique({
    where: { id: profesorId },
    select: {
      id: true,
      slug: true,
      nombre: true,
      apellidos: true,
      email: true,
      telefono: true,
      estado: true,
      disponible: true,
      cupo: true,
      motivo_rechazo: true,
      puntos_fuertes: true,
      anos_experiencia: true,
      modalidad: true,
      zona_otra: true,
      desplazamiento_flexible: true,
      disponibilidad_confirmada_en: true,
      colegios: { select: { nombre: true, nombre_corto: true } },
      colegio_otro: true,
      profesor_asignaturas: {
        select: { asignaturas: { select: { nombre: true } } },
      },
      profesor_niveles: { select: { niveles: { select: { nombre: true } } } },
      profesor_certificaciones: {
        select: {
          certificaciones_idioma: { select: { idioma: true, nivel_mcer: true } },
        },
      },
      profesor_disponibilidad: {
        select: { dia_semana: true, hora_inicio: true },
        orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
      },
      contactos: {
        where: { estado: { in: ['pendiente_profesor', 'pagada'] } },
        select: {
          estado: true,
          token_profesor: true,
          enviado_en: true,
          niveles: { select: { nombre: true } },
        },
        orderBy: { enviado_en: 'desc' },
      },
    },
  });

  if (!p) return null;

  const inicial = p.apellidos.trim().split(/\s+/)[0]?.[0] ?? '';
  const motivosCierre = await motivosDeCierre(p.id);

  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    nombrePublico: `${p.nombre} ${inicial ? `${inicial.toUpperCase()}.` : ''}`.trim(),
    email: p.email,
    telefono: formatearTelefono(p.telefono ?? ''),
    colegio:
      p.colegios?.nombre_corto ?? p.colegios?.nombre ?? p.colegio_otro ?? null,
    estado: String(p.estado),
    disponible: p.disponible,
    cupo: normalizarCupo(p.cupo),
    motivoRechazo: p.motivo_rechazo,
    asignaturas: p.profesor_asignaturas.map((a) => a.asignaturas.nombre),
    niveles: p.profesor_niveles.map((n) => n.niveles.nombre),
    idiomas: p.profesor_certificaciones.map((c) =>
      `${c.certificaciones_idioma.idioma} ${c.certificaciones_idioma.nivel_mcer ?? ''}`.trim(),
    ),
    disponibilidad: p.profesor_disponibilidad.flatMap((d) => {
      const franja = franjaDeHora(d.hora_inicio);
      return franja ? [{ dia: d.dia_semana, franja }] : [];
    }),
    puntosFuertes: p.puntos_fuertes,
    anosExperiencia: p.anos_experiencia,
    modalidad: String(p.modalidad),
    zona: p.zona_otra,
    desplazamientoFlexible: p.desplazamiento_flexible,
    pendientes: p.contactos
      .filter((c) => c.estado === 'pendiente_profesor')
      .map((c) => ({
        token: c.token_profesor,
        nivel: c.niveles?.nombre ?? null,
        enviadaEn: c.enviado_en,
      })),
    contactosPagados: p.contactos.filter((c) => c.estado === 'pagada').length,
    motivosCierre,
    mesesSinConfirmar: Math.floor(
      (Date.now() - new Date(p.disponibilidad_confirmada_en).getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    ),
  };
}

/**
 * Los motivos por los que unas familias no siguieron, agrupados y contados.
 *
 * Va en su propia consulta y no dentro de la de arriba porque pide otro filtro
 * sobre la misma relación, y Prisma no deja seleccionar dos veces `contactos`
 * con condiciones distintas.
 *
 * Se queda fuera «no quiso pagar el contacto». Ese motivo no habla del profesor
 * sino del precio que cobra la plataforma, y enseñárselo sería pasarle una queja
 * que no es suya y que no puede resolver.
 */
async function motivosDeCierre(
  profesorId: string,
): Promise<{ motivo: MotivoCierre; veces: number }[]> {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - MESES_DE_MOTIVOS);

  const filas = await db.contactos.groupBy({
    by: ['motivo_cierre'],
    where: {
      profesor_id: profesorId,
      motivo_cierre: { not: null },
      motivo_cierre_en: { gte: desde },
    },
    _count: { _all: true },
  });

  return filas
    .flatMap((f) => {
      const motivo = f.motivo_cierre ?? '';
      return esMotivoCierre(motivo) && seLeCuentaAlProfesor(motivo)
        ? [{ motivo, veces: f._count._all }]
        : [];
    })
    .sort((a, b) => b.veces - a.veces);
}

/**
 * Pausar o reactivar la ficha.
 *
 * Pausar no borra nada: la ficha desaparece del directorio y deja de recibir
 * solicitudes, y vuelve cuando su dueño quiera. Borrar una ficha porque alguien
 * esté ocupado un mes sería perder a un profesor para siempre.
 *
 * Reactivar cuenta además como confirmar que sigue disponible, así que reinicia
 * el reloj del recordatorio trimestral.
 */
export async function cambiarDisponibilidad(
  profesorId: string,
  disponible: boolean,
): Promise<void> {
  await db.profesores.update({
    where: { id: profesorId },
    data: {
      disponible,
      // Volver a publicar borra la marca de «se pausó sola». A partir de ese
      // momento la ficha está fuera o dentro porque él lo ha decidido, y deja
      // de ser un caso que haya que perseguir desde el panel.
      ...(disponible
        ? { disponibilidad_confirmada_en: new Date(), pausada_auto_en: null }
        : {}),
      ultimo_recordatorio_en: null,
    },
  });
}

/**
 * Cuánto sitio le queda.
 *
 * Tres respuestas posibles, y sólo dos columnas porque la tercera es la que ya
 * existía: quien no puede coger a nadie apaga `disponible` y desaparece del
 * directorio.
 *
 *   'busca'  quiere alumnos y aparece primero.
 *   'justo'  sigue apareciendo, con etiqueta y detrás de los que buscan.
 *   'ninguno' se pausa la ficha entera.
 *
 * Se pregunta justo después de aceptar a una familia, que es el único momento
 * del año en que un profesor está pensando exactamente en esto.
 */
export async function cambiarCupo(
  profesorId: string,
  cupo: Cupo | 'ninguno',
): Promise<void> {
  await db.profesores.update({
    where: { id: profesorId },
    data:
      cupo === 'ninguno'
        ? { disponible: false, ultimo_recordatorio_en: null }
        : {
            cupo,
            disponible: true,
            // Decir cuánto sitio te queda es confirmar que sigues activo, así
            // que reinicia también el reloj del recordatorio trimestral.
            disponibilidad_confirmada_en: new Date(),
            ultimo_recordatorio_en: null,
            pausada_auto_en: null,
          },
  });
}

/** «Sigo disponible», sin cambiar nada más. Reinicia el reloj trimestral. */
export async function confirmarDisponibilidad(
  profesorId: string,
): Promise<void> {
  await db.profesores.update({
    where: { id: profesorId },
    data: {
      disponible: true,
      disponibilidad_confirmada_en: new Date(),
      ultimo_recordatorio_en: null,
      pausada_auto_en: null,
    },
  });
}

/**
 * Cambia lo que el profesor puede cambiar por su cuenta.
 *
 * Deliberadamente **no** se puede cambiar el colegio ni el nombre. El colegio es
 * lo único que administración revisa antes de publicar, y dejar que se edite
 * después convertiría esa revisión en un trámite sin valor: cualquiera podría
 * darse de alta con un colegio y cambiarlo por otro al día siguiente.
 */
export async function actualizarOferta(
  profesorId: string,
  datos: {
    asignaturas: string[];
    niveles: string[];
    certificaciones: string[];
    disponibilidad: { dia: number; inicio: string; fin: string }[];
    puntosFuertes: string;
    anosExperiencia: number | null;
    telefono: string;
    /**
     * Puede cambiarlo porque es su identidad: por ahí le llega todo. Un
     * profesor que cambia de dirección y no puede decírnoslo se queda
     * incomunicado sin saberlo.
     */
    email: string;
    modalidad: 'online' | 'presencial' | 'ambas';
    zona: string;
    desplazamientoFlexible: boolean;
  },
): Promise<void> {
  // Si su ficha estaba rechazada, guardar la vuelve a poner en la cola.
  //
  // Sin esto, el correo de rechazo le decía «corrígelo y lo volvemos a mirar»,
  // él lo corregía, y su ficha se quedaba rechazada para siempre: no volvía a
  // aparecer en el panel y nadie la miraba nunca. Una promesa que el sistema no
  // cumplía.
  const actual = await db.profesores.findUnique({
    where: { id: profesorId },
    select: { estado: true },
  });

  const vuelveALaCola = actual?.estado === 'rechazado';

  await db.$transaction(async (tx) => {
    await tx.profesores.update({
      where: { id: profesorId },
      data: {
        puntos_fuertes: datos.puntosFuertes,
        anos_experiencia: datos.anosExperiencia,
        telefono: datos.telefono,
        email: datos.email,
        modalidad: datos.modalidad,
        zona_otra: datos.modalidad === 'online' ? null : datos.zona || null,
        desplazamiento_flexible:
          datos.modalidad !== 'online' && datos.desplazamientoFlexible,
        ...(vuelveALaCola
          ? { estado: 'pendiente' as const, motivo_rechazo: null }
          : {}),
      },
    });

    // Se borra y se vuelve a crear en vez de calcular diferencias. Son tablas
    // de dos columnas y como mucho veinte filas: la diferencia de rendimiento
    // no existe y el código con diferencias sí tiene formas de equivocarse.
    await tx.profesor_asignaturas.deleteMany({ where: { profesor_id: profesorId } });
    await tx.profesor_asignaturas.createMany({
      data: datos.asignaturas.map((asignatura_id) => ({
        profesor_id: profesorId,
        asignatura_id,
      })),
    });

    await tx.profesor_niveles.deleteMany({ where: { profesor_id: profesorId } });
    await tx.profesor_niveles.createMany({
      data: datos.niveles.map((nivel_id) => ({
        profesor_id: profesorId,
        nivel_id,
      })),
    });

    await tx.profesor_certificaciones.deleteMany({
      where: { profesor_id: profesorId },
    });
    if (datos.certificaciones.length > 0) {
      await tx.profesor_certificaciones.createMany({
        data: datos.certificaciones.map((certificacion_id) => ({
          profesor_id: profesorId,
          certificacion_id,
        })),
      });
    }

    await tx.profesor_disponibilidad.deleteMany({
      where: { profesor_id: profesorId },
    });
    if (datos.disponibilidad.length > 0) {
      await tx.profesor_disponibilidad.createMany({
        data: datos.disponibilidad.map((f) => ({
          profesor_id: profesorId,
          dia_semana: f.dia,
          hora_inicio: new Date(`1970-01-01T${f.inicio}:00Z`),
          hora_fin: new Date(`1970-01-01T${f.fin}:00Z`),
        })),
        skipDuplicates: true,
      });
    }
  });
}

/** Los identificadores que ya tiene marcados, para precargar el formulario. */
export async function seleccionActual(profesorId: string) {
  const p = await db.profesores.findUnique({
    where: { id: profesorId },
    select: {
      profesor_asignaturas: { select: { asignatura_id: true } },
      profesor_niveles: { select: { nivel_id: true } },
      profesor_certificaciones: { select: { certificacion_id: true } },
      profesor_disponibilidad: {
        select: { dia_semana: true, hora_inicio: true },
      },
    },
  });

  if (!p) return null;

  return {
    asignaturas: p.profesor_asignaturas.map((a) => a.asignatura_id),
    niveles: p.profesor_niveles.map((n) => n.nivel_id),
    certificaciones: p.profesor_certificaciones.map((c) => c.certificacion_id),
    disponibilidad: p.profesor_disponibilidad.flatMap((d) => {
      const franja = franjaDeHora(d.hora_inicio);
      return franja ? [`${d.dia_semana}-${franja}`] : [];
    }),
  };
}

/**
 * Cuántas solicitudes ha dejado caducar sin contestar, de las recientes.
 *
 * Es un número que el profesor tiene que poder ver **antes** de que le cueste la
 * ficha, no después. Una regla que sólo se descubre cuando ya te ha caído
 * encima no es una regla, es una trampa, y ésta le saca del directorio.
 *
 * Cuenta lo mismo que cuenta la tarea que pausa: sólo las que caducaron por su
 * silencio —`aceptada_en` a nulo distingue de las que aceptó y la familia no
 * pagó— y sólo las de los últimos noventa días.
 */
export async function caducadasSinContestar(
  profesorId: string,
): Promise<number> {
  return db.contactos.count({
    where: {
      profesor_id: profesorId,
      estado: 'caducada',
      aceptada_en: null,
      enviado_en: { gt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  });
}
