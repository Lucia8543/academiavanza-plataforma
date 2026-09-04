'use server';

import { redirect } from 'next/navigation';
import { crearSolicitud } from '@/backend/services/solicitud';
import { esquemaContacto } from '@/shared/schemas/contacto';
import { etiquetaDeSospecha } from '@/shared/schemas/trampa-bots';

/**
 * Recibe el formulario con el que una familia escribe a un profesor.
 *
 * Si todo va bien no devuelve nada: lleva a la familia a su página privada de
 * seguimiento. Esa página es su única referencia a partir de aquí, así que
 * conviene que la vea cuanto antes y no dentro de un mensaje de confirmación
 * que se cierra.
 */

export type EstadoContacto = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  // Casi todo son cadenas, pero los días preferidos son varias casillas y
  // viajan como lista. Mismo criterio que en el alta del profesor.
  valores?: Record<string, string | string[]>;
};

export async function enviarContacto(
  _previo: EstadoContacto,
  formulario: FormData,
): Promise<EstadoContacto> {
  /*
   * Si el envío tiene pinta de automático. **La solicitud se tramita igual.**
   *
   * Aquí antes había un `redirect` al directorio que tiraba la solicitud sin
   * guardar nada, y a la familia la dejaba en una página que no era la suya
   * pensando que algo había ido mal. Una familia perdida por una sospecha
   * nuestra es un hijo sin profesor y una persona que no vuelve.
   *
   * Y hay una diferencia importante con el alta del profesor: aquí no hay
   * nadie revisando antes de que las cosas pasen. La solicitud sigue su curso
   * normal, le llega al profesor y se cobra si él acepta. La etiqueta sólo
   * queda guardada por si más adelante hay que entender de dónde salió algo
   * raro.
   */
  const sospecha = etiquetaDeSospecha(formulario);
  if (sospecha) {
    console.warn(`[contacto] solicitud marcada como sospechosa por ${sospecha}`);
  }

  const cadena = (campo: string) => String(formulario.get(campo) ?? '');
  const slug = cadena('slug');

  /*
   * Los alumnos, todos, tal y como llegan: dos listas paralelas.
   *
   * El formulario pinta un bloque por alumno con un curso y unas horas dentro, y
   * los tres bloques mandan los mismos dos nombres. Se emparejan por posición,
   * que es la forma que tiene un formulario HTML de mandar una lista de objetos
   * y funciona porque los dos `select` se pintan siempre juntos: no puede haber
   * tres cursos y dos horarios.
   */
  const cursosDeLosAlumnos = formulario.getAll('alumnoNivel').map(String);
  const horasDeLosAlumnos = formulario.getAll('alumnoHoras').map(String);

  const enviado = {
    nombreFamilia: cadena('nombreFamilia'),
    telefono: cadena('telefono'),
    email: cadena('email'),
    /*
     * El curso y las horas del primer alumno.
     *
     * El formulario manda **todos** los alumnos con el mismo par de nombres, y
     * aquí se separa el primero de los demás. La asimetría no es de la pantalla,
     * es del modelo: `nivelId` y `horasSemana` existían antes de que hubiera
     * hermanos y siguen leyéndolos el panel de cobros, los correos y el
     * histórico. Está explicada entera en el ADR 0011.
     */
    nivelId: String(cursosDeLosAlumnos[0] ?? ''),
    /*
     * Dónde vive la familia, y sólo se pregunta si el profesor se desplaza.
     *
     * Estas dos líneas faltaban, y es exactamente el mismo fallo silencioso
     * que se documenta en `tests/unit/el-alta-no-pierde-campos.test.ts`: el
     * navegador enviaba la zona, aquí no se copiaba, el esquema la tiene con
     * valor por defecto vacío y el servicio guardaba NULL. Ni error, ni aviso,
     * ni nada rojo en ninguna pantalla.
     *
     * Lo que se veía por fuera era un profesor recibiendo propuestas sin saber
     * dónde vive nadie, y pidiendo el teléfono antes de aceptar para poder
     * preguntarlo. O sea, saltándose lo único que cobra la plataforma, y por
     * un motivo razonable.
     */
    zona: cadena('zona'),
    barrio: cadena('barrio'),
    /*
     * Cuántas horas y qué días. Lo que el profesor necesita para decidir.
     *
     * Van aquí, y no sólo en el formulario, porque este fichero es donde se
     * han perdido en silencio los tres campos anteriores: el cupo, la zona y
     * la urgencia. El patrón siempre es el mismo, y por eso conviene decirlo
     * en voz alta: el navegador envía el campo, esta función no lo copia, el
     * esquema tiene valor por defecto y el servicio guarda un vacío
     * perfectamente válido. No hay excepción, ni aviso, ni línea en el
     * registro. Sólo un profesor que no entiende por qué le falta un dato.
     *
     * `getAll` y no `get` para los días: son casillas y llegan repetidas.
     */
    horasSemana: horasDeLosAlumnos[0] ?? '',
    diasPreferidos: formulario.getAll('diasPreferidos').map(String),
    /*
     * Y los hermanos, que son del segundo en adelante.
     *
     * Las horas se completan con cadena vacía si faltan. Si alguna vez las dos
     * listas dejaran de tener el mismo largo, el resultado sería un hermano sin
     * horas —que es un dato opcional y se nota— y no un desplazamiento que le
     * asigna a uno las horas del otro, que es el fallo callado y caro.
     */
    hermanos: cursosDeLosAlumnos.slice(1).map((nivelId, i) => ({
      nivelId,
      horasSemana: horasDeLosAlumnos[i + 1] ?? '',
    })),
    // Si la familia acepta que el profesor coja sólo a alguno. El esquema lo
    // apaga cuando no hay hermanos, así que aquí basta con copiarlo tal cual.
    valeConUno: cadena('valeConUno') === 'si',
    // Para cuándo lo necesita. Sin esta línea el formulario pintaba las tres
    // opciones, el navegador las enviaba y aquí se tiraban: como el esquema
    // tiene valor por defecto, todo el mundo acababa con cinco días y nadie se
    // enteraba. Un fallo sin excepción y sin rastro en el registro.
    // `|| undefined` y no la cadena vacía: el esquema es un enum con valor por
    // defecto, y '' no es uno de los tres valores válidos. Sin esto, un envío
    // sin JavaScript fallaría la validación en vez de coger el plazo corto.
    urgencia: cadena('urgencia') || undefined,
    mensaje: cadena('mensaje'),
    esTutorLegal: formulario.get('esTutorLegal') === 'on',
    aceptaPrivacidad: formulario.get('aceptaPrivacidad') === 'on',
    vale: cadena('vale'),
  };

  // Lo escrito, para devolverlo si algo falla. Las casillas no se devuelven:
  // un consentimiento se marca cada vez, no se hereda de un intento anterior.
  const valores = {
    nombreFamilia: enviado.nombreFamilia,
    telefono: enviado.telefono,
    email: enviado.email,
    nivelId: enviado.nivelId,
    zona: enviado.zona,
    barrio: enviado.barrio,
    horasSemana: enviado.horasSemana,
    // Los días viajan como lista, igual que llegaron. El formulario los vuelve
    // a marcar uno a uno, y perder cinco casillas por un campo mal escrito más
    // arriba es de las cosas que hacen abandonar un formulario.
    diasPreferidos: enviado.diasPreferidos,
    /*
     * Los hermanos vuelven como dos listas paralelas y no como objetos.
     *
     * Lo que viaja de vuelta a la pantalla es una bolsa de cadenas y listas de
     * cadenas, que es lo que sabe rellenar un formulario. La pantalla los
     * vuelve a emparejar por posición, igual que se desemparejaron arriba.
     *
     * Y tienen que volver, porque quien ha rellenado tres cursos y tres
     * horarios y se equivoca en el teléfono no puede encontrarse el formulario
     * en blanco. Es la razón por la que existe todo este `valores`.
     */
    alumnoNivel: cursosDeLosAlumnos,
    alumnoHoras: horasDeLosAlumnos,
    valeConUno: enviado.valeConUno ? 'si' : 'no',
    mensaje: enviado.mensaje,
    vale: enviado.vale,
  };

  const validado = esquemaContacto.safeParse(enviado);

  if (!validado.success) {
    const errores: Record<string, string> = {};
    for (const problema of validado.error.issues) {
      const campo = String(problema.path[0] ?? 'general');
      errores[campo] ??= problema.message;
    }
    return { ok: false, mensaje: 'Revisa lo marcado.', errores, valores };
  }

  const resultado = await crearSolicitud(
    slug,
    validado.data,
    validado.data.vale || undefined,
    sospecha,
  );

  if (!resultado.ok) {
    const mensaje =
      resultado.motivo === 'demasiadas'
        ? resultado.explicacion
        : resultado.motivo === 'no-disponible'
          ? 'Este profesor ya no está disponible. Prueba con otro del directorio.'
          : resultado.motivo === 'vale-no-existe'
            ? 'No encontramos ese código de vale. Revísalo, y si no lo encuentras déjalo en blanco y escríbenos: no queremos cobrarte algo que ya tenías.'
            : resultado.motivo === 'vale-gastado'
              ? 'Ese vale ya se usó en otra solicitud. Déjalo en blanco para seguir, o escríbenos si crees que es un error.'
              : resultado.motivo === 'vale-caducado'
                ? 'Ese vale ya ha caducado. Déjalo en blanco para seguir, o escríbenos y lo miramos.'
                : resultado.motivo === 'sin-hueco'
                  ? // Pasa cuando la página se cargó antes de que él dijera
                    // que se había llenado. Se explica el motivo, porque «no
                    // está disponible» a secas, sobre una ficha que sí se ve,
                    // parece un fallo.
                    'Este profesor acaba de decirnos que ya no tiene hueco, así que no podemos pasarle tu mensaje. No se te ha cobrado nada. Prueba con otro del directorio.'
                  : resultado.motivo === 'sin-zona'
                    ? // No debería verse nunca: el desplegable es obligatorio.
                      // Si aparece, es que el campo se ha perdido por el camino
                      // otra vez, y es mejor decirlo que guardar la solicitud a
                      // medias y que el profesor decida a ciegas.
                      'Nos falta la zona donde vivís, y el profesor la necesita para saber si le viene bien desplazarse. Elígela en el desplegable y vuelve a enviarlo.'
                  : 'Algo ha fallado por nuestra parte. Inténtalo de nuevo en un rato.';

    return { ok: false, mensaje, valores };
  }

  // `redirect` interrumpe la función lanzando: nada de lo de abajo se ejecuta.
  redirect(`/solicitud/${resultado.token}`);
}
