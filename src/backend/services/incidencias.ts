import { db } from '@/backend/repositories/cliente';
import { quienEscribe, rutaSegura } from '@/shared/reglas/incidencias';
import { detectarDatosSensibles } from '@/shared/schemas/datos-sensibles';
import type { Sospecha } from '@/shared/schemas/trampa-bots';

/**
 * El buzón de «algo no funciona».
 *
 * Existe porque hasta ahora no había ninguno, y eso significa que los fallos más
 * caros eran invisibles: los que hacen que alguien cierre la pestaña sin llegar
 * a escribir a ningún profesor. De ésos no se entera nadie nunca. Quien llega
 * hasta el final y algo le falla, al menos puede quejarse; quien se atasca en el
 * segundo paso, se va y ya está.
 *
 * Por eso está abierto a cualquiera y no sólo a quien tiene un enlace: el que
 * más falta hace que escriba es justamente el que todavía no es nadie para la
 * plataforma.
 *
 * **No se le pregunta quién es.** Se deduce de la página desde la que abre el
 * buzón. Cada campo que se añade a un formulario de quejas es gente que no lo
 * rellena, y aquí lo único que importa es el texto.
 */

export type ResultadoIncidencia = { ok: true } | { ok: false; motivo: string };

const MINIMO = 10;
const MAXIMO = 2000;

/**
 * Guarda una incidencia.
 *
 * El texto pasa por el filtro de datos sensibles como todo lo demás. Es un campo
 * libre en el que alguien puede acabar contando por qué su hijo necesita clases,
 * y aquí el descuido sería peor que en otros sitios: esta tabla se lee entera
 * desde el panel y se exporta a un fichero de texto.
 */
export async function guardarIncidencia(datos: {
  texto: string;
  pagina?: string | null;
  email?: string | null;
  /**
   * Lo que vio el detector antibots, si vio algo. Sólo se guarda. Un buzón de
   * fallos que descarta mensajes por sospecha es un buzón que oculta fallos.
   */
  sospecha?: Sospecha;
}): Promise<ResultadoIncidencia> {
  const texto = datos.texto.trim();

  if (texto.length < MINIMO) {
    return { ok: false, motivo: 'Cuéntanos un poco más, con una frase basta.' };
  }
  if (texto.length > MAXIMO) {
    return { ok: false, motivo: `Son más de ${MAXIMO} caracteres. Resúmelo un poco.` };
  }

  const sensible = detectarDatosSensibles(texto);
  if (sensible) {
    return {
      ok: false,
      motivo:
        'Parece que has escrito algo sobre la salud de alguien. Cuéntanos qué falló en la web sin ese dato: para arreglarlo no nos hace falta.',
    };
  }

  const email = datos.email?.trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, motivo: 'Ese correo no parece válido. Puedes dejarlo en blanco.' };
  }

  try {
    await db.incidencias.create({
      data: {
        texto,
        pagina: rutaSegura(datos.pagina),
        quien: quienEscribe(datos.pagina),
        email,
        sospecha_bot: datos.sospecha ?? null,
      },
    });
    return { ok: true };
  } catch (error) {
    console.error('[incidencias] no se ha podido guardar:', error);
    return { ok: false, motivo: 'No se ha podido guardar. Inténtalo en un rato.' };
  }
}

/** Cuántas quedan sin resolver. Para el aviso del panel. */
export async function incidenciasSinResolver(): Promise<number> {
  return db.incidencias.count({ where: { estado: { not: 'resuelta' } } });
}

/** Las que quedan por mirar, y las últimas resueltas para tener contexto. */
export async function listarIncidencias() {
  /*
   * Por fecha y no por estado. Ordenar por estado es ordenar alfabéticamente
   * —«nueva», «resuelta», «vista»—, así que una incidencia a medias quedaría
   * detrás de todas las resueltas y se caería del corte antes que ellas. La
   * pantalla ya las separa en dos bloques.
   */
  return db.incidencias.findMany({
    orderBy: { creado_en: 'desc' },
    take: 100,
  });
}

/**
 * Todas las incidencias en un texto plano, para poder pegarlas donde sea.
 *
 * Es el motivo por el que este buzón sirve de algo: leer cincuenta quejas en un
 * panel una por una no lleva a ningún arreglo. En un solo texto sí, y se puede
 * pegar entero en otra conversación para que salgan los cambios de ahí.
 *
 * **No lleva los correos.** Son de personas que escribieron para que les
 * contestaran, no para acabar en un fichero que se copia y se pega. Si hay que
 * responder a alguien, se hace desde el panel.
 */
export async function incidenciasEnTexto(): Promise<string> {
  const filas = await db.incidencias.findMany({
    where: { estado: { not: 'resuelta' } },
    orderBy: { creado_en: 'asc' },
  });

  if (filas.length === 0) return 'No hay ninguna incidencia pendiente.';

  const comoQuien: Record<string, string> = {
    familia: 'Una familia',
    profesor: 'Un profesor',
    visita: 'Alguien que visitaba la web',
  };

  return [
    `Incidencias pendientes de AcademiAvanza (${filas.length})`,
    '',
    ...filas.map((f, i) =>
      [
        `${i + 1}. ${comoQuien[f.quien] ?? 'Alguien'}, ${f.creado_en.toLocaleDateString('es-ES')}` +
          (f.pagina ? `, desde ${f.pagina}` : ''),
        f.texto,
        '',
      ].join('\n'),
    ),
  ].join('\n');
}

/** Marca una incidencia como resuelta, o la devuelve a pendiente. */
export async function cambiarEstadoIncidencia(
  id: string,
  estado: 'nueva' | 'vista' | 'resuelta',
): Promise<void> {
  await db.incidencias.update({
    where: { id },
    // La restricción de la tabla exige que una resuelta tenga su fecha.
    data: { estado, resuelto_en: estado === 'resuelta' ? new Date() : null },
  });
}
