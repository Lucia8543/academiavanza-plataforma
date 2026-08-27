import type { Correo } from '@/backend/services/correo';

/**
 * Los correos que manda la plataforma.
 *
 * Están todos aquí y no repartidos por los servicios porque son la cara de
 * AcademiAvanza. Un profesor que recibe una petición no ve la web: ve este
 * correo, y decide a partir de él si esto es serio o es un chaval mandando
 * enlaces. Tenerlos juntos permite leerlos seguidos y comprobar que suenan a la
 * misma persona.
 *
 * Reglas que se siguen en todos:
 *
 * - **Se dice qué es y por qué le llega**, en la primera frase. Un correo que
 *   empieza por «tienes una notificación» se borra.
 * - **Una sola cosa que hacer**, y un solo botón para hacerla.
 * - **Nada de urgencia falsa** ni de mayúsculas. Si algo caduca, se dice la
 *   fecha y ya.
 * - **Ni «verificado» ni «avalado»**. No hemos comprobado a nadie.
 * - **Texto plano además del HTML.** Los filtros de spam desconfían de lo que
 *   sólo viene con formato, y hay quien lee el correo en un reloj.
 */

const AZUL = '#1A365D';
const VERDE = '#2E7D5E';
const GRIS = '#5A6472';
const BORDE = '#E2E8F0';
/** El mismo `--color-carbon` de la web, escrito a mano: en un correo no hay CSS. */
const CARBON = '#1F2937';

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://academiavanza.es';
}

/**
 * El envoltorio común.
 *
 * Tablas y estilos escritos a mano dentro de cada etiqueta, que es feo pero es
 * lo que entienden los clientes de correo. Outlook no admite hojas de estilo ni
 * casi nada de lo que se usa en una web normal, y un correo roto en Outlook es
 * un profesor menos.
 */
function envoltorio(contenido: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A202C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7FAFC;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BORDE};border-radius:12px;">
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0;font-size:18px;font-weight:800;color:${AZUL};">Academi<span style="color:${VERDE};">Avanza</span></p>
        </td></tr>
        <tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;">
          ${contenido}
        </td></tr>
      </table>
      <p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.5;color:${GRIS};text-align:left;">
        AcademiAvanza pone en contacto a familias y profesores particulares en Madrid.
        No intervenimos en las clases, ni en el precio, ni en los horarios.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

function boton(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
    <td style="background:${VERDE};border-radius:8px;">
      <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">${texto}</a>
    </td>
  </tr></table>`;
}

function dato(etiqueta: string, valor: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:${GRIS};white-space:nowrap;vertical-align:top;">${etiqueta}</td>
    <td style="padding:6px 0;font-weight:600;">${escapar(valor)}</td>
  </tr>`;
}

/** Nadie escribe HTML en un formulario, pero no se confía en eso. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cita(texto: string): string {
  return `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid ${VERDE};background:#F7FAFC;font-style:italic;">${escapar(texto)}</blockquote>`;
}

// -----------------------------------------------------------------------------
// 1 · Una familia quiere clases contigo
// -----------------------------------------------------------------------------

export function correoSolicitud(datos: {
  para: string;
  nombreProfesor: string;
  nivel: string;
  mensaje: string | null;
  tokenProfesor: string;
  importe: number;
}): Correo {
  const enlace = `${baseUrl()}/aceptar/${datos.tokenProfesor}`;
  const precio = euros(datos.importe);

  const cuerpo = [
    `Hola ${datos.nombreProfesor}:`,
    '',
    'Una familia ha visto tu ficha en AcademiAvanza y quiere clases contigo.',
    'Antes de darte ningún dato suyo necesitamos saber si te viene bien.',
    '',
    `Curso: ${datos.nivel}`,
    ...(datos.mensaje ? ['', 'Lo que te cuenta:', datos.mensaje] : []),
    '',
    'Dinos si puedes cogerla:',
    enlace,
    '',
    `Si aceptas, la familia paga ${precio} por el contacto y os pasamos el`,
    'teléfono el uno del otro. A partir de ahí lo arregláis vosotros: el precio',
    'de las clases y los horarios no los tocamos.',
    '',
    'Si ahora no puedes, dilo y ya está. No pasa nada y la familia no paga nada.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreProfesor)}:</p>
    <p style="margin:0 0 16px;">Una familia ha visto tu ficha y <strong>quiere clases contigo</strong>. Antes de darte ningún dato suyo necesitamos saber si te viene bien.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;">
      ${dato('Curso', datos.nivel)}
    </table>
    ${datos.mensaje ? cita(datos.mensaje) : ''}
    ${boton('Ver y contestar', enlace)}
    <p style="margin:0 0 12px;color:${GRIS};font-size:14px;">
      Si aceptas, la familia paga <strong>${precio}</strong> por el contacto y os pasamos el teléfono el uno del otro.
      El precio de las clases y los horarios los acordáis vosotros.
    </p>
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Si ahora no puedes, dilo y ya está. La familia no paga nada.
    </p>
  `);

  return {
    para: datos.para,
    asunto: `Una familia quiere clases de ${datos.nivel} contigo`,
    cuerpo,
    html,
  };
}

// -----------------------------------------------------------------------------
// 2 · Ya puedes llamar a la familia
// -----------------------------------------------------------------------------

export function correoContactoAbierto(datos: {
  para: string;
  nombreProfesor: string;
  nombreFamilia: string;
  telefonoFamilia: string;
  nivel: string;
  mensaje: string | null;
}): Correo {
  const cuerpo = [
    `Hola ${datos.nombreProfesor}:`,
    '',
    `${datos.nombreFamilia} ha pagado el contacto. Aquí tienes su teléfono:`,
    '',
    `Nombre:   ${datos.nombreFamilia}`,
    `Teléfono: ${datos.telefonoFamilia}`,
    `Curso:    ${datos.nivel}`,
    ...(datos.mensaje ? ['', 'Lo que te contaba:', datos.mensaje] : []),
    '',
    'Llámala tú. Ella tiene también tu número, pero el primer paso se agradece',
    'desde tu lado.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const telefonoLimpio = datos.telefonoFamilia.replace(/\s/g, '');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreProfesor)}:</p>
    <p style="margin:0 0 16px;"><strong>${escapar(datos.nombreFamilia)}</strong> ha pagado el contacto. Ya podéis hablar.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;">
      ${dato('Nombre', datos.nombreFamilia)}
      ${dato('Curso', datos.nivel)}
    </table>
    ${boton(`Llamar al ${datos.telefonoFamilia}`, `tel:${telefonoLimpio}`)}
    ${datos.mensaje ? cita(datos.mensaje) : ''}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Llámala tú. Ella tiene también tu número, pero el primer paso se agradece desde tu lado.
    </p>
  `);

  return {
    para: datos.para,
    asunto: `Ya puedes llamar a ${datos.nombreFamilia}`,
    cuerpo,
    html,
  };
}

// -----------------------------------------------------------------------------
// 3 · Tu ficha está publicada
// -----------------------------------------------------------------------------

export function correoFichaPublicada(datos: {
  para: string;
  nombreProfesor: string;
  slug: string;
  tokenPanel: string;
}): Correo {
  const ficha = `${baseUrl()}/profesor/${datos.slug}`;
  const panel = `${baseUrl()}/mi-ficha/${datos.tokenPanel}`;

  const cuerpo = [
    `Hola ${datos.nombreProfesor}:`,
    '',
    'Tu ficha ya está publicada. Las familias pueden encontrarte buscando por',
    'colegio, asignatura y curso.',
    '',
    'Así te ven:',
    ficha,
    '',
    'Cuando una familia te quiera, te avisaremos por hasta tres vías:',
    '',
    '  1. Un aviso al móvil, al momento, si los has activado.',
    '  2. Un correo como este, SIEMPRE. Estate pendiente: es la vía que no',
    '     falla nunca. Añádenos a tus contactos para que no acabe en spam.',
    '  3. Un WhatsApp, sólo si las dos anteriores no te han llegado.',
    '',
    'Verás el curso y lo que te cuenta, y un enlace para decir si puedes',
    'cogerla. Tu teléfono no se lo damos a nadie hasta que aceptas y la familia',
    'paga el contacto.',
    '',
    'Desde aquí puedes cambiar lo que quieras, decir que vas justo de sitio o',
    'pausar la ficha del todo:',
    panel,
    '',
    'Si en algún momento te llenas, entra ahí y márcalo. Seguirás apareciendo,',
    'pero avisaremos a las familias de que ya tienes alumnos y de que puedes',
    'tardar más. Y cuando te quede hueco otra vez, lo cambias con un botón.',
    '',
    'Guarda este correo: ese segundo enlace es tu forma de entrar, y no hay',
    'contraseña que recordar.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreProfesor)}:</p>
    <p style="margin:0 0 16px;"><strong>Tu ficha ya está publicada.</strong> Las familias pueden encontrarte buscando por colegio, asignatura y curso.</p>
    ${boton('Ver cómo te ven', ficha)}
    <p style="margin:0 0 12px;">
      <strong>Cuando una familia te quiera, te avisaremos por hasta tres vías:</strong>
    </p>
    <ol style="margin:0 0 16px;padding-left:20px;">
      <li style="margin-bottom:8px;">Un <strong>aviso al móvil</strong>, al momento, si los has activado.</li>
      <li style="margin-bottom:8px;">
        Un <strong>correo como este, siempre</strong>. Estate pendiente:
        es la vía que no falla nunca. Añádenos a tus contactos para que no acabe en spam.
      </li>
      <li>Un <strong>WhatsApp</strong>, solo si las dos anteriores no te han llegado.</li>
    </ol>
    <p style="margin:0 0 16px;color:${GRIS};">
      Verás el curso y lo que te cuenta, y un enlace para decir si puedes cogerla.
      Tu teléfono no se lo damos a nadie hasta que aceptas y la familia paga el contacto.
    </p>
    <p style="margin:0 0 8px;">Desde aquí puedes cambiar lo que quieras, decir que vas justo de sitio o pausar la ficha del todo:</p>
    <p style="margin:0 0 16px;"><a href="${panel}" style="color:${VERDE};">Entrar en mi ficha</a></p>
    <p style="margin:0 0 16px;color:${GRIS};font-size:14px;">
      <strong>Si te llenas, entra y márcalo.</strong> Seguirás apareciendo, pero avisaremos a las familias
      de que ya tienes alumnos y de que puedes tardar más en contestar. Y cuando te quede hueco otra vez,
      lo cambias con un botón.
    </p>
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Guarda este correo: ese enlace es tu forma de entrar y no hay ninguna contraseña que recordar.
    </p>
  `);

  return {
    para: datos.para,
    asunto: 'Tu ficha de AcademiAvanza ya está publicada',
    cuerpo,
    html,
  };
}

// -----------------------------------------------------------------------------
// 4 · No hemos podido publicar tu ficha
// -----------------------------------------------------------------------------

export function correoFichaRechazada(datos: {
  para: string;
  nombreProfesor: string;
  motivo: string;
}): Correo {
  const cuerpo = [
    `Hola ${datos.nombreProfesor}:`,
    '',
    'Hemos revisado tu ficha y de momento no podemos publicarla:',
    '',
    datos.motivo,
    '',
    'Si crees que es un error o quieres corregirlo, contéstanos a este correo y',
    'lo miramos.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreProfesor)}:</p>
    <p style="margin:0 0 16px;">Hemos revisado tu ficha y de momento no podemos publicarla:</p>
    ${cita(datos.motivo)}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Si crees que es un error o quieres corregirlo, contesta a este correo y lo miramos.
    </p>
  `);

  return {
    para: datos.para,
    asunto: 'Sobre tu ficha de AcademiAvanza',
    cuerpo,
    html,
    responderA: 'info@academiavanza.es',
  };
}

// -----------------------------------------------------------------------------
// 5 · Hemos pausado tu ficha
// -----------------------------------------------------------------------------

/**
 * El correo más delicado de los cinco.
 *
 * Se manda cuando dos familias han dicho que no consiguieron hablar con él, y
 * su ficha se ha pausado sola. La tentación sería escribirlo como una
 * amonestación, y sería un error: la causa más probable no es que pase de
 * nadie, sino que cambió de número, está de exámenes o se olvidó de que se dio
 * de alta.
 *
 * Así que se cuenta lo que ha pasado, se dice qué hacer, y no se le acusa de
 * nada. Volver a activarse es un botón.
 */
export function correoFichaPausada(datos: {
  para: string;
  nombreProfesor: string;
  tokenPanel: string;
  familias: number;
}): Correo {
  const panel = `${baseUrl()}/mi-ficha/${datos.tokenPanel}`;

  const cuerpo = [
    `Hola ${datos.nombreProfesor}:`,
    '',
    `${datos.familias} familias nos han dicho que no consiguieron hablar`,
    'contigo después de que aceptaras darles clase. Hemos pausado tu ficha para',
    'que no siga llegándote gente mientras tanto.',
    '',
    'No pasa nada y no es un aviso: lo más normal es que hayas cambiado de',
    'número, estés de exámenes o se te pasara. Sólo queremos que ninguna familia',
    'pague por un contacto que no va a llegar a ninguna parte.',
    '',
    'Si sigues dando clase, revisa tu teléfono aquí y vuelve al directorio:',
    panel,
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreProfesor)}:</p>
    <p style="margin:0 0 16px;">
      ${datos.familias} familias nos han dicho que <strong>no consiguieron hablar contigo</strong>
      después de que aceptaras darles clase. Hemos pausado tu ficha para que no siga llegándote gente mientras tanto.
    </p>
    <p style="margin:0 0 16px;color:${GRIS};">
      No es un aviso ni un castigo: lo más normal es que hayas cambiado de número, estés de exámenes
      o se te pasara. Sólo queremos que ninguna familia pague por un contacto que no va a llegar a ninguna parte.
    </p>
    ${boton('Revisar mi ficha y volver', panel)}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Comprueba sobre todo que el teléfono que tenemos es el bueno.
    </p>
  `);

  return {
    para: datos.para,
    asunto: 'Hemos pausado tu ficha',
    cuerpo,
    html,
    responderA: 'info@academiavanza.es',
  };
}

// -----------------------------------------------------------------------------
// 6 · ¿Sigues disponible?
// -----------------------------------------------------------------------------

export function correoConfirmarDisponibilidad(datos: {
  para: string;
  nombreProfesor: string;
  tokenPanel: string;
  meses: number;
}): Correo {
  const panel = `${baseUrl()}/mi-ficha/${datos.tokenPanel}`;

  const cuerpo = [
    `Hola ${datos.nombreProfesor}:`,
    '',
    `Llevas ${datos.meses} meses en el directorio y queremos asegurarnos de que`,
    'sigues cogiendo alumnos. Es para que ninguna familia escriba a alguien que',
    'ya no da clase.',
    '',
    'Confírmalo aquí, es un botón:',
    panel,
    '',
    'Si no nos dices nada, dentro de dos semanas pausaremos tu ficha. No se',
    'borra: la puedes volver a activar cuando quieras con ese mismo enlace.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreProfesor)}:</p>
    <p style="margin:0 0 16px;">Llevas ${datos.meses} meses en el directorio y queremos asegurarnos de que <strong>sigues cogiendo alumnos</strong>. Es para que ninguna familia escriba a alguien que ya no da clase.</p>
    ${boton('Sigo disponible', panel)}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Si no nos dices nada, dentro de dos semanas pausaremos tu ficha. No se borra: la puedes volver a activar cuando quieras con ese mismo enlace.
    </p>
  `);

  return {
    para: datos.para,
    asunto: '¿Sigues dando clase?',
    cuerpo,
    html,
  };
}

// =============================================================================
// Correos a la familia
//
// Existen por un motivo muy concreto: sin ellos, la familia depende de acordarse
// de volver a una página que quizá no guardó. Y el momento en que hay que
// volver —cuando el profesor acepta— es justo el momento en que hay que pagar.
// Quien no se entera, no paga.
//
// En ninguno aparece el correo de la familia de cara al profesor, ni al revés:
// son avisos nuestros, y los teléfonos sólo circulan en el último.
// =============================================================================

/** 1 · Hemos recibido tu solicitud. Es su resguardo y su enlace. */
export function correoSolicitudRecibida(datos: {
  para: string;
  nombreFamilia: string;
  nombreProfesor: string;
  tokenFamilia: string;
  codigo: string;
}): Correo {
  const seguimiento = `${baseUrl()}/solicitud/${datos.tokenFamilia}`;

  const cuerpo = [
    `Hola ${datos.nombreFamilia}:`,
    '',
    `Le hemos preguntado a ${datos.nombreProfesor} si puede darte clase. Suele`,
    'contestar en un día o dos, y te avisaremos en cuanto lo haga.',
    '',
    'Todavía no has pagado nada, y no pagarás nada si dice que no.',
    '',
    'Puedes ver cómo va lo tuyo aquí:',
    seguimiento,
    '',
    'Guarda este correo. Ese enlace lleva a tu página, que es donde verás cómo',
    'va todo. No tiene contraseña: si lo pierdes, pierdes la entrada.',
    '',
    `Y si lo pierdes, tu código es ${datos.codigo}. Con él y tu teléfono vuelves`,
    'a entrar desde «He perdido mi enlace», abajo del todo en cualquier página.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreFamilia)}:</p>
    <p style="margin:0 0 16px;">
      Le hemos preguntado a <strong>${escapar(datos.nombreProfesor)}</strong> si puede darte clase.
      Suele contestar en un día o dos, y te avisaremos en cuanto lo haga.
    </p>
    <p style="margin:0 0 16px;color:${GRIS};">
      Todavía no has pagado nada, y no pagarás nada si dice que no.
    </p>
    ${boton('Ver cómo va', seguimiento)}
    <p style="margin:0 0 8px;color:${GRIS};font-size:14px;">
      <strong style="color:${CARBON};">Guarda este correo.</strong> Ese botón lleva a tu
      página, que es donde verás cómo va todo. No tiene contraseña: si pierdes el enlace,
      pierdes la entrada.
    </p>
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Y si lo pierdes, tu código es
      <strong style="font-family:monospace;letter-spacing:2px;color:${CARBON};">${escapar(datos.codigo)}</strong>.
      Con él y tu teléfono vuelves a entrar desde «He perdido mi enlace»,
      abajo del todo en cualquier página de la web.
    </p>
  `);

  return {
    para: datos.para,
    asunto: `Hemos escrito a ${datos.nombreProfesor}`,
    cuerpo,
    html,
  };
}

/** 2 · Ha aceptado. El correo que hace que se pague. */
export function correoProfesorAcepta(datos: {
  para: string;
  nombreFamilia: string;
  nombreProfesor: string;
  tokenFamilia: string;
  codigo: string;
  importe: number;
}): Correo {
  const seguimiento = `${baseUrl()}/solicitud/${datos.tokenFamilia}`;
  const precio = euros(datos.importe);

  const cuerpo = [
    `Hola ${datos.nombreFamilia}:`,
    '',
    `${datos.nombreProfesor} puede darte clase.`,
    '',
    `Para que os paséis el teléfono queda un paso: ${precio} por el contacto,`,
    `por Bizum, poniendo ${datos.codigo} en el concepto. Las instrucciones`,
    'están aquí:',
    seguimiento,
    '',
    'En cuanto lo confirmemos te mandamos su teléfono y él tendrá el tuyo.',
    'Lo que cueste la clase lo acordáis vosotros.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreFamilia)}:</p>
    <p style="margin:0 0 16px;font-size:17px;">
      <strong>${escapar(datos.nombreProfesor)} puede darte clase.</strong>
    </p>
    <p style="margin:0 0 16px;">
      Para que os paséis el teléfono queda un paso: <strong>${precio}</strong> por el contacto,
      por Bizum, poniendo este código en el concepto.
    </p>
    <p style="margin:0 0 8px;text-align:center;font-family:monospace;font-size:26px;font-weight:bold;letter-spacing:4px;color:${VERDE};">
      ${escapar(datos.codigo)}
    </p>
    ${boton('Ver las instrucciones', seguimiento)}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      En cuanto lo confirmemos te mandamos su teléfono. Lo que cueste la clase lo acordáis vosotros.
    </p>
  `);

  return {
    para: datos.para,
    asunto: `${datos.nombreProfesor} puede darte clase`,
    cuerpo,
    html,
  };
}

/** 3 · No puede. Sin dramatismo y con la salida puesta. */
export function correoProfesorRechaza(datos: {
  para: string;
  nombreFamilia: string;
  nombreProfesor: string;
  motivo: string | null;
}): Correo {
  const directorio = `${baseUrl()}/profesores`;

  const cuerpo = [
    `Hola ${datos.nombreFamilia}:`,
    '',
    `${datos.nombreProfesor} no puede cogerte ahora mismo.`,
    ...(datos.motivo ? ['', `Nos dice: «${datos.motivo}»`] : []),
    '',
    'No has pagado nada y no vas a pagar nada por esto. Hay más profesores en',
    'el directorio y escribirles sigue siendo gratis:',
    directorio,
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreFamilia)}:</p>
    <p style="margin:0 0 16px;">
      ${escapar(datos.nombreProfesor)} no puede cogerte ahora mismo.
    </p>
    ${datos.motivo ? cita(datos.motivo) : ''}
    <p style="margin:0 0 16px;color:${GRIS};">
      No has pagado nada y no vas a pagar nada por esto.
    </p>
    ${boton('Ver otros profesores', directorio)}
  `);

  return {
    para: datos.para,
    asunto: `Sobre tu solicitud a ${datos.nombreProfesor}`,
    cuerpo,
    html,
  };
}

/** 4 · Pago confirmado, con el teléfono dentro. */
export function correoPagoConfirmado(datos: {
  para: string;
  nombreFamilia: string;
  nombreProfesor: string;
  telefonoProfesor: string;
  tokenFamilia: string;
}): Correo {
  const seguimiento = `${baseUrl()}/solicitud/${datos.tokenFamilia}`;
  const limpio = datos.telefonoProfesor.replace(/\s/g, '');

  const cuerpo = [
    `Hola ${datos.nombreFamilia}:`,
    '',
    'Hemos recibido tu pago. Ya podéis hablar.',
    '',
    `Teléfono de ${datos.nombreProfesor}: ${datos.telefonoProfesor}`,
    '',
    'Le hemos dado también el tuyo, así que puede que te llame él primero.',
    'El precio de las clases y los horarios los acordáis vosotros: nosotros ya',
    'no intervenimos.',
    '',
    'Si algo no sale bien, entra aquí y te damos otro contacto sin pagar:',
    seguimiento,
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreFamilia)}:</p>
    <p style="margin:0 0 16px;font-size:17px;">
      <strong>Hemos recibido tu pago. Ya podéis hablar.</strong>
    </p>
    <p style="margin:0 0 4px;color:${GRIS};">Teléfono de ${escapar(datos.nombreProfesor)}</p>
    ${boton(datos.telefonoProfesor, `tel:${limpio}`)}
    <p style="margin:0 0 16px;color:${GRIS};font-size:14px;">
      Le hemos dado también el tuyo, así que puede que te llame él primero.
      El precio de las clases y los horarios los acordáis vosotros.
    </p>
    <p style="margin:0;font-size:14px;">
      ¿Algo no sale bien? <a href="${seguimiento}" style="color:${VERDE};">Entra aquí</a>
      y te damos otro contacto sin pagar de nuevo.
    </p>
  `);

  return {
    para: datos.para,
    asunto: `Ya puedes llamar a ${datos.nombreProfesor}`,
    cuerpo,
    html,
  };
}

/**
 * 5 · ¿Sigues queriendo estas clases?
 *
 * A los dos días de que el profesor acepte sin que se haya pagado. Lo delicado
 * de este correo es que no puede sonar a reclamación de deuda: no hay deuda,
 * hay una familia que se lo está pensando o que se ha olvidado.
 *
 * Por eso las dos respuestas pesan lo mismo y una de ellas es «déjalo». Quien
 * no piensa seguir agradece poder decirlo sin sentirse mal, y el profesor
 * agradece enterarse en vez de esperar.
 */
export function correoRecordatorioPago(datos: {
  para: string;
  nombreFamilia: string;
  nombreProfesor: string;
  tokenFamilia: string;
  codigo: string;
  importe: number;
  diasParaCerrar: number;
}): Correo {
  const seguimiento = `${baseUrl()}/solicitud/${datos.tokenFamilia}`;
  const precio = euros(datos.importe);

  const cuerpo = [
    `Hola ${datos.nombreFamilia}:`,
    '',
    `${datos.nombreProfesor} dijo que puede darte clase y sigue esperando.`,
    '',
    `Para que os paséis el teléfono falta el Bizum de ${precio} con el código`,
    `${datos.codigo} en el concepto.`,
    '',
    'Y si ya no te hace falta, dínoslo también: es un botón, y así él deja de',
    'esperar. No pasa absolutamente nada.',
    '',
    seguimiento,
    '',
    `Si no nos dices nada, en ${datos.diasParaCerrar} días cerraremos la`,
    'solicitud. Podrás volver a escribirle cuando quieras.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreFamilia)}:</p>
    <p style="margin:0 0 16px;">
      <strong>${escapar(datos.nombreProfesor)} dijo que puede darte clase</strong> y sigue esperando.
    </p>
    <p style="margin:0 0 16px;">
      Para que os paséis el teléfono falta el Bizum de <strong>${precio}</strong> con el código
      <strong style="font-family:monospace;letter-spacing:2px;">${escapar(datos.codigo)}</strong> en el concepto.
    </p>
    <p style="margin:0 0 16px;color:${GRIS};">
      Y si ya no te hace falta, dínoslo también: es un botón, y así él deja de esperar. No pasa nada.
    </p>
    ${boton('Pagar o decir que lo dejo', seguimiento)}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Si no nos dices nada, en ${datos.diasParaCerrar} días cerraremos la solicitud.
      Podrás volver a escribirle cuando quieras.
    </p>
  `);

  return {
    para: datos.para,
    asunto: `${datos.nombreProfesor} sigue esperando`,
    cuerpo,
    html,
  };
}

/**
 * 6 · Esa familia no ha seguido adelante.
 *
 * Para el profesor. Corto y sin culpar a nadie: dijo que sí a alguien y merece
 * saber cómo terminó, aunque terminara en nada. Sin este correo se queda una
 * semana pensando si tenía que hacer algo.
 */
export function correoFamiliaNoSigue(datos: {
  para: string;
  nombreProfesor: string;
  nombreFamilia: string;
  nivel: string | null;
  /** True si dijo expresamente que lo dejaba; false si simplemente no contestó. */
  seRetiro: boolean;
}): Correo {
  const que = datos.seRetiro
    ? 'nos ha dicho que al final no le hace falta'
    : 'no ha seguido adelante';

  const cuerpo = [
    `Hola ${datos.nombreProfesor}:`,
    '',
    `La familia de ${datos.nivel ?? 'la solicitud'} a la que dijiste que sí`,
    `${que}. No tienes que hacer nada.`,
    '',
    'Te lo contamos para que no te quedes esperando. Tu ficha sigue publicada',
    'igual y esto no te afecta en nada.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreProfesor)}:</p>
    <p style="margin:0 0 16px;">
      La familia ${datos.nivel ? `de ${escapar(datos.nivel)} ` : ''}a la que dijiste que sí
      <strong>${que}</strong>. No tienes que hacer nada.
    </p>
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Te lo contamos para que no te quedes esperando. Tu ficha sigue publicada igual
      y esto no te afecta en nada.
    </p>
  `);

  return {
    para: datos.para,
    asunto: 'Una solicitud que ya no sigue adelante',
    cuerpo,
    html,
  };
}

/** 7 · Tu contacto gratis está a punto de caducar. */
export function correoValeCaduca(datos: {
  para: string;
  nombreFamilia: string;
  codigo: string;
  dias: number;
}): Correo {
  const directorio = `${baseUrl()}/profesores`;
  const plazo = datos.dias === 1 ? 'mañana' : `en ${datos.dias} días`;

  const cuerpo = [
    `Hola ${datos.nombreFamilia}:`,
    '',
    'Te queda un contacto gratis sin usar, del profesor que no funcionó.',
    `Se acaba ${plazo}, porque a los tres meses borramos los datos de las`,
    'solicitudes.',
    '',
    'Si todavía buscas profesor, elige a otro y pon este código cuando te lo',
    'pida:',
    '',
    `   ${datos.codigo}`,
    '',
    directorio,
    '',
    'Y si ya no te hace falta, no tienes que hacer nada.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreFamilia)}:</p>
    <p style="margin:0 0 16px;">
      Te queda <strong>un contacto gratis sin usar</strong>, del profesor que no funcionó.
      Se acaba <strong>${plazo}</strong>, porque a los tres meses borramos los datos de las solicitudes.
    </p>
    <p style="margin:0 0 8px;">Si todavía buscas profesor, elige a otro y pon este código cuando te lo pida:</p>
    <p style="margin:0 0 8px;text-align:center;font-family:monospace;font-size:26px;font-weight:bold;letter-spacing:4px;color:${VERDE};">
      ${escapar(datos.codigo)}
    </p>
    ${boton('Ver el directorio', directorio)}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Y si ya no te hace falta, no tienes que hacer nada.
    </p>
  `);

  return {
    para: datos.para,
    asunto: `Tu contacto gratis se acaba ${plazo}`,
    cuerpo,
    html,
  };
}

/** 8 · Te hemos devuelto el dinero. */
export function correoDevolucion(datos: {
  para: string;
  nombreFamilia: string;
  importe: number;
  tokenFamilia: string;
}): Correo {
  const directorio = `${baseUrl()}/profesores`;
  const cantidad = euros(datos.importe);

  const cuerpo = [
    `Hola ${datos.nombreFamilia}:`,
    '',
    `Te hemos devuelto los ${cantidad} del contacto. Deberías verlo en tu`,
    'cuenta en un rato, o mañana como mucho.',
    '',
    'Sentimos que no haya salido bien. Si más adelante quieres volver a',
    'probar, el directorio sigue ahí y escribir sigue siendo gratis:',
    directorio,
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Hola ${escapar(datos.nombreFamilia)}:</p>
    <p style="margin:0 0 16px;">
      Te hemos devuelto los <strong>${cantidad}</strong> del contacto.
      Deberías verlo en tu cuenta en un rato, o mañana como mucho.
    </p>
    <p style="margin:0 0 16px;color:${GRIS};">
      Sentimos que no haya salido bien.
    </p>
    ${boton('Volver al directorio', directorio)}
  `);

  return {
    para: datos.para,
    asunto: 'Te hemos devuelto el dinero',
    cuerpo,
    html,
    responderA: 'info@academiavanza.es',
  };
}

function euros(n: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(n);
}

// -----------------------------------------------------------------------------
// 15 · El resumen diario, para Lucía
// -----------------------------------------------------------------------------

/**
 * Lo que hoy necesita que alguien entre en el panel.
 *
 * Es el único correo de todo el sistema que no va dirigido a una familia ni a un
 * profesor, y el único cuya razón de ser es que alguien está lejos. Desde
 * Erasmus, la diferencia entre entrar al panel cuando hace falta y entrar cuando
 * te acuerdas es este correo.
 *
 * **Sólo se manda si hay algo.** No hay versión de «hoy no hay nada», y es
 * deliberado: un aviso que llega todos los días se convierte en ruido en una
 * semana, y el día que traiga algo importante ya no se abrirá. Que llegue este
 * correo tiene que significar, por sí solo, que hay trabajo.
 *
 * Y por lo mismo, el asunto lleva la cuenta delante: se decide si abrirlo desde
 * la pantalla de bloqueo del móvil, sin entrar.
 */
export function correoResumenDiario(datos: {
  para: string;
  pagosPorConfirmar: number;
  fichasPorRevisar: number;
  profesoresSinAvisar: number;
  /** Horas desde la última vez que corrió el proceso, si es preocupante. */
  procesoParadoHoras?: number;
  /** Tareas que fallaron en la última ejecución. */
  fallos?: string[];
}): Correo {
  const lineas: string[] = [];

  if (datos.pagosPorConfirmar > 0) {
    lineas.push(
      datos.pagosPorConfirmar === 1
        ? '1 familia dice que ha pagado y espera a que lo confirmes'
        : `${datos.pagosPorConfirmar} familias dicen que han pagado y esperan a que lo confirmes`,
    );
  }

  if (datos.fichasPorRevisar > 0) {
    lineas.push(
      datos.fichasPorRevisar === 1
        ? '1 ficha nueva sin revisar'
        : `${datos.fichasPorRevisar} fichas nuevas sin revisar`,
    );
  }

  if (datos.profesoresSinAvisar > 0) {
    lineas.push(
      datos.profesoresSinAvisar === 1
        ? '1 profesor no se ha enterado de que tiene una solicitud'
        : `${datos.profesoresSinAvisar} profesores no se han enterado de que tienen una solicitud`,
    );
  }

  const total =
    datos.pagosPorConfirmar +
    datos.fichasPorRevisar +
    datos.profesoresSinAvisar;

  // El pago va primero en el asunto porque es el único donde hay alguien que ya
  // ha puesto dinero y no ha recibido nada a cambio.
  const asunto =
    datos.pagosPorConfirmar > 0
      ? `${datos.pagosPorConfirmar} pago${datos.pagosPorConfirmar === 1 ? '' : 's'} por confirmar en AcademiAvanza`
      : `${total} cosa${total === 1 ? '' : 's'} pendiente${total === 1 ? '' : 's'} en AcademiAvanza`;

  const panel = `${baseUrl()}/admin/cobros`;

  const avisoProceso =
    datos.procesoParadoHoras !== undefined
      ? `El proceso automático lleva ${datos.procesoParadoHoras} horas sin ejecutarse. Mientras siga así no se borran datos de familias ni salen recordatorios.`
      : null;

  const avisoFallos =
    datos.fallos && datos.fallos.length > 0
      ? `Ayer fallaron estas tareas: ${datos.fallos.join(', ')}.`
      : null;

  const cuerpo = [
    'Buenos días:',
    '',
    'Esto es lo que hay pendiente hoy:',
    '',
    ...lineas.map((l) => `  · ${l}`),
    '',
    ...(avisoProceso ? [avisoProceso, ''] : []),
    ...(avisoFallos ? [avisoFallos, ''] : []),
    'Se resuelve todo desde aquí:',
    panel,
    '',
    'Si no hay nada pendiente, este correo no se manda.',
    '',
    'AcademiAvanza',
  ].join('\n');

  const html = envoltorio(`
    <p style="margin:0 0 16px;">Buenos días:</p>
    <p style="margin:0 0 8px;">Esto es lo que hay pendiente hoy:</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      ${lineas.map((l) => `<li style="margin:4px 0;">${escapar(l)}</li>`).join('')}
    </ul>
    ${
      avisoProceso
        ? `<p style="margin:0 0 16px;padding:12px 16px;background:#FFF5F5;border-left:3px solid #C53030;color:#742A2A;">${escapar(avisoProceso)}</p>`
        : ''
    }
    ${
      avisoFallos
        ? `<p style="margin:0 0 16px;padding:12px 16px;background:#FFFAF0;border-left:3px solid #DD6B20;color:#7B341E;">${escapar(avisoFallos)}</p>`
        : ''
    }
    ${boton('Ir al panel', panel)}
    <p style="margin:0;color:${GRIS};font-size:14px;">
      Este correo sólo se manda los días que hay algo que hacer. Si no llega, es que no hace falta entrar.
    </p>
  `);

  return { para: datos.para, asunto, cuerpo, html };
}
