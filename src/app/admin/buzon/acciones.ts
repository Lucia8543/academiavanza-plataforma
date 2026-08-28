'use server';

import { revalidatePath } from 'next/cache';
import { cambiarEstadoIncidencia } from '@/backend/services/incidencias';
import { haySesion } from '@/backend/services/sesion-admin';

/** Marcar una incidencia como resuelta, o devolverla a pendiente. */
export async function marcarIncidencia(formulario: FormData) {
  if (!(await haySesion())) throw new Error('Sin sesión');

  const id = String(formulario.get('id') ?? '');
  const estado = String(formulario.get('estado') ?? '');

  if (estado !== 'nueva' && estado !== 'vista' && estado !== 'resuelta') return;

  await cambiarEstadoIncidencia(id, estado);
  revalidatePath('/admin/buzon');
}
