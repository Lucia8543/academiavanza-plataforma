import { randomBytes } from 'node:crypto';
import { db } from '@/backend/repositories/cliente';
import { URGENCIA_POR_DEFECTO } from '@/shared/reglas/cobro';
import type { DatosContacto } from '@/shared/schemas/contacto';

/**
 * Utilidades para montar situaciones de prueba.
 *
 * Todo lo que hay aquí crea datos inventados. Ninguna función acepta datos
 * reales ni los lee de ningún sitio: los teléfonos son 6000000xx y los correos
 * acaban en `.invalid`, que es un dominio que por norma no puede existir.
 */

let contador = 0;
const unico = () => `${Date.now()}-${(contador += 1)}`;

/** Deja las tablas de trabajo vacías. Se llama antes de cada prueba. */
export async function limpiar(): Promise<void> {
  // El orden importa: los contactos cuelgan de los profesores.
  await db.contactos.deleteMany({});
  await db.accesos.deleteMany({});
  await db.suscripciones_push.deleteMany({});
  await db.profesor_asignaturas.deleteMany({});
  await db.profesor_niveles.deleteMany({});
  await db.profesor_certificaciones.deleteMany({});
  await db.profesor_disponibilidad.deleteMany({});
  await db.profesores.deleteMany({});
  await db.tarifas.deleteMany({});
  await db.mantenimiento_ejecuciones.deleteMany({});
}

/**
 * El precio del contacto. Sin esto, `precioVigente()` revienta a propósito.
 *
 * **`vigente_desde` se pone a mano, y ésa es la parte que importa.** Dejándolo
 * al `DEFAULT now()` de PostgreSQL, la tarifa nacía con un sello de tiempo de
 * precisión de microsegundos; cerrarla un instante después con un `new Date()`
 * de JavaScript, que sólo llega al milisegundo, producía un valor **anterior**
 * si las dos cosas caían en el mismo milisegundo. Y entonces saltaba
 * `tarifa_vigencia_valida`, que exige `vigente_hasta > vigente_desde`.
 *
 * Era una carrera que ganaba o perdía según lo rápido que fuera la máquina, así
 * que fallaba una prueba de cada tantas y nunca la misma. Naciendo un minuto
 * atrás no hay carrera que perder, y además la situación es más realista: en
 * producción nadie cierra una tarifa en el mismo milisegundo en que la abre.
 */
export async function ponerTarifa(importe = 10): Promise<void> {
  await db.tarifas.updateMany({
    where: { concepto: 'match', vigente_hasta: null },
    data: { vigente_hasta: new Date() },
  });
  await db.tarifas.create({
    data: {
      concepto: 'match',
      importe,
      moneda: 'EUR',
      motivo: 'Pruebas',
      vigente_desde: new Date(Date.now() - 60_000),
    },
  });
}

/** Cierra la tarifa vigente sin abrir otra. Es el escenario del fallo. */
export async function quitarTarifaVigente(): Promise<void> {
  await db.tarifas.updateMany({
    where: { concepto: 'match', vigente_hasta: null },
    data: { vigente_hasta: new Date() },
  });
}

/**
 * Un profesor publicado y listo para recibir solicitudes.
 *
 * Lleva más campos de los que parecen necesarios, y no es por adorno: la tabla
 * tiene ocho restricciones y tres de ellas se cumplen aquí. Una ficha activa
 * exige teléfono y consentimiento, y toda ficha exige colegio —del catálogo o
 * escrito a mano—. Son las mismas reglas que impiden publicar una ficha a
 * medias desde el panel.
 */
export async function crearProfesor(
  opciones: { disponible?: boolean; estado?: 'activo' | 'pendiente' } = {},
) {
  const id = unico();
  return db.profesores.create({
    data: {
      slug: `profe-${id}`,
      nombre: 'Profesora',
      apellidos: `DePrueba ${id}`,
      email: `profe-${id}@ejemplo.invalid`,
      telefono: '600000001',
      colegio_otro: 'Colegio de prueba',
      acepta_publicacion: true,
      acepta_publicacion_en: new Date(),
      estado: opciones.estado ?? 'activo',
      disponible: opciones.disponible ?? true,
    },
    select: { id: true, slug: true, email: true, nombre: true },
  });
}

/** Un nivel del catálogo, o uno nuevo si la tabla está vacía. */
export async function unNivel(): Promise<string> {
  const existente = await db.niveles.findFirst({ select: { id: true } });
  if (existente) return existente.id;

  const creado = await db.niveles.create({
    data: {
      slug: `nivel-${unico()}`,
      nombre: '2º ESO',
      etapa: 'eso',
      orden_visual: 1,
    },
    select: { id: true },
  });
  return creado.id;
}

/**
 * Los datos que rellenaría una familia.
 *
 * Sin nada del alumno salvo el curso, que es exactamente lo que pide el
 * formulario de verdad. El teléfono es 600000099 y el correo acaba en
 * `.invalid`, un dominio que por norma no puede existir.
 */
export function datosDeFamilia(
  overrides: Partial<DatosContacto> = {},
): DatosContacto {
  return {
    nombreFamilia: 'Familia de prueba',
    telefono: '600000099',
    email: `familia-${unico()}@ejemplo.invalid`,
    nivelId: '',
    // Obligatorio en el tipo aunque el esquema le ponga valor por defecto: en
    // Zod, `.default()` sale del parseo siempre relleno.
    urgencia: URGENCIA_POR_DEFECTO,
    mensaje: '',
    esTutorLegal: true,
    aceptaPrivacidad: true,
    vale: '',
    ...overrides,
  };
}

/** Lee una solicitud entera por su código. Para comprobar el estado real. */
export async function porCodigo(codigo: string) {
  return db.contactos.findUniqueOrThrow({ where: { codigo } });
}

/** Envejece una fecha de una solicitud, para probar lo que depende del tiempo. */
export async function envejecer(
  codigo: string,
  campos: Partial<Record<
    | 'enviado_en'
    | 'aceptada_en'
    | 'pagada_en'
    | 'recordatorio_pago_en'
    | 'pago_avisado_en'
    | 'vale_caduca_en',
    number
  >>,
): Promise<void> {
  const data: Record<string, Date> = {};
  for (const [campo, dias] of Object.entries(campos)) {
    data[campo] = new Date(Date.now() - (dias as number) * 24 * 60 * 60 * 1000);
  }
  await db.contactos.update({ where: { codigo }, data });
}

/** Un token largo, del mismo estilo que los de verdad. */
export const tokenFalso = () => randomBytes(32).toString('base64url');
