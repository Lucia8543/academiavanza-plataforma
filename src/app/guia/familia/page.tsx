import { precioVigente } from '@/backend/repositories/tarifas';
import {
  Boton,
  Campo,
  FichaMini,
  Ojo,
  Pantalla,
  Paso,
  Raya,
} from '@/frontend/features/guia/piezas';
import { DIAS_PARA_RECLAMAR } from '@/backend/services/solicitud';
import { PLAZOS } from '@/shared/reglas/cobro';
import { euros } from '@/shared/textos/precios';

/**
 * Cómo funciona esto, para una familia.
 *
 * La duda que trae aquí a una madre no es «cómo se usa la web»: es **cuándo
 * tengo que pagar y qué pasa si sale mal**. Por eso el dinero aparece explicado
 * en su paso y no escondido en letra pequeña, y por eso el vale tiene sitio
 * propio en vez de una nota al pie.
 *
 * Al igual que la del profesor, vive en la web y no en un PDF, y los números
 * salen de la tarifa vigente y de `shared/reglas/cobro.ts`.
 */

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cómo funciona, si buscas profesor · AcademiAvanza',
  description:
    'Buscar profesor, escribirle y qué pasa con el dinero. Paso a paso.',
};

export default async function GuiaFamilia() {
  const precio = await precioVigente();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm font-semibold text-verde-avanza-oscuro">
        Guía para familias
      </p>

      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-azul-confianza">
        Cómo funciona, en cinco pasos
      </h1>

      <p className="mt-4 leading-relaxed text-carbon">
        Eliges tú al profesor, le escribes gratis y solo pagas si él dice que
        puede cogerte. Sin registrarte y sin crear ninguna cuenta.
      </p>

      <ol className="mt-12">
        <Paso
          numero={1}
          titulo="Buscas al que te encaje"
          dibujo={
            <Pantalla donde="academiavanza.es/profesores">
              <div className="flex gap-2">
                <Boton tono="secundario">Matemáticas</Boton>
                <Boton tono="secundario">3.º ESO</Boton>
              </div>
              <FichaMini
                nombre="Marta P."
                detalle="Montpellier · Matemáticas · online"
              />
              <FichaMini
                nombre="Jorge L."
                detalle="El Valle · Física y Química"
              />
            </Pantalla>
          }
        >
          <p>
            En el{' '}
            <a
              className="font-medium text-verde-avanza-oscuro underline underline-offset-4"
              href="/profesores"
            >
              directorio
            </a>{' '}
            filtras por asignatura, curso, si lo quieres online o en casa, y por
            el colegio del que viene el profesor.
          </p>
          <p>
            Cada ficha dice quién es, qué estudia y qué se le da bien.{' '}
            <strong className="text-carbon">Eliges tú</strong>: aquí nadie te
            asigna a nadie.
          </p>
        </Paso>

        <Paso
          numero={2}
          titulo="Le escribes, y no cuesta nada"
          dibujo={
            <Pantalla donde="academiavanza.es/profesor/marta-p">
              <Campo etiqueta="Tu nombre" valor="Ana" />
              <Campo etiqueta="Tu teléfono" valor="6·· ··· ···" />
              <Campo etiqueta="¿Para cuándo?" valor="Lo necesito ya" />
              <Boton>Escribir a Marta</Boton>
            </Pantalla>
          }
        >
          <p>
            Rellenas cuatro casillas y ya está. No hay que registrarse, ni crear
            contraseña, ni dejar ninguna tarjeta.
          </p>
          <p>
            <strong className="text-carbon">
              No te pedimos ningún dato de tu hijo
            </strong>{' '}
            que permita identificarlo, ni su nombre, ni su edad, ni su colegio.
            Solo el curso.
          </p>
          <p>
            Y eliges <strong className="text-carbon">para cuándo lo necesitas</strong>. Ese
            plazo manda: si es para ya, el profesor tiene {PLAZOS.ya.dias} días
            para contestar; si buscas para más adelante, {PLAZOS.adelante.dias}.
            Pasado el plazo cerramos la solicitud y te avisamos, para que no te
            quedes esperando sin saber nada.
          </p>
          <Ojo>
            Al enviarla te damos{' '}
            <strong>un enlace para seguir tu solicitud</strong>. Guárdalo: no hay
            contraseñas, y ese enlace es la forma de volver. Si lo pierdes,
            puedes recuperarlo con tu código y tu teléfono.
          </Ojo>
        </Paso>

        <Paso
          numero={3}
          titulo="El profesor dice si puede"
          dibujo={
            <Pantalla donde="academiavanza.es/solicitud/…">
              <p className="text-[11px] font-semibold text-carbon">
                Marta puede cogerte
              </p>
              <Raya ancho="w-3/4" />
              <Boton>Pagar el contacto</Boton>
            </Pantalla>
          }
        >
          <p>
            Le avisamos por correo y al móvil, y te decimos qué contesta.
          </p>
          <p>
            <strong className="text-carbon">Si no puede, ahí acaba</strong> y no
            has pagado nada. Escribes a otro y no has perdido más que un rato.
            Nunca pagas por un contacto que no existe.
          </p>
        </Paso>

        <Paso
          numero={4}
          titulo="Si acepta, pagas el contacto"
          dibujo={
            <Pantalla donde="Tu móvil">
              <p className="text-[11px] font-semibold text-carbon">
                Marta P.
              </p>
              <p className="text-[11px] text-gris-medio">
                Hola, soy Marta, de AcademiAvanza…
              </p>
              <Raya ancho="w-2/3" />
            </Pantalla>
          }
        >
          <p>
            {euros(precio)} por Bizum, una sola vez. En cuanto lo confirmamos le
            damos tu teléfono, y{' '}
            <strong className="text-carbon">te escribe o te llama él</strong>.
          </p>
          <p>
            <strong className="text-carbon">
              No te damos el número del profesor, y es a propósito:
            </strong>{' '}
            por protección de datos no facilitamos el teléfono de nuestros
            profesores. Es él quien decide si te lo da cuando habléis.
          </p>
          <Ojo>
            <strong>
              ¿Y si pasan {DIAS_PARA_RECLAMAR} días desde que pagas y no te
              escribe?
            </strong>{' '}
            Entras en tu página y te damos otro contacto sin volver a pagar.
            Eliges tú a quién. No tienes que dar explicaciones ni discutir con
            nadie: es un botón.
          </Ojo>
          <p>
            Eso es todo lo que cobramos.{' '}
            <strong className="text-carbon">
              Las clases se las pagas al profesor
            </strong>
            : el precio y el horario los acordáis entre vosotros y nosotros no
            intervenimos ni nos llevamos comisión.
          </p>
        </Paso>

        <Paso
          numero={5}
          titulo="Y si no funciona, tienes otro"
          dibujo={
            <Pantalla donde="academiavanza.es/solicitud/…">
              <p className="text-[11px] font-semibold text-carbon">
                Tienes un contacto sin pagar
              </p>
              <Raya ancho="w-4/5" />
              <Boton tono="secundario">Buscar otro profesor</Boton>
            </Pantalla>
          }
        >
          <p>
            Si en las dos primeras clases ves que no encaja, nos lo dices y te
            damos{' '}
            <strong className="text-carbon">otro contacto sin volver a pagar</strong>
            . Solo tienes que elegir a quién.
          </p>
          <p>
            No hay que dar explicaciones ni justificar nada. Te preguntamos el
            motivo con una lista corta, y se lo contamos al profesor agrupado y
            sin decirle quién ha dicho qué.
          </p>
        </Paso>
      </ol>

      {/* --------------------------------------------------------------- */}
      <section className="mt-4 rounded-xl border border-gris-borde bg-gris-claro p-6">
        <h2 className="text-lg font-bold text-carbon">
          Qué hacemos con tus datos
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gris-medio">
          Tu nombre y tu teléfono se los damos al profesor cuando él acepta y tú
          pagas, y a nadie más. Tu correo es solo nuestro, para avisarte de lo que
          pasa con tu solicitud.{' '}
          <strong className="text-carbon">
            A los noventa días se borra todo solo
          </strong>
          , sin que tengas que pedirlo. Está contado entero en la{' '}
          <a className="underline underline-offset-4" href="/legal/privacidad">
            política de privacidad
          </a>
          .
        </p>
      </section>

      <div className="mt-8">
        <a
          href="/profesores"
          className="inline-block rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          Ver profesores
        </a>
      </div>

      <p className="mt-8 text-sm text-gris-medio">
        ¿Algo no encaja o no se entiende?{' '}
        <a className="underline underline-offset-4" href="/buzon">
          Cuéntanoslo aquí
        </a>
        . Y si das clase,{' '}
        <a className="underline underline-offset-4" href="/guia/profesor">
          ésta es tu guía
        </a>
        .
      </p>
    </main>
  );
}
