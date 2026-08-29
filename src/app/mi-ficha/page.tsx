import Link from 'next/link';
import { redirect } from 'next/navigation';
import { reenviarEnlaceDelPanel } from '@/backend/services/acceso-profesor';
import { CamposTrampa } from '@/frontend/components/shared/campos-trampa';
import { oler } from '@/shared/schemas/trampa-bots';

/**
 * «He perdido el enlace de mi ficha», para profesores.
 *
 * La equivalente de las familias existía desde el principio; ésta no, y el
 * hueco se notaba en una frase de la página de error: «escríbenos a
 * info@academiavanza.es y te mandamos otro». Eso es Lucía buscando en la base
 * de datos, uno por uno, cada vez que alguien borra un correo. Con ella fuera
 * de España durante meses, ese goteo no lo atiende nadie.
 *
 * **Se resuelve con el correo y nada más.** No hay contraseña que pedir, y
 * tampoco hace falta: el enlace se mandó a ese buzón y sólo a ese buzón, así
 * que quien lo controla ya podía leerlo. Esto no abre ninguna puerta nueva.
 *
 * La dirección es `/mi-ficha` a secas, la misma que `/mi-ficha/<enlace>` sin la
 * parte de después. Es donde va a probar el que se quede a medias copiando el
 * enlace, que es justo la persona a la que hay que rescatar.
 */

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'He perdido el enlace de mi ficha · AcademiAvanza',
  description: 'Te lo volvemos a mandar a tu correo.',
  robots: { index: false, follow: false },
};

async function reenviar(formulario: FormData) {
  'use server';

  const email = String(formulario.get('email') ?? '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    redirect('/mi-ficha?error=1');
  }

  /*
   * Si huele a guion, se enseña la misma pantalla de siempre y no se manda
   * nada. Decirle «te hemos pillado» sólo sirve para que el siguiente venga
   * mejor preparado.
   */
  if (!oler(formulario)) {
    await reenviarEnlaceDelPanel(email);
  }

  redirect('/mi-ficha?enviado=1');
}

const claseCampo =
  'w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon ' +
  'focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza';

export default async function PaginaEnlacePerdido({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const { enviado, error } = await searchParams;

  if (enviado) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-extrabold text-azul-confianza">
          Mira tu correo
        </h1>

        {/*
          El mismo mensaje exista o no esa dirección, y sin ningún matiz que
          permita distinguirlo. Un formulario que contesta «esa dirección no
          está registrada» es una forma cómoda de comprobar quién da clase
          aquí, y quien da clase aquí suele ser menor de veinticinco años con
          su colegio escrito en una ficha pública.
        */}
        <p className="mt-3 leading-relaxed text-carbon">
          Si hay una ficha con ese correo, acabas de recibir el enlace. Es el
          mismo de siempre, no uno nuevo.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-gris-medio">
          Si no lo ves en un par de minutos, <strong>mira en el spam</strong>: es
          donde acaba casi siempre la primera vez. Y comprueba que la dirección
          que has escrito es la misma con la que publicaste la ficha.
        </p>

        <p className="mt-8 border-t border-gris-borde pt-6 text-sm text-gris-medio">
          ¿Sigues sin poder entrar? Escríbenos a{' '}
          <a
            href="mailto:info@academiavanza.es"
            className="text-carbon underline underline-offset-4"
          >
            info@academiavanza.es
          </a>{' '}
          y lo miramos.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-azul-confianza">
        He perdido el enlace de mi ficha
      </h1>

      <p className="mt-3 leading-relaxed text-carbon">
        No pasa nada. Escribe el correo con el que publicaste la ficha y te
        mandamos el enlace otra vez.
      </p>

      <p className="mt-3 text-sm leading-relaxed text-gris-medio">
        Aquí no hay contraseñas: ese enlace es tu entrada, y es también desde
        donde puedes cambiar tus datos, pausar la ficha o darte de baja.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error"
        >
          Escribe un correo válido.
        </p>
      )}

      <form action={reenviar} className="mt-6 space-y-5">
        <CamposTrampa />

        <div>
          <label
            className="block text-sm font-medium text-carbon"
            htmlFor="email"
          >
            Tu correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            className={claseCampo}
          />
        </div>

        <button className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro">
          Mandarme el enlace
        </button>
      </form>

      {/* Quien llega aquí sin tener ficha se ha equivocado de sitio, y lo más
          probable es que sea una familia. Esta línea le saca en un vistazo. */}
      <p className="mt-8 border-t border-gris-borde pt-6 text-sm text-gris-medio">
        ¿Todavía no tienes ficha?{' '}
        <a href="/registro" className="text-carbon underline underline-offset-4">
          Publícala aquí
        </a>
        . Y si lo que buscas es tu solicitud como familia,{' '}
        <Link
          href="/solicitud"
          className="text-carbon underline underline-offset-4"
        >
          se recupera aquí
        </Link>
        .
      </p>
    </main>
  );
}
