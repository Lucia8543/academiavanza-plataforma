import {
  Apartado,
  PaginaLegal,
} from '@/frontend/components/shared/pagina-legal';

export const metadata = {
  title: 'Política de privacidad · AcademiAvanza',
  description:
    'Qué datos recogemos, para qué, cuánto tiempo los guardamos y cómo borrarlos.',
};

/**
 * Política de privacidad.
 *
 * Está escrita en castellano llano y no en jerga jurídica. No es por estilo: el
 * RGPD exige en su artículo 12 que la información se dé «en forma concisa,
 * transparente, inteligible y de fácil acceso, con un lenguaje claro y
 * sencillo», y con más razón cuando afecta a menores.
 *
 * Los huecos marcados en amarillo los tiene que rellenar Lucía antes de
 * publicar. Están así de visibles a propósito.
 */
export default function PaginaPrivacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad" actualizado="agosto de 2026">
      <Apartado titulo="Lo esencial, en cuatro líneas">
        <p>
          Si eres profesor, guardamos tu ficha para publicarla y tu correo y tu
          teléfono para avisarte. Si eres una familia, guardamos tu nombre y tu
          teléfono durante noventa días y luego los borramos solos. No usamos
          analítica, no hay publicidad y no vendemos nada a nadie. Nunca pedimos
          datos del alumno.
        </p>
      </Apartado>

      <Apartado titulo="Quién trata tus datos">
        <p>
          La responsable es <strong>Lucía Ordovás Mejorado</strong>, con NIF{' '}
          <strong>02745877E</strong>.
        </p>
        <p>Madrid, código postal 28027 (España).</p>
        <p>
          Para cualquier cosa relacionada con tus datos:{' '}
          <a
            href="mailto:info@academiavanza.es"
            className="text-verde-avanza-oscuro underline underline-offset-4"
          >
            info@academiavanza.es
          </a>
          .
        </p>
      </Apartado>

      <Apartado titulo="Si eres profesor">
        <p>
          <strong>Qué guardamos:</strong> tu nombre y apellidos, tu correo, tu
          teléfono, el colegio donde estudiaste, tu carrera y universidad, las
          asignaturas y cursos que das, los idiomas que declaras, tu
          disponibilidad horaria y el texto de presentación que escribes.
        </p>
        <p>
          <strong>Para qué:</strong> para publicar tu ficha en el directorio y
          para ponerte en contacto con familias que quieran clases contigo.
        </p>
        <p>
          <strong>Con qué base legal:</strong> tu consentimiento, que nos das al
          marcar la casilla del formulario, y la ejecución del servicio que nos
          pides.
        </p>
        <p>
          <strong>Qué se publica y qué no.</strong> En el directorio aparece tu
          nombre de pila y la inicial de tu primer apellido, tu colegio, tus
          estudios, lo que das y tu horario orientativo.{' '}
          <strong>Tu correo y tu teléfono no se publican nunca.</strong> El
          teléfono solo se le da a una familia concreta cuando tú has aceptado
          darle clase y ella ha pagado el contacto.
        </p>
        <p>
          <strong>Cuánto tiempo:</strong> mientras tu ficha exista. Desde el
          enlace de tu ficha puedes pausarla, y también borrarla tú mismo: al
          final de esa página hay un apartado para darte de baja. Se borran tu
          nombre, tu correo, tu teléfono y lo que hayas escrito, y no hace falta
          que nos lo pidas ni que esperes a que contestemos. Si alguna familia
          pagó por tu contacto, de esa solicitud se conservan solo la fecha y el
          importe, sin tu nombre, porque acreditan que ese dinero entró.
        </p>
      </Apartado>

      <Apartado titulo="Si eres una familia">
        <p>
          <strong>Qué guardamos:</strong> el nombre de la persona adulta que
          escribe, su teléfono, su correo, el curso del alumno y el mensaje que
          quiera escribir. Nada más.
        </p>
        <p>
          <strong>El correo es nuestro, no del profesor.</strong> Lo usamos solo
          para avisarte de lo que pasa con tu solicitud: que ha contestado, que
          el pago está confirmado. Al profesor se le da tu nombre y tu teléfono,
          y nada más.
        </p>
        <p>
          <strong>Qué no pedimos:</strong> ningún dato del alumno que permita
          identificarlo. Ni su nombre, ni su edad, ni su colegio. Y el campo de
          texto libre rechaza automáticamente los mensajes que mencionan salud,
          diagnósticos, religión u origen, porque son datos de categoría especial
          que no tenemos ninguna necesidad ni ningún derecho de guardar.
        </p>
        <p>
          <strong>Para qué:</strong> para preguntarle al profesor si puede
          cogerte y, si acepta y pagas el contacto, para darle tu nombre y tu
          teléfono. A nadie más.
        </p>
        <p>
          <strong>Si no sigues adelante te preguntamos por qué</strong>, y hay
          que elegir una respuesta de una lista corta: el horario, la distancia,
          el precio y poco más. No hay ningún hueco para escribir, y es
          deliberado. Al profesor le contamos esos motivos{' '}
          <strong>agrupados y sin decirle quién ha dicho cada cosa</strong>, para
          que sepa por qué no le eligen sin poder señalar a nadie. Si el motivo
          es que no querías pagar el contacto, eso no se le cuenta: es una queja
          sobre nosotros, no sobre él.
        </p>
        <p>
          <strong>Con qué base legal:</strong> tu consentimiento, que nos das al
          marcar las dos casillas del formulario, una de las cuales es declarar
          que eres la madre, el padre o el tutor legal del alumno.
        </p>
        <p>
          <strong>Cuánto tiempo:</strong>{' '}
          <strong>noventa días desde que escribes</strong>. Pasado ese plazo, el
          mensaje y tu teléfono se borran automáticamente. No hay que pedirlo ni
          hay que acordarse: lo hace un proceso que corre solo todos los días.
        </p>
      </Apartado>

      <Apartado titulo="Con quién compartimos los datos">
        <p>
          Con el profesor al que escribes, y solo su nombre y su teléfono, y solo
          después de que él acepte y tú pagues. Con nadie más.
        </p>
        <p>
          Aparte, usamos tres servicios que tratan datos por encargo nuestro:{' '}
          <strong>Render</strong> para alojar la web, con los servidores en
          Fráncfort, <strong>Supabase</strong> para la base de datos, que está en
          Irlanda, y <strong>Resend</strong> para enviar los correos. Los tres
          han firmado los compromisos que exige el reglamento europeo.
        </p>
        <p>
          No vendemos datos, no los cedemos con fines publicitarios y no hay
          ninguna red social ni sistema de anuncios metido en esta web.
        </p>
      </Apartado>

      <Apartado titulo="Qué puedes pedirnos">
        <p>
          Que te digamos qué tenemos tuyo, que lo corrijamos, que lo borremos,
          que dejemos de usarlo, que te lo demos en un fichero para llevártelo a
          otro sitio, o que retires el consentimiento que nos diste. Cualquiera
          de esas cosas, escribiendo a{' '}
          <a
            href="mailto:info@academiavanza.es"
            className="text-verde-avanza-oscuro underline underline-offset-4"
          >
            info@academiavanza.es
          </a>
          . Contestamos en un mes como mucho, y normalmente en un par de días.
        </p>
        <p>
          Si crees que no lo hacemos bien, puedes reclamar ante la Agencia
          Española de Protección de Datos,{' '}
          <a
            href="https://www.aepd.es"
            className="text-verde-avanza-oscuro underline underline-offset-4"
          >
            aepd.es
          </a>
          .
        </p>
      </Apartado>

      <Apartado titulo="Menores">
        <p>
          Esta web no está dirigida a menores de edad y no les pedimos datos.
          Quien escribe a un profesor tiene que declarar que es la madre, el
          padre o el tutor legal del alumno. Si detectamos que alguien ha
          escrito siendo menor, borramos el mensaje.
        </p>
      </Apartado>

      <Apartado titulo="Si cambiamos esto">
        <p>
          Si cambiamos algo que te afecte, cambiaremos también la fecha de arriba
          y, si es un cambio de fondo, avisaremos por correo a quien tenga ficha
          publicada.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
