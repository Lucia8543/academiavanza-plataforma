import { db } from '@/backend/repositories/cliente';
import {
  interpretarFranja,
  type RegistroProfesor,
} from '@/shared/schemas/profesor';
import { slugDeProfesor } from '@/shared/utils/slug';

/**
 * Alta de un profesor.
 *
 * Aquí vive la regla de negocio, no en la pantalla ni en la ruta. Lo que hace:
 *
 *   1. Comprueba que ese correo no esté ya dado de alta.
 *   2. Crea la ficha en estado `pendiente` — no se publica hasta que
 *      administración la lee y la aprueba.
 *   3. Guarda su oferta y su disponibilidad.
 *
 * Todo en una transacción: si algo falla a mitad, no queda una ficha suelta
 * sin asignaturas.
 */

/** Versión del texto de privacidad que el profesor acepta al registrarse. */
export const VERSION_PRIVACIDAD = '2026-08-v1';

export type ResultadoRegistro =
  | { ok: true; slug: string }
  | { ok: false; motivo: 'correo-repetido' | 'error' };

export async function registrarProfesor(
  datos: RegistroProfesor,
): Promise<ResultadoRegistro> {
  const yaExiste = await db.profesores.findUnique({
    where: { email: datos.email },
    select: { id: true },
  });

  if (yaExiste) {
    return { ok: false, motivo: 'correo-repetido' };
  }

  const slug = slugDeProfesor(datos.nombre, datos.apellidos);

  // Las casillas de la rejilla llegan como '2-tarde'. Las que no se entiendan
  // se descartan en silencio: no vale la pena tirar un alta entera por eso.
  const franjas = datos.disponibilidad
    .map(interpretarFranja)
    .filter((f): f is NonNullable<typeof f> => f !== null);

  try {
    await db.$transaction(async (tx) => {
      const profesor = await tx.profesores.create({
        data: {
          slug,
          nombre: datos.nombre,
          apellidos: datos.apellidos,
          email: datos.email,

          colegio_id: datos.colegioId || null,
          colegio_otro: datos.colegioId ? null : datos.colegioOtro || null,

          titulacion: datos.titulacion,
          universidad: datos.universidad,
          curso_actual: datos.titulacionFinalizada
            ? null
            : (datos.cursoActual ?? null),
          titulacion_finalizada: datos.titulacionFinalizada,

          puntos_fuertes: datos.puntosFuertes,
          modalidad: datos.modalidad,
          zona_otra: datos.modalidad === 'online' ? null : datos.zona || null,

          // Nace pendiente. Publicar es una decisión de administración.
          estado: 'pendiente',

          acepta_publicacion: true,
          acepta_publicacion_en: new Date(),
          version_privacidad: VERSION_PRIVACIDAD,
        },
        select: { id: true, slug: true },
      });

      await tx.profesor_asignaturas.createMany({
        data: datos.asignaturas.map((asignatura_id) => ({
          profesor_id: profesor.id,
          asignatura_id,
        })),
      });

      await tx.profesor_niveles.createMany({
        data: datos.niveles.map((nivel_id) => ({
          profesor_id: profesor.id,
          nivel_id,
        })),
      });

      if (datos.certificaciones.length > 0) {
        await tx.profesor_certificaciones.createMany({
          data: datos.certificaciones.map((certificacion_id) => ({
            profesor_id: profesor.id,
            certificacion_id,
          })),
        });
      }

      if (franjas.length > 0) {
        await tx.profesor_disponibilidad.createMany({
          data: franjas.map((f) => ({
            profesor_id: profesor.id,
            dia_semana: f.dia,
            hora_inicio: new Date(`1970-01-01T${f.inicio}:00Z`),
            hora_fin: new Date(`1970-01-01T${f.fin}:00Z`),
          })),
          skipDuplicates: true,
        });
      }
    });

    return { ok: true, slug };
  } catch (error) {
    console.error('[registro-profesor] fallo al dar de alta:', error);
    return { ok: false, motivo: 'error' };
  }
}
