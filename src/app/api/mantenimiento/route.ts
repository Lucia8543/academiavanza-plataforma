import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { pasarMantenimiento } from '@/backend/services/mantenimiento';

/**
 * La puerta por la que Vercel llama a las tareas automáticas.
 *
 * Se ejecuta una vez al día, a las siete de la mañana, según `vercel.json`.
 * No hay pantalla ni botón: nadie tiene que acordarse de nada.
 *
 * Está protegida con un secreto porque, aunque estas tareas no son
 * destructivas para nadie en concreto, sí borran contactos y pausan fichas.
 * Una dirección pública que hace eso es una invitación.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function autorizada(cabecera: string | null): boolean {
  const secreto = process.env.CRON_SECRET;

  // Sin secreto configurado no se abre la puerta. Es preferible que las tareas
  // no corran —y que se note— a que corran para cualquiera.
  if (!secreto || secreto.length < 16) {
    console.error(
      '[mantenimiento] CRON_SECRET no está definido o es demasiado corto.',
    );
    return false;
  }

  const esperado = `Bearer ${secreto}`;
  const recibido = cabecera ?? '';

  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(peticion: Request) {
  if (!autorizada(peticion.headers.get('authorization'))) {
    // Sin detalles: quien llame sin la llave no merece saber si existe.
    return new NextResponse('No', { status: 401 });
  }

  const resumen = await pasarMantenimiento();

  // Queda en el registro de Vercel. Es lo único que hay para saber que esto
  // pasó, así que conviene que diga algo legible.
  console.log(
    `[mantenimiento] ${resumen.caducadas} caducadas · ` +
      `${resumen.borradas} contactos borrados · ` +
      `${resumen.recordatorios} recordatorios de disponibilidad · ` +
      `${resumen.pausadas} fichas pausadas · ` +
      `${resumen.pagosRecordados} pagos recordados · ` +
      `${resumen.pagosCaducados} pagos caducados · ` +
      `${resumen.valesPorCaducar} vales por caducar` +
      (resumen.errores.length > 0
        ? ` · FALLARON: ${resumen.errores.join(', ')}`
        : ''),
  );

  return NextResponse.json(resumen);
}
