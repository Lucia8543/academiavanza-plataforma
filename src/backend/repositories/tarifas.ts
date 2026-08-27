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

export async function precioVigente(): Promise<number> {
  const tarifa = await db.tarifas.findFirst({
    where: { concepto: 'match', vigente_hasta: null },
    orderBy: { vigente_desde: 'desc' },
    select: { importe: true },
  });

  // Sin tarifa vigente el match sale gratis, y es lo correcto: es preferible
  // regalar un contacto a pedirle a alguien una cantidad que nadie ha fijado.
  if (!tarifa) {
    console.error('[tarifas] No hay ninguna tarifa vigente para el match.');
    return 0;
  }

  return Number(tarifa.importe);
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
