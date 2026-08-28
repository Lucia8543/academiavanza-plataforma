import type { Prisma } from '@prisma/client';
import { db } from '@/backend/repositories/cliente';
import { nombrePublico } from '@/backend/repositories/directorio';
import { enviar } from '@/backend/services/correo';
import { correoProfesorRechaza } from '@/backend/services/plantillas-correo';
import { decidir } from '@/backend/services/solicitud';

/**
 * La baja del profesor: irse de verdad y sin pedírselo a nadie.
 *
 * El `prd-00` §7 lo pone entre las reglas que no se negocian —«darse de baja
 * borra de verdad, sin recuperación»— y el artículo 17 del RGPD da derecho a la
 * supresión. La política de privacidad ya lo prometía por escrito, «desde el
 * enlace de tu ficha», cuando desde el enlace de la ficha sólo se podía pausar.
 *
 * Hay una tensión real que resolver, y es la misma que en la limpieza de los
 * noventa días: **el derecho al borrado choca con no poder destruir el rastro
 * del dinero.** Si alguien pagó diez euros por un contacto, esa fila es la única
 * constancia de que ese dinero entró.
 *
 * Se resuelve igual que allí, distinguiendo dos situaciones:
 *
 * - **Nadie le pagó nunca.** No hay nada que conservar: se borra la fila y
 *   PostgreSQL se lleva por delante todo lo que cuelga de ella.
 * - **Alguien le pagó.** Se vacía todo lo que le identifica y se queda la fila
 *   sosteniendo las solicitudes cobradas. Lo que queda no es «Marta, 600...»:
 *   es «un profesor cobró un contacto el 3 de marzo». Esas solicitudes, además,
 *   se anonimizan solas a los noventa días por el otro lado.
 *
 * En los dos casos el enlace deja de funcionar en el acto, porque lo primero que
 * se borra son los accesos.
 */

/** El cliente de dentro de una transacción, que no es el mismo que `db`. */
type Transaccion = Prisma.TransactionClient;

export type ResultadoBaja = {
  /** `borrada` si no quedó rastro; `anonimizada` si hubo que conservar la fila. */
  como: 'borrada' | 'anonimizada';
  /** Solicitudes que estaban esperando respuesta y se han cerrado. */
  solicitudesCerradas: number;
};

/**
 * Da de baja a un profesor. Devuelve qué se ha hecho, para poder contárselo.
 *
 * El orden importa y no es casual:
 *
 * 1. Primero se cierran las solicitudes que esperaban respuesta, **mientras la
 *    ficha todavía tiene nombre**, porque el correo que avisa a esas familias
 *    lleva el nombre del profesor dentro. Hacerlo después mandaría un correo
 *    firmado por «(baja)».
 * 2. Después se corta el acceso.
 * 3. Y al final se borra o se vacía.
 */
export async function darDeBaja(profesorId: string): Promise<ResultadoBaja> {
  /*
   * Qué se decide aquí: si la fila se puede borrar entera o hay que conservarla.
   *
   * Se mira antes de tocar nada, y se incluye `aceptada` además de `pagada` y
   * `devuelta`. `aceptada` es justo el estado en el que la familia ya tiene el
   * código y el importe y puede estar haciendo el Bizum en ese momento: si se
   * borrase la ficha, el borrado en cascada se llevaría esa solicitud por
   * delante y el dinero habría entrado sin dejar rastro de nada.
   */
  const conDineroDePorMedio = await db.contactos.count({
    where: {
      profesor_id: profesorId,
      estado: { in: ['pagada', 'devuelta', 'aceptada'] },
    },
  });

  // Va fuera de la transacción a propósito: manda correos, y un correo no se
  // deshace. Mejor un correo de más que una transacción abierta esperando a un
  // servidor de correo.
  const solicitudesCerradas = await cerrarLoQueSeguiaVivo(profesorId);

  /*
   * Y a partir de aquí, todo o nada.
   *
   * Sin transacción, un fallo a mitad dejaba la ficha en el peor estado
   * posible: sin accesos, sin asignaturas y sin horarios, pero todavía
   * `activo` y `disponible`. O sea, publicada, vacía, y su titular sin ningún
   * enlace con el que arreglarlo.
   */
  await db.$transaction(async (tx) => {
    // El enlace es la llave y deja de valer aquí.
    await tx.accesos.deleteMany({ where: { profesor_id: profesorId } });
    await tx.suscripciones_push.deleteMany({
      where: { profesor_id: profesorId },
    });

    if (conDineroDePorMedio === 0) {
      await tx.profesores.delete({ where: { id: profesorId } });
    } else {
      await anonimizar(tx, profesorId);
    }
  });

  return {
    como: conDineroDePorMedio === 0 ? 'borrada' : 'anonimizada',
    solicitudesCerradas,
  };
}

/**
 * Cierra lo que seguía vivo, para que nadie se quede esperando.
 *
 * Son dos situaciones distintas y por eso se tratan por separado. Una familia
 * que escribió ayer no tiene por qué enterarse de que el profesor se ha ido,
 * pero sí tiene que enterarse de que no va a haber respuesta.
 *
 * **Hay un tercer caso que a propósito no se toca:** una solicitud aceptada en
 * la que la familia ya ha pulsado «ya he hecho el Bizum». Ahí puede haber
 * dinero movido que nadie ha confirmado todavía, y cancelarla sería decidir por
 * Lucía sobre un pago que quizá esté hecho. Se queda como está, sale en el
 * panel de cobros y en el resumen diario, y lo resuelve una persona. Es la
 * única excepción a la regla de que nada requiera intervención, y es
 * deliberada: cerrar en falso algo con dinero de por medio es peor.
 */
async function cerrarLoQueSeguiaVivo(profesorId: string): Promise<number> {
  let cerradas = 0;

  // 1. Las que aún esperaban respuesta del profesor. Se reutiliza `decidir()`,
  //    que es el camino probado y el que manda el correo a la familia.
  const esperando = await db.contactos.findMany({
    where: { profesor_id: profesorId, estado: 'pendiente_profesor' },
    select: { token_profesor: true },
  });

  for (const { token_profesor } of esperando) {
    if (await decidir(token_profesor, 'rechazar')) cerradas += 1;
  }

  // 2. Las aceptadas en las que la familia todavía no dice haber pagado. Si no
  //    se cierran, las tareas automáticas seguirán mandándole recordatorios de
  //    pago firmados por «(baja)» y escribiendo a un correo que ya no existe.
  const aceptadas = await db.contactos.findMany({
    where: {
      profesor_id: profesorId,
      estado: 'aceptada',
      pago_avisado_en: null,
    },
    select: {
      id: true,
      email_familia: true,
      nombre_familia: true,
      profesores: { select: { nombre: true, apellidos: true } },
    },
  });

  for (const solicitud of aceptadas) {
    await db.contactos.update({
      where: { id: solicitud.id },
      // `cancelada` exige su fecha: la tabla rechaza un estado sin ella.
      data: { estado: 'cancelada', cancelada_en: new Date() },
    });

    if (solicitud.email_familia) {
      await enviar(
        correoProfesorRechaza({
          para: solicitud.email_familia,
          nombreFamilia: solicitud.nombre_familia,
          nombreProfesor: nombrePublico(
            solicitud.profesores.nombre,
            solicitud.profesores.apellidos,
          ),
          motivo: null,
        }),
      );
    }

    cerradas += 1;
  }

  return cerradas;
}

/**
 * Vacía todo lo que identifica al profesor, dejando la fila en pie.
 *
 * Cada valor de relleno está elegido para no chocar con una restricción de la
 * tabla, que es donde esto se rompería en silencio:
 *
 * - `nombre`, `apellidos` y `email` son NOT NULL, así que se marcan en vez de
 *   vaciarse. El correo lleva el id dentro porque la columna es UNIQUE, y acaba
 *   en `.invalid`, un dominio que por norma no puede existir: si algún día algo
 *   intenta escribirle, no llega a ninguna parte.
 * - `slug` cambia para que la dirección pública que tuviera —y que puede estar
 *   en el historial de alguien o en un correo antiguo— deje de existir.
 * - `colegio_otro` se rellena porque `prof_colegio_informado` exige que haya
 *   colegio, de catálogo o escrito. Se suelta el del catálogo, que junto al
 *   resto de datos todavía apunta a una persona.
 * - `estado` pasa a `inactivo`, que es lo que la saca del directorio.
 */
async function anonimizar(tx: Transaccion, profesorId: string): Promise<void> {
  // Lo que eligió —asignaturas, cursos, certificados, horarios— no hace falta
  // para sostener ningún cobro, así que se va entero.
  await tx.profesor_asignaturas.deleteMany({ where: { profesor_id: profesorId } });
  await tx.profesor_niveles.deleteMany({ where: { profesor_id: profesorId } });
  await tx.profesor_certificaciones.deleteMany({
    where: { profesor_id: profesorId },
  });
  await tx.profesor_disponibilidad.deleteMany({
    where: { profesor_id: profesorId },
  });

  await tx.profesores.update({
    where: { id: profesorId },
    data: {
      slug: `baja-${profesorId}`,
      nombre: '(baja)',
      apellidos: '(baja)',
      email: `baja-${profesorId}@ejemplo.invalid`,
      telefono: null,
      colegio_id: null,
      colegio_otro: '(baja)',
      titulacion: null,
      universidad: null,
      curso_actual: null,
      puntos_fuertes: null,
      zona_otra: null,
      anos_experiencia: null,
      motivo_rechazo: null,
      estado: 'inactivo',
      disponible: false,
    },
  });
}
