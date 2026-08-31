import { db } from '@/backend/repositories/cliente';

/**
 * Frenos contra el abuso.
 *
 * Escribir a un profesor es gratis, y eso es una decisión de producto correcta:
 * cobrar por escribir mataría la plataforma. Pero gratis y sin límite significa
 * que una persona aburrida puede mandar treinta solicitudes en diez minutos y
 * quemar la paciencia de todo el directorio. Los profesores no cobran por
 * atender esto; lo único que tienen es su buena voluntad, y se gasta.
 *
 * Los límites de aquí están puestos donde no molestan a nadie normal:
 *
 *   - Una familia que busca profesor escribe a dos o tres. Ninguna escribe a
 *     ocho el mismo día.
 *   - Nadie escribe dos veces al mismo profesor en una semana.
 *   - Nadie se da de alta como profesor tres veces en un día.
 *
 * Se cuenta por teléfono y no por dirección de internet. La dirección cambia
 * al salir de casa y es compartida por barrios enteros; el teléfono es el dato
 * que ya pedimos y el que de verdad identifica a quien escribe.
 *
 * Esto no para a alguien decidido a hacer daño —para eso haría falta verificar
 * el teléfono con un SMS, que cuesta dinero— pero sí para lo que de verdad
 * pasa: el aburrido, el que prueba, y el error de dar dos veces al botón.
 */

/**
 * Solicitudes que puede mandar un mismo teléfono en un día.
 *
 * Ocho, y no cinco, porque una familia con tres hijos que busque profesor de
 * mates y de inglés para cada uno se plantaría en seis sin estar haciendo nada
 * raro. El abuso que esto corta empieza en treinta, no en ocho.
 */
const SOLICITUDES_POR_DIA = 8;

/** Días que tienen que pasar para volver a escribir al mismo profesor. */
const DIAS_ENTRE_REPETICIONES = 7;

/**
 * Altas de profesor que se aceptan al día en total.
 *
 * Empezó en veinte, subió a cincuenta y ahora está en trescientas, y cada
 * subida ha sido por lo mismo: **el número salía de una estimación de cuánta
 * gente se apuntaría, y esa estimación era de antes de tener una academia de
 * ciento diecisiete profesores a los que se avisa el mismo día.**
 *
 * Cincuenta era menos de la mitad de la lista. Una tarde en que contestaran la
 * mitad de los avisados, el tope habría dejado fuera al resto enseñándoles un
 * mensaje que además suena a que todo ha ido bien.
 *
 * Trescientas no es una estimación de nada: es un techo que no se alcanza sin
 * que alguien esté atacando el formulario. **No está para regular el ritmo de
 * altas, está para que un guion no pueda vaciar la cuota de correo ni quemar la
 * reputación del dominio mandando mil correos en una noche**, que es el daño
 * caro y el que no se deshace.
 *
 * La defensa de verdad sigue siendo la de `shared/schemas/trampa-bots`.
 */
const ALTAS_POR_DIA = 300;

function haceHoras(horas: number): Date {
  return new Date(Date.now() - horas * 60 * 60 * 1000);
}

export type Veredicto =
  | { permitido: true }
  | { permitido: false; motivo: string };

/**
 * ¿Puede este teléfono escribir a este profesor ahora mismo?
 *
 * El mensaje que se devuelve se le enseña tal cual a quien escribe, así que
 * está redactado para una persona que probablemente no está haciendo nada malo:
 * ha dado dos veces al botón, o está buscando profesor con prisa. No acusa.
 */
export async function puedeEscribir(
  telefono: string,
  profesorId: string,
): Promise<Veredicto> {
  const [hoy, aEste] = await Promise.all([
    db.contactos.count({
      where: {
        telefono_familia: telefono,
        enviado_en: { gt: haceHoras(24) },
      },
    }),
    db.contactos.findFirst({
      where: {
        telefono_familia: telefono,
        profesor_id: profesorId,
        enviado_en: { gt: haceHoras(DIAS_ENTRE_REPETICIONES * 24) },
      },
      select: { estado: true },
      orderBy: { enviado_en: 'desc' },
    }),
  ]);

  // Escribir dos veces al mismo profesor casi nunca es abuso: es una familia
  // con dos hijos, o con dos asignaturas. Y en ese caso **no debe pagar dos
  // veces**, porque el contacto con esa persona ya lo tiene o está en camino.
  // Lo que hay que hacer no es bloquearla en seco, sino explicárselo.
  if (aEste) {
    return {
      permitido: false,
      motivo:
        aEste.estado === 'pagada'
          ? 'Ya pagaste el contacto con este profesor y él tiene tu teléfono. Si necesitas clases para otro hijo o de otra asignatura, díselo a él cuando habléis: no tienes que pagar otra vez.'
          : 'Ya le has escrito hace poco y todavía no ha contestado. Cuando lo haga podrás contarle todo lo que necesites; si es para dos hijos o dos asignaturas, se lo dices en la llamada y no pagas dos veces.',
    };
  }

  if (hoy >= SOLICITUDES_POR_DIA) {
    return {
      permitido: false,
      motivo:
        'Has escrito a varios profesores hoy. Espera a ver qué te contestan y mañana puedes seguir. Lo hacemos para no saturarles.',
    };
  }

  return { permitido: true };
}

/**
 * ¿Se aceptan más altas de profesor hoy?
 *
 * Este límite es global y no por persona, porque en el alta no hay ningún dato
 * que sirva para contar: el correo y el teléfono se los inventa quien quiera.
 * Veinte al día es diez veces más de lo que esperamos en el mejor día del
 * curso, así que un profesor real nunca se lo va a encontrar; lo que corta es
 * el guion automático que llena el panel de mil fichas basura.
 *
 * No es una defensa fuerte y no pretende serlo. Es un tope que convierte un
 * problema de mil fichas en uno de veinte, que se borran en un minuto.
 */
export async function seAceptanAltas(): Promise<Veredicto> {
  const hoy = await db.profesores.count({
    where: { creado_en: { gt: haceHoras(24) } },
  });

  if (hoy >= ALTAS_POR_DIA) {
    return {
      permitido: false,
      motivo:
        'No hemos podido guardar tu ficha. Hoy hemos recibido un número de ' +
        'altas fuera de lo normal y hemos tenido que parar el formulario un ' +
        'rato. Vuelve a intentarlo mañana, o escríbenos a info@academiavanza.es ' +
        'y la damos de alta nosotros.',
    };
  }

  return { permitido: true };
}
