'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/backend/repositories/cliente';
import { tokenDelPanel } from '@/backend/services/acceso-profesor';
import { enviar } from '@/backend/services/correo';
import {
  correoFichaPublicada,
  correoFichaRechazada,
} from '@/backend/services/plantillas-correo';
import {
  abrirSesion,
  cerrarSesion,
  claveCorrecta,
  haySesion,
} from '@/backend/services/sesion-admin';

/**
 * Acciones del panel de administración.
 *
 * Todas comprueban la sesión antes de tocar nada. No basta con esconder los
 * botones: si alguien descubriera la dirección de una acción, tiene que
 * encontrarse con una puerta cerrada y no con una ficha publicándose.
 */

async function exigirSesion() {
  if (!(await haySesion())) {
    throw new Error('Sin sesión');
  }
}

export async function entrar(
  _previo: { error?: string },
  formulario: FormData,
): Promise<{ error?: string }> {
  const clave = String(formulario.get('clave') ?? '');

  // La espera tras un fallo la aplica el propio servicio, y crece con los
  // intentos fallidos seguidos.
  if (!(await claveCorrecta(clave))) {
    return { error: 'Contraseña incorrecta' };
  }

  await abrirSesion();
  redirect('/admin');
}

export async function salir() {
  await cerrarSesion();
  redirect('/admin/entrar');
}

/**
 * Convierte un colegio escrito a mano en un colegio del catálogo.
 *
 * Es la promesa que el formulario de alta le hace al profesor —«lo añadiremos
 * al catálogo al revisar tu ficha»— y que hasta ahora no cumplía nadie:
 * aprobar no creaba el colegio, así que la ficha se publicaba sin badge. Una
 * ficha sin badge no se puede filtrar por colegio y no cuenta lo único que
 * distingue a esta plataforma de las demás.
 *
 * Se da de alta **activo**, que es lo que hace que aparezca en los filtros del
 * directorio. Darlo de alta desactivado dejaría a la ficha con badge pero fuera
 * del filtro por colegio, o sea a medio arreglar, y sin ninguna pantalla desde
 * la que activarlo después: haría falta un cliente SQL, que es justo el tipo de
 * cosa que este proyecto no puede permitirse. La revisión la hace quien pulsa
 * el botón, que ya está mirando la ficha.
 *
 * Si el colegio ya existe en el catálogo con ese mismo nombre, se reutiliza en
 * vez de crear un duplicado. Dos profesores del mismo colegio escribiéndolo a
 * mano son dos fichas, no dos colegios.
 */
export async function darDeAltaColegio(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  const profesor = await db.profesores.findUniqueOrThrow({
    where: { id },
    select: { colegio_id: true, colegio_otro: true },
  });

  // Si ya tiene colegio de catálogo no hay nada que hacer. Puede pasar con dos
  // pestañas abiertas.
  if (profesor.colegio_id || !profesor.colegio_otro) return;

  const colegioId = await colegioDelCatalogo(profesor.colegio_otro.trim());

  await db.profesores.update({
    where: { id },
    data: { colegio_id: colegioId, colegio_otro: null },
  });

  revalidatePath('/admin');
  revalidatePath('/profesores');
}

/**
 * El colegio que ya existe con ese nombre, o uno nuevo.
 *
 * Se compara por el slug y no letra a letra, así que «Colegio San Patricio» y
 * «colegio san patricio» son el mismo. No pretende cazar todas las variantes
 * —«CEIP San Patricio» seguirá siendo otro— pero evita el duplicado evidente
 * sin inventarse parecidos.
 */
async function colegioDelCatalogo(nombre: string): Promise<string> {
  const slug =
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'colegio';

  const existente = await db.colegios.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existente) return existente.id;

  // El municipio no se rellena: nadie lo ha declarado. Un dato inventado en el
  // catálogo es peor que un hueco, porque luego se filtra por él.
  const creado = await db.colegios.create({
    data: { slug, nombre, activo: true },
    select: { id: true },
  });

  return creado.id;
}

export async function aprobar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  const antes = await db.profesores.findUniqueOrThrow({
    where: { id },
    select: {
      estado: true,
      colegio_id: true,
      colegio_otro: true,
      telefono: true,
    },
  });

  /*
   * Sólo se publica lo que está esperando a que alguien lo lea.
   *
   * Sin esta comprobación se podía volver a publicar una ficha ya activa o una
   * ya rechazada, y de paso se reiniciaba el reloj del recordatorio trimestral
   * de alguien que llevaba meses sin confirmar nada.
   */
  if (antes.estado !== 'pendiente') return;

  /*
   * Y no se publica una ficha sin colegio resuelto.
   *
   * El badge del colegio es el producto. Una ficha con el colegio escrito a
   * mano se publicaba sin colegio ninguno: ni el texto, ni un hueco, ni un
   * aviso. Hay que darlo de alta en el catálogo antes, con el botón de la
   * propia tarjeta.
   */
  if (!antes.colegio_id) return;

  // El teléfono ya lo exige `prof_activo_exige_telefono` en la base de datos.
  // Comprobarlo aquí convierte un error 500 en no hacer nada, que es lo que la
  // tarjeta ya está contando con el aviso ámbar.
  if (!antes.telefono) return;

  const profesor = await db.profesores.update({
    where: { id },
    data: {
      estado: 'activo',
      aprobado_en: new Date(),
      motivo_rechazo: null,
      // Publicar cuenta como confirmar que está disponible: el reloj del
      // recordatorio trimestral empieza a contar aquí.
      disponibilidad_confirmada_en: new Date(),
    },
    select: { id: true, nombre: true, email: true, slug: true },
  });

  // Y ahora se lo decimos. Sin esto, quien se dio de alta esperó dos días y no
  // se enteró nunca de que su ficha había salido.
  await enviar(
    correoFichaPublicada({
      para: profesor.email,
      nombreProfesor: profesor.nombre,
      slug: profesor.slug,
      tokenPanel: await tokenDelPanel(profesor.id),
    }),
  );

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/profesores');
}

export async function rechazar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));
  const motivo =
    String(formulario.get('motivo') ?? '').trim() ||
    'La ficha no cumple los requisitos';

  const profesor = await db.profesores.update({
    where: { id },
    data: { estado: 'rechazado', motivo_rechazo: motivo },
    select: { nombre: true, email: true },
  });

  // Decirle por qué, y en sus palabras, no en las nuestras. Un rechazo mudo
  // deja a alguien esperando indefinidamente algo que no va a llegar.
  await enviar(
    correoFichaRechazada({
      para: profesor.email,
      nombreProfesor: profesor.nombre,
      motivo,
      tokenPanel: await tokenDelPanel(id),
    }),
  );

  revalidatePath('/admin');
}

/** Retira del directorio una ficha ya publicada, sin borrarla. */
export async function retirar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  /*
   * Retirar es pausar, no devolver a la cola.
   *
   * Antes dejaba la ficha en `pendiente`, así que volvía a la lista de «por
   * revisar» y, al aprobarla de nuevo, se le mandaba otra vez el correo de «tu
   * ficha está publicada» a alguien que ya lo había recibido.
   *
   * Con `disponible = false` desaparece del directorio igual, pero sigue
   * aprobada: reactivarla es un botón y no genera ningún correo. Es además lo
   * mismo que hace el profesor cuando se pausa a sí mismo, así que hay un solo
   * mecanismo y no dos.
   */
  await db.profesores.update({
    where: { id },
    data: { disponible: false },
  });

  revalidatePath('/admin');
  revalidatePath('/');
}

/**
 * Borra una ficha para siempre, con todo lo que cuelga de ella.
 * Se usa sobre todo para limpiar pruebas.
 */
export async function borrar(formulario: FormData) {
  await exigirSesion();
  const id = String(formulario.get('id'));

  /*
   * Una ficha con contactos cobrados no se borra: se retira.
   *
   * Borrarla se lleva por delante sus solicitudes, y con ellas la página de
   * seguimiento de una familia que pagó y el único registro de que ese dinero
   * entró. Nadie va a acordarse de eso a las once de la noche revisando
   * fichas, así que lo impide el código y no la memoria.
   *
   * Retirar hace lo que se buscaba —desaparece del directorio— y no destruye
   * nada.
   */
  const cobrados = await db.contactos.count({
    where: { profesor_id: id, estado: { in: ['pagada', 'devuelta'] } },
  });

  if (cobrados > 0) {
    await db.profesores.update({
      where: { id },
      data: { estado: 'inactivo', disponible: false },
    });
  } else {
    await db.profesores.delete({ where: { id } });
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/profesores');
}
