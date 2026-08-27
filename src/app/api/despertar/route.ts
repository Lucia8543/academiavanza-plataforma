import { NextResponse } from 'next/server';
import { despertar } from '@/backend/services/mantenimiento';

/**
 * Un ping a la base de datos, dos veces por semana.
 *
 * El plan gratuito de Supabase pausa el proyecto tras siete días sin actividad
 * y despertarlo tarda medio minuto. Una familia que entra un martes de agosto y
 * se encuentra la web colgada no vuelve a entrar.
 *
 * No lleva secreto a propósito: lo único que hace es contar filas. Que alguien
 * la llame es exactamente lo que queremos que pase.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const viva = await despertar();

  return NextResponse.json(
    { viva },
    { status: viva ? 200 : 503 },
  );
}
