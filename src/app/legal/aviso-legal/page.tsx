import {
  Apartado,
  PaginaLegal,
} from '@/frontend/components/shared/pagina-legal';

export const metadata = {
  title: 'Aviso legal · AcademiAvanza',
  description: 'Quién está detrás de AcademiAvanza y qué hace exactamente.',
};

/**
 * Aviso legal.
 *
 * El apartado que de verdad importa es «qué somos y qué no somos»: es lo que
 * fija hasta dónde llega la responsabilidad de la plataforma. Está escrito para
 * que se entienda leyéndolo una vez, no para cubrirse las espaldas con humo.
 */
export default function PaginaAvisoLegal() {
  return (
    <PaginaLegal titulo="Aviso legal" actualizado="agosto de 2026">
      <Apartado titulo="Quién está detrás">
        <p>
          AcademiAvanza es un servicio de <strong>Lucía Ordovás Mejorado</strong>
          , con NIF <strong>02745877E</strong>. Para cualquier cosa, incluidas
          reclamaciones:{' '}
          <a
            href="mailto:info@academiavanza.es"
            className="text-verde-avanza-oscuro underline underline-offset-4"
          >
            info@academiavanza.es
          </a>
          . Contestamos siempre.
        </p>
        {/* Se publica la localidad y el código postal, no la calle.
            Es una decisión deliberada: identifica dónde está el responsable sin
            poner la puerta de casa de una persona en una web abierta. Queda
            pendiente confirmar con una gestoría si la normativa de comercio
            electrónico se da por satisfecha con esto; si pidiera el domicilio
            completo, lo razonable sería un apartado de correos y no el
            particular. */}
        <p>Madrid, código postal 28027 (España).</p>
      </Apartado>

      <Apartado titulo="Qué somos y qué no somos">
        <p>
          <strong>Lo que hacemos</strong> es publicar fichas de profesores
          particulares y poner en contacto a una familia con uno de ellos cuando
          las dos partes quieren.
        </p>
        <p>
          <strong>Lo que no hacemos</strong>, y conviene que quede claro:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>No damos clases ni empleamos a los profesores.</li>
          <li>
            No fijamos el precio de las clases ni cobramos nada por ellas. Eso lo
            acuerdan la familia y el profesor directamente entre ellos.
          </li>
          <li>
            No organizamos horarios, ni llevamos seguimiento académico, ni
            mediamos si algo no funciona.
          </li>
          <li>
            <strong>
              No comprobamos la titulación ni el expediente de nadie.
            </strong>{' '}
            Lo que aparece en cada ficha —el colegio, la carrera, los idiomas—
            lo declara el propio profesor. Nosotros revisamos que la ficha esté
            bien escrita y sea coherente, no que sea cierta.
          </li>
          <li>
            No somos un centro educativo ni una academia, y no estamos
            autorizados como tal.
          </li>
        </ul>
      </Apartado>

      <Apartado titulo="Qué se paga">
        <p>
          Publicar una ficha es gratis y siempre lo será: al profesor no se le
          cobra nada, ni por aparecer ni por dar clases.
        </p>
        <p>
          La familia paga una cantidad única por cada contacto,{' '}
          <strong>solo después de que el profesor haya aceptado</strong>. Si el
          profesor dice que no, no se paga nada. El importe vigente aparece
          siempre en la propia web antes de pagar.
        </p>
        <p>
          <strong>Si el contacto no funciona, no lo pierdes.</strong> En tu
          propia página de seguimiento hay dos botones: uno para decir que no
          conseguiste hablar con el profesor y otro para decir que hablasteis y
          no salió bien. En cualquiera de los dos casos te damos otro contacto
          sin volver a pagar, al momento y sin tener que escribir a nadie.
        </p>
        <p>
          Y si pruebas con varios y ninguno te encaja, escríbenos a{' '}
          <a
            href="mailto:info@academiavanza.es"
            className="text-verde-avanza-oscuro underline underline-offset-4"
          >
            info@academiavanza.es
          </a>{' '}
          y te devolvemos el dinero.
        </p>
      </Apartado>

      <Apartado titulo="De qué respondemos">
        <p>
          Ponemos cuidado en que la web funcione y en que la información sea
          correcta, pero no podemos garantizar que un profesor conteste, que
          acepte, que las clases salgan bien ni que lo que ha declarado en su
          ficha sea exacto.
        </p>
        <p>
          Lo que ocurra entre una familia y un profesor a partir del momento en
          que él recibe su teléfono —el precio, los horarios, la forma de pago,
          la calidad de las clases— es cosa suya y no respondemos de ello.
        </p>
        <p>
          El contacto va en un solo sentido y es deliberado:{' '}
          <strong>
            al profesor le damos el teléfono de la familia, y el suyo no se lo
            damos a nadie
          </strong>
          . Es una medida de protección de datos: se comparte lo mínimo
          imprescindible para que las dos partes puedan hablar. Si un profesor
          decide darle su teléfono a una familia, lo hace él directamente y bajo
          su responsabilidad.
        </p>
      </Apartado>

      <Apartado titulo="Uso de la web">
        <p>
          Los contenidos de esta web son de AcademiAvanza. Puedes leerlos,
          compartir enlaces y usarlos para lo que están: encontrar profesor o
          publicar tu ficha.
        </p>
        <p>
          No está permitido extraer los datos del directorio de forma
          automatizada, ni usarlos para enviar publicidad, ni suplantar a un
          profesor o a una familia. Si detectamos algo así, retiramos el acceso.
        </p>
      </Apartado>

      <Apartado titulo="Ley aplicable">
        <p>
          Se aplica la legislación española. Para cualquier conflicto, los
          juzgados competentes son los del domicilio de la persona consumidora.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
