import Link from 'next/link';
import { precioVigente } from '@/backend/repositories/tarifas';
import {
  Boton,
  Campo,
  Ojo,
  Pantalla,
  Paso,
  Raya,
} from '@/frontend/features/guia/piezas';
import { CADUCADAS_PARA_PAUSAR, PLAZOS } from '@/shared/reglas/cobro';

/**
 * Cómo funciona esto, para un profesor.
 *
 * Está en la web y no en un PDF por una razón de fondo: un fichero que hay que
 * mandar es un flujo que necesita a alguien mandándolo. El profesor que se
 * apunte en noviembre no lo tendría, y no habrá nadie para dárselo.
 *
 * El público no es el profesor curioso, es el que no lo es: alguien de veinte
 * años que abre un enlace de WhatsApp, mira treinta segundos y decide si esto
 * le merece la pena. Por eso cada paso cabe en un vistazo y lleva un dibujo de
 * lo que se va a encontrar.
 *
 * Los números que salen aquí —el precio, los plazos, cuántas propuestas sin
 * contestar pausan una ficha— no están escritos a mano. Salen de la tarifa
 * vigente y de `shared/reglas/cobro.ts`, que es donde viven de verdad. Una guía
 * que promete diez euros cuando el panel cobra doce es peor que no tenerla.
 */

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cómo funciona, si das clase · AcademiAvanza',
  description:
    'Publicar tu ficha, recibir propuestas de familias y aceptarlas. Paso a paso.',
};

const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n,
  );

export default async function GuiaProfesor() {
  const precio = await precioVigente();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm font-semibold text-verde-avanza-oscuro">
        Guía para profesores
      </p>

      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-azul-confianza">
        Cómo funciona, en seis pasos
      </h1>

      <p className="mt-4 leading-relaxed text-carbon">
        Publicas tu ficha una vez. Las familias te encuentran y te escriben. Tú
        decides a quién coges. Ni cuentas, ni contraseñas, ni nada que pagar.
      </p>

      <p className="mt-2 text-sm text-gris-medio">
        Cinco minutos de lectura. Menos si vas mirando los dibujos.
      </p>

      <ol className="mt-12">
        <Paso
          numero={1}
          titulo="Rellenas tu ficha"
          dibujo={
            <Pantalla donde="academiavanza.es/registro">
              <Campo etiqueta="Nombre" valor="Marta" />
              <Campo etiqueta="Colegio donde estudiaste" valor="Montpellier" />
              <Campo etiqueta="Carrera" valor="Matemáticas · UCM" />
              <Raya ancho="w-4/5" />
              <Raya ancho="w-3/5" />
              <Boton>Enviar mi ficha</Boton>
            </Pantalla>
          }
        >
          <p>
            Entras en{' '}
            <a
              className="font-medium text-verde-avanza-oscuro underline underline-offset-4"
              href="/registro"
            >
              academiavanza.es/registro
            </a>{' '}
            y cuentas quién eres: tu colegio, qué estudias, qué asignaturas y
            cursos te ves capaz de dar, y cuándo puedes.
          </p>
          <p>
            No pedimos foto, ni notas, ni justificantes. Y no hay que crearse
            ninguna cuenta.
          </p>
          <p>
            Lo único que se lee de verdad es la última casilla, la de{' '}
            <strong className="text-carbon">
              algo que te distinga al dar clase
            </strong>
            . Es lo que separa tu ficha de las demás. «Se me da bien explicar
            física desde cero» dice mucho más que «soy responsable».
          </p>
        </Paso>

        <Paso
          numero={2}
          titulo="La revisamos y se publica"
          dibujo={
            <Pantalla donde="Tu correo">
              <Raya ancho="w-1/3" />
              <p className="text-[11px] font-semibold text-carbon">
                Tu ficha ya está publicada
              </p>
              <Raya ancho="w-full" />
              <Raya ancho="w-4/5" />
              <Boton tono="secundario">Ver mi ficha</Boton>
            </Pantalla>
          }
        >
          <p>
            Miramos que esté todo y la publicamos. Te avisamos por correo cuando
            esté visible.
          </p>
          <p>
            En tu ficha pública aparece tu nombre y la inicial del primer
            apellido, tu colegio, lo que das y tu horario orientativo.{' '}
            <strong className="text-carbon">
              Tu teléfono y tu correo no se publican nunca.
            </strong>
          </p>
          <Ojo>
            Ese correo lleva{' '}
            <strong>el enlace de tu ficha, y es tu única llave</strong>. Aquí no
            hay contraseñas: quien tiene el enlace, entra. Guárdalo en favoritos
            o mándatelo a ti mismo por WhatsApp. Y si lo pierdes,{' '}
            <Link
              className="font-medium text-verde-avanza-oscuro underline underline-offset-4"
              href="/mi-ficha"
            >
              te lo volvemos a mandar
            </Link>{' '}
            escribiendo tu correo.
          </Ojo>
        </Paso>

        <Paso
          numero={3}
          titulo="Una familia te escribe"
          dibujo={
            <Pantalla donde="Tu correo">
              <p className="text-[11px] font-semibold text-carbon">
                Una familia quiere clases contigo
              </p>
              <Raya ancho="w-full" />
              <p className="text-[11px] text-gris-medio">
                3.º ESO · Matemáticas · a domicilio
              </p>
              <div className="flex gap-2">
                <Boton>Puedo cogerla</Boton>
                <Boton tono="secundario">Ahora no</Boton>
              </div>
            </Pantalla>
          }
        >
          <p>
            Te llega un correo con lo que necesita: el curso, la asignatura, si
            es online o a domicilio y para cuándo. Si quieres, también te avisamos
            al móvil.
          </p>
          <p>
            <strong className="text-carbon">
              Todavía no sabes quién es ni cómo se llama.
            </strong>{' '}
            Sus datos no se le dan a nadie hasta que tú digas que sí.
          </p>
        </Paso>

        <Paso
          numero={4}
          titulo="Dices sí o dices no"
          dibujo={
            <Pantalla donde="academiavanza.es/aceptar/…">
              <p className="text-[11px] font-semibold text-carbon">
                ¿Puedes coger esta clase?
              </p>
              <Raya ancho="w-3/4" />
              <div className="flex gap-2">
                <Boton>Sí, puedo</Boton>
                <Boton tono="secundario">No puedo</Boton>
              </div>
            </Pantalla>
          }
        >
          <p>
            Un botón. Si no puedes, ahí acaba: no pasa nada y la familia puede
            buscar a otra persona enseguida.
          </p>
          <p>
            Decir que no cuanto antes es lo mejor que puedes hacer por ella, y no
            te penaliza en nada.
          </p>
          <Ojo>
            Lo que sí cuenta es{' '}
            <strong>no contestar</strong>. La familia elige para cuándo lo
            necesita y ese plazo manda: {PLAZOS.ya.dias} días si tiene prisa,{' '}
            {PLAZOS.semanas.dias} si busca para las próximas semanas y{' '}
            {PLAZOS.adelante.dias} si es para más adelante. Pasado el plazo, la
            propuesta se cierra sola. Y si dejas{' '}
            {CADUCADAS_PARA_PAUSAR} sin contestar, retiramos tu ficha del
            directorio: no es un castigo, es que no tiene sentido mandarte gente
            a esperar. Vuelves con un clic cuando quieras.
          </Ojo>
        </Paso>

        <Paso
          numero={5}
          titulo="Os pasamos los teléfonos"
          dibujo={
            <Pantalla donde="Tu correo">
              <p className="text-[11px] font-semibold text-carbon">
                Ya podéis hablar
              </p>
              <Campo etiqueta="Familia" valor="Ana · 6·· ··· ···" />
              <Raya ancho="w-2/3" />
            </Pantalla>
          }
        >
          <p>
            Cuando aceptas, la familia paga {euros(precio)} a AcademiAvanza por
            el contacto. Una sola vez. Entonces os damos el teléfono el uno del
            otro y ya habláis directamente.
          </p>
          <p>
            <strong className="text-carbon">
              A ti no te cobramos nada, ni ahora ni nunca.
            </strong>{' '}
            Ni por aparecer, ni por dar la clase, ni comisión sobre lo que cobres.
          </p>
        </Paso>

        <Paso
          numero={6}
          titulo="Lo demás lo acordáis vosotros"
          dibujo={
            <Pantalla donde="academiavanza.es/mi-ficha/…">
              <p className="text-[11px] font-semibold text-carbon">Tu ficha</p>
              <Raya ancho="w-full" />
              <div className="flex gap-2">
                <Boton tono="secundario">Pausar mi ficha</Boton>
                <Boton tono="peligro">Darme de baja</Boton>
              </div>
            </Pantalla>
          }
        >
          <p>
            El precio de la clase, el horario y dónde os veis lo decidís entre
            vosotros. Nosotros ahí ya no pintamos nada: no somos tu jefe, no te
            contratamos y no tocamos ese dinero.
          </p>
          <p>
            Desde el enlace de tu ficha puedes cambiar lo que quieras,{' '}
            <strong className="text-carbon">pausarla</strong> si estás de
            exámenes y no quieres que te escriban, o{' '}
            <strong className="text-carbon">borrarla entera</strong> tú mismo. No
            hay que pedir permiso ni esperar a que nadie conteste.
          </p>
        </Paso>
      </ol>

      {/* --------------------------------------------------------------- */}
      <section className="mt-4 rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-6">
        <h2 className="text-lg font-bold text-verde-avanza-oscuro">
          ¿Ya dabas clase con AcademiAvanza?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-carbon">
          Entonces tienes que publicar tu ficha igualmente. Antes las clases se
          repartían a mano y ahora te eligen las familias directamente, así que{' '}
          <strong>
            mientras no tengas ficha publicada no puedes recibir ninguna
            propuesta
          </strong>
          . Son los mismos cinco minutos que cualquier otro.
        </p>
        <a
          href="/registro"
          className="mt-4 inline-block rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          Publicar mi ficha
        </a>
      </section>

      {/* Esto es «cómo funciona la plataforma». Lo otro es «cómo se da una
          clase», que es lo que de verdad le va a hacer falta el martes. */}
      <section className="mt-10 rounded-xl border border-gris-borde bg-gris-claro p-6">
        <h2 className="font-bold text-carbon">
          Y para la clase en sí, tenemos guías
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gris-medio">
          Esto de arriba es cómo funciona la web. Lo otro es lo que se te va a
          complicar de verdad en la clase: la autonomía del alumno, la
          metodología de una sesión online, las distracciones cuando das clase en
          su casa y las adaptaciones para quien tiene dificultades de atención.
          Breves, y salen de más de mil novecientas clases.
        </p>
        <a
          href="/como-dar-clase"
          className="mt-4 inline-block rounded-lg border border-verde-avanza px-5 py-2.5 text-sm font-semibold text-verde-avanza-oscuro transition hover:bg-verde-avanza-claro"
        >
          Ver las guías para dar clase
        </a>
      </section>

      <p className="mt-8 text-sm text-gris-medio">
        ¿Algo no encaja o no se entiende?{' '}
        <a
          className="underline underline-offset-4"
          href="/buzon"
        >
          Cuéntanoslo aquí
        </a>
        . Y si buscas la guía desde el otro lado,{' '}
        <a className="underline underline-offset-4" href="/guia/familia">
          ésta es la de las familias
        </a>
        .
      </p>
    </main>
  );
}
