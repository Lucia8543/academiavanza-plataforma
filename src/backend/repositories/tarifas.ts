import { precioAplicable } from '@/shared/reglas/cobro';
import { db } from './cliente';

/**
 * El precio del match.
 *
 * No es una constante del código: vive en `app.tarifas` y se cambia desde el
 * panel. La regla 4 del CLAUDE.md lo dice sin rodeos, y el motivo es práctico:
 * subir o bajar el precio no puede exigir un despliegue.
 *
 * La fila vigente es la que no tiene fecha de fin. Cambiar el precio es cerrar
 * la vigente y abrir otra, nunca editar la que hay, de modo que siempre se
 * puede saber qué costaba un match el día que alguien lo pagó.
 */

/**
 * Lo que cuesta un contacto ahora mismo.
 *
 * **Nunca devuelve cero.** Esto fue un fallo y merece quedar explicado, porque
 * la versión anterior parecía la prudente y era la peligrosa.
 *
 * Decía: sin tarifa vigente, el match sale gratis, que es preferible a cobrarle
 * a alguien una cantidad que nadie ha fijado. Suena razonable leído solo. Pero
 * un importe de cero significa, en `decidir()`, que el contacto se abre solo en
 * cuanto el profesor acepta —eso es lo que hace funcionar los vales—, así que
 * quedarse sin tarifa vigente no significaba regalar el peaje: significaba
 * **entregar los teléfonos de las dos partes sin que nadie pagara y sin que
 * saltara ninguna alarma**. Y bastaba con cerrar una tarifa desde el panel y no
 * abrir la siguiente.
 *
 * Ahora, si no hay ninguna vigente, se usa la última que hubo. Es la mejor
 * respuesta posible: un precio real, puesto por una persona, aunque esté
 * caducado. Y si no hay ninguna en absoluto, revienta, que es lo correcto: sin
 * precio no se puede cobrar, y sin cobrar no se abre ningún contacto.
 */
export async function precioVigente(): Promise<number> {
  const tarifa = await db.tarifas.findFirst({
    where: { concepto: 'match', vigente_hasta: null },
    orderBy: { vigente_desde: 'desc' },
    select: { importe: true },
  });

  // Red de seguridad: la última tarifa que existió, aunque esté cerrada. Sólo
  // se llega a mirarla si alguien ha tocado la tabla a mano, porque
  // cambiarPrecio() cierra y abre dentro de la misma transacción.
  const ultima = tarifa
    ? null
    : await db.tarifas.findFirst({
        where: { concepto: 'match' },
        orderBy: { vigente_desde: 'desc' },
        select: { importe: true },
      });

  const precio = precioAplicable(
    tarifa ? Number(tarifa.importe) : null,
    ultima ? Number(ultima.importe) : null,
  );

  if (precio === null) {
    throw new Error(
      'No hay ninguna tarifa para el match. Sin precio no se puede cobrar, y ' +
        'sin cobrar no se abre ningún contacto. Crea una desde /admin/cobros.',
    );
  }

  if (!tarifa) {
    console.error(
      `[tarifas] No hay tarifa vigente. Se usa la última cerrada (${precio} €). ` +
        'Hay que abrir una nueva desde el panel.',
    );
  }

  return precio;
}

export async function historialDePrecios() {
  return db.tarifas.findMany({
    where: { concepto: 'match' },
    orderBy: { vigente_desde: 'desc' },
    select: {
      id: true,
      importe: true,
      vigente_desde: true,
      vigente_hasta: true,
      motivo: true,
    },
    take: 10,
  });
}

/** Cierra la tarifa vigente y abre otra. Nunca edita una fila existente. */
export async function cambiarPrecio(
  importe: number,
  motivo: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.tarifas.updateMany({
      where: { concepto: 'match', vigente_hasta: null },
      data: { vigente_hasta: new Date() },
    });

    await tx.tarifas.create({
      data: {
        concepto: 'match',
        importe,
        moneda: 'EUR',
        motivo: motivo || 'Cambio de precio desde el panel',
      },
    });
  });
}
