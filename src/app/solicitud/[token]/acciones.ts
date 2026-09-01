'use server';

import { revalidatePath } from 'next/cache';
import {
  corregirCorreo,
  familiaDiceQueHaPagado,
  pedirVale,
  responderAlRecordatorio,
  type MotivoVale,
} from '@/backend/services/solicitud';
import { esMotivoCierre } from '@/shared/textos/motivos-cierre';
import { DIAS_PARA_RECLAMAR } from '@/shared/reglas/cobro';

/**
 * La familia reclama su contacto gratis.
 *
 * El token de su página es la única credencial, y es suficiente: es largo, no
 * se adivina y sólo lo tiene ella. Lo que hay detrás no permite hacer daño a
 * nadie —como mucho, quedarse sin poder reclamar dos veces por lo mismo—.
 */

export type EstadoVale = { ok?: boolean; error?: string };

const EXPLICACION: Record<string, string> = {
  'no-existe': 'No encontramos tu solicitud.',
  'no-pagada': 'Todavía no has pagado este contacto, así que no hay nada que devolverte.',
  /*
   * El número no se escribe a mano. Estaba puesto como «tres» en letra, y
   * cambiar `DIAS_PARA_RECLAMAR` desde su fichero habría dejado esta frase
   * prometiendo otra cosa sin que fallara ninguna prueba.
   */
  'demasiado-pronto': `Espera ${DIAS_PARA_RECLAMAR} días desde que pagaste. Muchos profesores tardan un día o dos en llamar, y no queremos darte por perdido antes de tiempo.`,
  /*
   * El mensaje de fuera de plazo no acusa a nadie, y es deliberado.
   *
   * Quien lo lea puede ser perfectamente una familia que estuvo dos meses con
   * un profesor y ahora se ha quedado sin él, que es una situación fastidiosa y
   * no una trampa. Lo que ha pasado es que el contacto sí funcionó, y este vale
   * cubre otra cosa. Decirlo así, y darle a la vez la salida de escribirnos,
   * cuesta lo mismo que decirlo seco.
   */
  'fuera-de-plazo':
    'El contacto gratis se puede pedir durante el primer mes desde el pago, y en éste ya ha pasado ese plazo. Si tu caso tiene algo especial, cuéntanoslo en info@academiavanza.es y lo vemos contigo.',
  'ya-lo-tiene': 'Ya tienes un contacto gratis pendiente de usar.',
  'falta-motivo': 'Marca antes qué es lo que no ha encajado.',
};

export async function reclamar(
  _previo: EstadoVale,
  formulario: FormData,
): Promise<EstadoVale> {
  const token = String(formulario.get('token') ?? '');
  const motivo = String(formulario.get('motivo') ?? '') as MotivoVale;
  const crudo = String(formulario.get('detalle') ?? '');

  if (motivo !== 'sin-contacto' && motivo !== 'no-funciono') {
    return { error: 'No hemos entendido qué ha pasado.' };
  }

  const resultado = await pedirVale(
    token,
    motivo,
    esMotivoCierre(crudo) ? crudo : undefined,
  );

  if (!resultado.ok) {
    return {
      error:
        EXPLICACION[resultado.motivo] ??
        'No hemos podido dártelo. Escríbenos a info@academiavanza.es.',
    };
  }

  revalidatePath(`/solicitud/${token}`);
  return { ok: true };
}

/** «Sí, voy a pagar» o «déjalo», del recordatorio. */
export async function contestarRecordatorio(formulario: FormData) {
  const token = String(formulario.get('token') ?? '');
  const va = String(formulario.get('va') ?? '') === 'si';
  const crudo = String(formulario.get('motivo') ?? '');

  await responderAlRecordatorio(
    token,
    va,
    esMotivoCierre(crudo) ? crudo : undefined,
  );
  revalidatePath(`/solicitud/${token}`);
}

/**
 * «Ya he hecho el Bizum».
 *
 * No comprueba nada ni abre nada: sólo evita que la plataforma le reclame el
 * pago y le cierre la solicitud a alguien que ya ha pagado y está esperando a
 * que alguien mire el móvil.
 */
export async function hePagado(formulario: FormData) {
  const token = String(formulario.get('token') ?? '');

  await familiaDiceQueHaPagado(token);
  revalidatePath(`/solicitud/${token}`);
}

export type EstadoCorreo = { ok?: boolean; error?: string };

/** Corregir el correo, para quien se dio cuenta de que puso «gmial». */
export async function cambiarCorreo(
  _previo: EstadoCorreo,
  formulario: FormData,
): Promise<EstadoCorreo> {
  const token = String(formulario.get('token') ?? '');
  const email = String(formulario.get('email') ?? '');

  const ok = await corregirCorreo(token, email);

  if (!ok) return { error: 'Ese correo no parece válido.' };

  revalidatePath(`/solicitud/${token}`);
  return { ok: true };
}
