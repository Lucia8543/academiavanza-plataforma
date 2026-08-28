import {
  CabeceraGuia,
  Consejo,
  EnTreintaSegundos,
  Frases,
  Ojo,
  PieDeGuia,
} from '@/frontend/features/guia/piezas';

/**
 * La guía de las clases online.
 *
 * El fallo típico de una clase online no es técnico: es que el profesor habla y
 * el alumno mira. En presencial eso se nota en la cara; por una pantalla no se
 * nota nada, y una hora puede irse entera sin que el alumno haya escrito un
 * solo renglón.
 *
 * Todo lo que sigue va contra eso: que la mano que escribe sea la suya.
 */

export const metadata = {
  title: 'Metodología para clases online · AcademiAvanza',
  description:
    'Cómo plantear una sesión por videollamada para que el alumno participe y resulte tan aprovechada como una presencial.',
};

export default function GuiaOnline() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <CabeceraGuia
        titulo="Metodología para clases online"
        entradilla="Al otro lado hay un adolescente con el móvil a diez centímetros y una pestaña abierta que tú no ves. Una clase online rara vez se pierde por la conexión: se pierde cuando hablas tú y no escribe nadie."
        minutos={3}
      />

      <EnTreintaSegundos
        puntos={[
          'Que escriba él. Si en una hora no ha escrito nada, la clase no ha pasado.',
          'Pizarra compartida siempre, y que tenga el control él parte del tiempo.',
          'Cámara encendida los dos. Sin cara no sabes si se ha perdido.',
          'Trocea: quince minutos de tema, un ejercicio suyo, y vuelta a empezar.',
          'Manda por escrito lo que habéis hecho al acabar, en dos líneas.',
        ]}
      />

      <Consejo titulo="1. Prepara antes lo que en presencial improvisarías">
        <p>
          En una mesa puedes escribir en un papel sobre la marcha. Por una
          pantalla, cinco minutos buscando un ejercicio son cinco minutos en los
          que el alumno se ha ido.
        </p>
        <p>
          Ten abierto de antemano: la pizarra, los ejercicios que vais a hacer y
          los apuntes. Nada más. Cada ventana de más es una cosa que buscar en
          directo.
        </p>
      </Consejo>

      <Consejo titulo="2. La pizarra es de los dos">
        <p>
          Comparte una pizarra en blanco y{' '}
          <strong className="text-carbon">dale el control a él</strong> para
          resolver. Es lo que sustituye a empujarle el papel por encima de la
          mesa.
        </p>
        <p>
          Si no tenéis pizarra digital, vale con que él lo haga en su cuaderno y
          te enseñe la hoja a la cámara. Peor, pero mucho mejor que escribir tú.
        </p>
        <p>
          Compartir pantalla sirve para enseñar algo concreto: un enunciado, una
          corrección, una gráfica. No para tenerla puesta la hora entera.
        </p>
      </Consejo>

      <Consejo titulo="3. Trocea la hora">
        <p>
          Una explicación de cuarenta minutos por videollamada no la aguanta
          nadie. El ritmo que funciona es corto y repetido:
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong className="text-carbon">10-15 minutos</strong> — explicas o
            repasáis lo de la semana.
          </li>
          <li>
            <strong className="text-carbon">Un ejercicio suyo</strong> — lo hace
            él mientras tú callas. Cuesta callarse; hazlo igual.
          </li>
          <li>
            <strong className="text-carbon">Lo corregís juntos</strong> — y
            vuelta a empezar.
          </li>
        </ul>
      </Consejo>

      <Consejo titulo="4. Pregunta para saber si sigue ahí">
        <p>
          Por una pantalla no ves la cara de «no me estoy enterando». Hay que ir
          a buscarla:
        </p>
        <Frases
          frases={[
            '¿Me lo repites tú con tus palabras?',
            'Escribe el siguiente paso y me lo enseñas.',
            'De lo que acabo de decir, ¿qué es lo que menos claro te ha quedado?',
          ]}
        />
        <p>
          «¿Se entiende?» no vale: todo el mundo dice que sí.
        </p>
      </Consejo>

      <Consejo titulo="5. Cierra por escrito">
        <p>
          Al acabar, mándale en dos líneas lo que habéis hecho y lo que tiene que
          practicar. Por donde habléis, da igual. Es treinta segundos tuyos y es
          la diferencia entre que la semana siguiente llegue con algo hecho o con
          las manos vacías.
        </p>
      </Consejo>

      <Ojo>
        <strong>No grabes la clase.</strong> Al otro lado hay un menor de edad, y
        grabar a un menor exige permiso expreso de su padre o su madre y decidir
        dónde se guarda eso y cuánto tiempo. Si la familia te lo pide a ti,
        habladlo vosotros: AcademiAvanza no participa en eso ni guarda nada de
        vuestras clases.
      </Ojo>

      <PieDeGuia />
    </main>
  );
}
