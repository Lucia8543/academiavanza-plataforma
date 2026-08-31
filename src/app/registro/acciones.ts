'use server';

import { registrarProfesor } from '@/backend/services/registro-profesor';
import { esquemaRegistroProfesor } from '@/shared/schemas/profesor';
import { oler } from '@/shared/schemas/trampa-bots';

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
  /** Permite activar los avisos al móvil nada más terminar el alta. */
  tokenAvisos?: string;
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
  // Guiones automáticos, antes de tocar la base de datos.
  //
  // Se contesta que todo ha ido bien. Decirle a un guion «te he pillado» es
  // decirle exactamente qué tiene que cambiar para colarse a la siguiente; que
  // se crea que ha funcionado hace que se vaya tan tranquilo.
  const sospecha = oler(formulario);
  if (sospecha) {
    console.warn(`[registro] alta descartada por ${sospecha}`);
    return { ok: true, mensaje: 'Ficha recibida.' };
  }

  const cadena = (campo: string) => String(formulario.get(campo) ?? '');

  // El desplegable de colegios tiene una opción «otro» que no es un colegio
  // real, sino la señal de que viene escrito a mano en el campo de al lado.
  const colegioElegido = cadena('colegioId');
  const colegioEsOtro = colegioElegido === 'otro';

  const datos = {
    nombre: cadena('nombre'),
    apellidos: cadena('apellidos'),
    email: cadena('email'),
    telefono: cadena('telefono'),
    colegioId: colegioEsOtro ? '' : colegioElegido,
    colegioOtro: cadena('colegioOtro'),
    titulacion: cadena('titulacion'),
    universidad: cadena('universidad'),
    cursoActual: cadena('cursoActual') || undefined,
    anosExperiencia: cadena('anosExperiencia') || undefined,
    titulacionFinalizada: formulario.get('titulacionFinalizada') === 'on',
    asignaturas: formulario.getAll('asignaturas').map(String),
    niveles: formulario.getAll('niveles').map(String),
    certificaciones: formulario.getAll('certificaciones').map(String),
    modalidad: cadena('modalidad') || 'online',
    // Cuánto hueco le queda. Se leía en el formulario y se guardaba en la base
    // de datos, pero **este paso de en medio se olvidó de copiarlo**, así que
    // llegaba vacío y el valor por defecto lo convertía en «busco alumnos».
    // Quien decía que estaba lleno acababa publicado como disponible.
    cupo: cadena('cupo') || 'busca',
    zona: cadena('zona'),
    desplazamientoFlexible:
      formulario.get('desplazamientoFlexible') === 'on',
    disponibilidad: formulario.getAll('disponibilidad').map(String),
    puntosFuertes: cadena('puntosFuertes'),
    declaraEdadMinima: formulario.get('declaraEdadMinima') === 'on',
    aceptaPublicacion: formulario.get('aceptaPublicacion') === 'on',
  };

  // Lo enviado, tal cual, para poder repintarlo si hay que volver atrás.
  const valores: Record<string, string | string[]> = {
    nombre: String(datos.nombre ?? ''),
    apellidos: String(datos.apellidos ?? ''),
    email: String(datos.email ?? ''),
    telefono: String(datos.telefono ?? ''),
    colegioId: String(datos.colegioId ?? ''),
    cupo: String(datos.cupo ?? 'busca'),
    colegioOtro: String(datos.colegioOtro ?? ''),
    titulacion: String(datos.titulacion ?? ''),
    universidad: String(datos.universidad ?? ''),
    cursoActual: String(datos.cursoActual ?? ''),
    anosExperiencia: String(datos.anosExperiencia ?? ''),
    titulacionFinalizada: datos.titulacionFinalizada ? 'on' : '',
    modalidad: String(datos.modalidad ?? 'online'),
    zona: String(datos.zona ?? ''),
    desplazamientoFlexible: datos.desplazamientoFlexible ? 'on' : '',
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
    if (resultado.motivo === 'demasiadas') {
      return { ok: false, mensaje: resultado.explicacion, valores };
    }

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
    // Sirve para activar los avisos al móvil ahí mismo, sin salir de la
    // pantalla. Es el mejor momento: acaba de dedicarnos cinco minutos y
    // entiende para qué es. Preguntárselo tres semanas después, por correo, es
    // preguntárselo a alguien que ya no se acuerda de nosotros.
    tokenAvisos: resultado.tokenAvisos,
  };
}
