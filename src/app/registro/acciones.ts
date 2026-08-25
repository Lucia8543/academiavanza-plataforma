'use server';

import { registrarProfesor } from '@/backend/services/registro-profesor';
import { esquemaRegistroProfesor } from '@/shared/schemas/profesor';

/**
 * Recibe el formulario de alta.
 *
 * Es una capa fina a propósito: valida lo que llega y se lo pasa al servicio.
 * La regla de negocio no vive aquí (ADR 0002).
 */

export type EstadoFormulario = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  /**
   * Lo que la persona había escrito.
   *
   * Se devuelve para poder repintarlo si algo falla. Sin esto, React vacía el
   * formulario al terminar la acción y quien rellena pierde cinco minutos de
   * trabajo por una casilla mal puesta.
   */
  valores?: Record<string, string | string[]>;
};

export async function enviarRegistro(
  _estadoPrevio: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  // Un campo oculto no se envía, y el formulario esconde «colegioOtro» cuando
  // se elige colegio de la lista, y «zona» cuando la modalidad es sólo online.
  // En esos casos llega `null`, que no es lo mismo que una cadena vacía: hay
  // que traducirlo o la validación lo rechaza por «entrada no válida».
  const cadena = (campo: string) => String(formulario.get(campo) ?? '');

  // El desplegable de colegios tiene una opción «otro» que no es un colegio
  // real, sino la señal de que viene escrito a mano en el campo de al lado.
  const colegioElegido = cadena('colegioId');
  const colegioEsOtro = colegioElegido === 'otro';

  const datos = {
    nombre: cadena('nombre'),
    apellidos: cadena('apellidos'),
    email: cadena('email'),
    colegioId: colegioEsOtro ? '' : colegioElegido,
    colegioOtro: cadena('colegioOtro'),
    titulacion: cadena('titulacion'),
    universidad: cadena('universidad'),
    cursoActual: cadena('cursoActual') || undefined,
    titulacionFinalizada: formulario.get('titulacionFinalizada') === 'on',
    asignaturas: formulario.getAll('asignaturas').map(String),
    niveles: formulario.getAll('niveles').map(String),
    certificaciones: formulario.getAll('certificaciones').map(String),
    modalidad: cadena('modalidad') || 'online',
    zona: cadena('zona'),
    disponibilidad: formulario.getAll('disponibilidad').map(String),
    puntosFuertes: cadena('puntosFuertes'),
    aceptaPublicacion: formulario.get('aceptaPublicacion') === 'on',
  };

  // Lo enviado, tal cual, para poder repintarlo si hay que volver atrás.
  const valores: Record<string, string | string[]> = {
    nombre: String(datos.nombre ?? ''),
    apellidos: String(datos.apellidos ?? ''),
    email: String(datos.email ?? ''),
    colegioId: String(datos.colegioId ?? ''),
    colegioOtro: String(datos.colegioOtro ?? ''),
    titulacion: String(datos.titulacion ?? ''),
    universidad: String(datos.universidad ?? ''),
    cursoActual: String(datos.cursoActual ?? ''),
    titulacionFinalizada: datos.titulacionFinalizada ? 'on' : '',
    modalidad: String(datos.modalidad ?? 'online'),
    zona: String(datos.zona ?? ''),
    puntosFuertes: String(datos.puntosFuertes ?? ''),
    aceptaPublicacion: datos.aceptaPublicacion ? 'on' : '',
    asignaturas: datos.asignaturas,
    niveles: datos.niveles,
    certificaciones: datos.certificaciones,
    disponibilidad: datos.disponibilidad,
  };

  const validado = esquemaRegistroProfesor.safeParse(datos);

  if (!validado.success) {
    const errores: Record<string, string> = {};
    for (const problema of validado.error.issues) {
      const campo = String(problema.path[0] ?? 'general');
      // Se conserva sólo el primer error de cada campo: mostrar tres mensajes
      // sobre el mismo hueco no ayuda a nadie.
      errores[campo] ??= problema.message;
    }
    return {
      ok: false,
      mensaje: 'Revisa los campos marcados. El resto se conserva.',
      errores,
      valores,
    };
  }

  const resultado = await registrarProfesor(validado.data);

  if (!resultado.ok) {
    if (resultado.motivo === 'correo-repetido') {
      return {
        ok: false,
        mensaje:
          'Ya hay una ficha con ese correo. Si es tuya y quieres cambiarla, ' +
          'escríbenos a info@academiavanza.es.',
        errores: { email: 'Este correo ya está registrado' },
        valores,
      };
    }
    return {
      ok: false,
      mensaje:
        'Algo ha fallado por nuestra parte. Inténtalo de nuevo en un rato.',
      valores,
    };
  }

  return {
    ok: true,
    mensaje:
      'Ficha recibida. La revisamos y te avisamos por correo cuando esté publicada.',
  };
}
