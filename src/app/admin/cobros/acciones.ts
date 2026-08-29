'use server';

import { revalidatePath } from 'next/cache';
import { cambiarPrecio } from '@/backend/repositories/tarifas';
import {
  buscarPorCodigo,
  concederVale,
  confirmarPago,
  registrarDevolucion,
} from '@/backend/services/solicitud';
import { haySesion } from '@/backend/services/sesion-admin';

/**
 * Acciones de la pantalla de cobros.
 *
 * Confirmar un pago abre dos teléfonos, así que todas exigen sesión y ninguna
 * hace nada si no la hay. No basta con esconder la pantalla.
 */

async function exigirSesion() {
  if (!(await haySesion())) throw new Error('Sin sesión');
}

export type EstadoCobro = {
  paso: 'inicio' | 'comprobar' | 'hecho' | 'error';
  mensaje?: string;
  codigo?: string;
  resumen?: {
    nombreFamilia: string;
    telefono: string | null;
    profesor: string;
    nivel: string | null;
    importe: number;
    estado: string;
    enviadaEn: string;
  };
};

/**
 * Primer paso: buscar el código y enseñar a quién corresponde.
 *
 * Deliberadamente no confirma nada. Un Bizum mal leído —una O por un cero— con
 * confirmación directa abriría el teléfono de una familia equivocada a un
 * profesor equivocado, y eso no se deshace. Primero se mira, después se
 * confirma.
 */
export async function comprobarCodigo(
  _previo: EstadoCobro,
  formulario: FormData,
): Promise<EstadoCobro> {
  await exigirSesion();

  const codigo = String(formulario.get('codigo') ?? '')
    .trim()
    .toUpperCase();

  if (!codigo) {
    return { paso: 'error', mensaje: 'Escribe un código.' };
  }

  const s = await buscarPorCodigo(codigo);

  if (!s) {
    return {
      paso: 'error',
      mensaje: `No existe ninguna solicitud con el código ${codigo}. Revisa el concepto del Bizum: no hay ni ceros ni oes, ni unos ni íes.`,
    };
  }

  if (s.estado === 'pagada') {
    return {
      paso: 'error',
      mensaje: `El código ${codigo} ya estaba cobrado. No se ha vuelto a cobrar nada.`,
    };
  }

  if (s.estado !== 'aceptada') {
    return {
      paso: 'error',
      mensaje: `El profesor todavía no ha aceptado esta solicitud (está en «${s.estado}»). No deberías haber recibido este Bizum: devuélvelo.`,
    };
  }

  return {
    paso: 'comprobar',
    codigo,
    resumen: {
      nombreFamilia: s.nombre_familia,
      telefono: s.telefono_familia,
      profesor: `${s.profesores.nombre} ${s.profesores.apellidos}`,
      nivel: s.niveles?.nombre ?? null,
      importe: Number(s.importe ?? 0),
      estado: String(s.estado),
      enviadaEn: new Date(s.enviado_en).toLocaleDateString('es-ES'),
    },
  };
}

/** Segundo paso: confirmar. Aquí es donde el profesor recibe el teléfono. */
export async function confirmar(
  _previo: EstadoCobro,
  formulario: FormData,
): Promise<EstadoCobro> {
  await exigirSesion();

  const codigo = String(formulario.get('codigo') ?? '');
  const resultado = await confirmarPago(codigo);

  if (!resultado.ok) {
    return {
      paso: 'error',
      mensaje:
        resultado.motivo === 'no-existe'
          ? 'Ese código ya no existe.'
          : 'Esa solicitud ya no está en el estado correcto. Vuelve a comprobarla.',
    };
  }

  revalidatePath('/admin/cobros');

  return {
    paso: 'hecho',
    mensaje: `Cobrado. ${resultado.profesor} ya tiene el teléfono de ${resultado.nombreFamilia} y le escribirá.`,
  };
}

/**
 * Apuntar una devolución.
 *
 * La plataforma no mueve dinero: el Bizum de vuelta lo haces tú. Lo que hace
 * esto es dejar constancia de que lo hiciste, a quién y por qué. Sin ello, una
 * devolución es un apunte suelto en el banco y a los dos meses no hay forma de
 * reconstruir qué pasó.
 */
export async function devolver(formulario: FormData) {
  await exigirSesion();

  const codigo = String(formulario.get('codigo') ?? '');
  const importe = Number(
    String(formulario.get('importe') ?? '').replace(',', '.'),
  );
  const motivo = String(formulario.get('motivo') ?? '');

  if (!Number.isFinite(importe) || importe <= 0) return;

  await registrarDevolucion(codigo, importe, motivo);
  revalidatePath('/admin/cobros');
}

export async function darVale(formulario: FormData) {
  await exigirSesion();
  await concederVale(String(formulario.get('codigo') ?? ''));
  revalidatePath('/admin/cobros');
}

export async function actualizarPrecio(formulario: FormData) {
  await exigirSesion();

  const importe = Number(String(formulario.get('importe') ?? '').replace(',', '.'));
  const motivo = String(formulario.get('motivo') ?? '').trim();

  if (!Number.isFinite(importe) || importe < 0 || importe > 1000) return;

  await cambiarPrecio(importe, motivo);
  revalidatePath('/admin/cobros');
  revalidatePath('/profesor', 'layout');
}
