import Link from 'next/link';
import { redirect } from 'next/navigation';
import { recuperarToken } from '@/backend/repositories/solicitudes';
import { normalizarTelefono } from '@/shared/schemas/telefono';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'He perdido mi enlace · AcademiAvanza',
  robots: { index: false, follow: false },
};

/**
 * Recuperación para quien ha perdido su enlace.
 *
 * Sin correo, la dirección privada es lo único que tiene la familia, y la gente
 * pierde enlaces. Aquí se recupera con dos datos que sólo tiene ella: el código
 * —que le queda en el concepto de su propio Bizum— y su teléfono.
 *
 * Hacen falta los dos. Con el código solo no se entra: es corto y adivinable, y
 * detrás hay un teléfono de una persona.
 */

/**
 * El freno de la recuperación.
 *
 * Con el código y el teléfono se abre la página privada de una familia, y hasta
 * ahora se podía probar sin límite. El código son cinco caracteres de un
 * alfabeto de treinta y uno, así que fijando un teléfono y probando códigos en
 * bucle se llega. Sin freno, ese bucle va a la velocidad de la red.
 *
 * Es el mismo mecanismo que ya protege el panel de administración: los primeros
 * intentos pasan sin notarse, y a partir del tercero cada fallo espera el doble
 * que el anterior, hasta un minuto. Una persona que se equivoca escribiendo su
 * código no lo percibe; un programa que prueba miles se queda en unos pocos.
 *
 * El contador vive en memoria y se pone a cero al reiniciar el servidor. No es
 * perfecto y no lo pretende: encarece el intento lo suficiente como para que no
 * compense, que es todo lo que puede hacer un freno.
 */
const fallosPorTelefono = new Map<string, number>();

function esperaTrasFallo(telefono: string): number {
  const fallos = fallosPorTelefono.get(telefono) ?? 0;
  if (fallos < 3) return 0;
  return Math.min(2 ** (fallos - 2), 60) * 1000;
}

async function recuperar(formulario: FormData) {
  'use server';

  const codigo = String(formulario.get('codigo') ?? '').trim();
  const telefono = normalizarTelefono(String(formulario.get('telefono') ?? ''));

  if (!codigo || !telefono) redirect('/solicitud?error=faltan');

  const espera = esperaTrasFallo(telefono);
  if (espera > 0) await new Promise((seguir) => setTimeout(seguir, espera));

  const token = await recuperarToken(codigo, telefono);

  // El mismo mensaje tanto si el código no existe como si el teléfono no
  // corresponde. Decir «ese código existe pero el teléfono no coincide» sería
  // regalar la mitad de la respuesta a quien esté probando códigos.
  //
  // Y el mensaje sigue siendo el mismo con freno o sin él: lo único que cambia
  // es cuánto tarda en llegar, que es lo que no le sirve a quien prueba en
  // bucle y no molesta a quien se ha equivocado una vez.
  if (!token) {
    fallosPorTelefono.set(telefono, (fallosPorTelefono.get(telefono) ?? 0) + 1);
    redirect('/solicitud?error=no-encontrada');
  }

  // Acertar limpia la cuenta: quien entra no es quien estaba probando.
  fallosPorTelefono.delete(telefono);

  redirect(`/solicitud/${token}`);
}

const claseCampo =
  'w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon ' +
  'focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza';

export default async function PaginaRecuperar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-azul-confianza">
        He perdido mi enlace
      </h1>
      <p className="mt-2 text-carbon">
        No pasa nada, se recupera. Necesitamos dos cosas, tu{' '}
        <strong>código</strong> y el <strong>teléfono</strong> con el que
        escribiste al profesor.
      </p>

      {/* Dónde está el código, en los tres sitios donde puede estar. Es la
          pregunta que va a hacer todo el mundo, así que se contesta antes de
          que la haga y no en un desplegable de ayuda. */}
      <div className="mt-4 rounded-lg border border-gris-borde bg-gris-claro px-4 py-3 text-sm text-carbon">
        <p className="font-medium">¿Dónde está mi código?</p>
        <p className="mt-1">
          Son cinco letras y números, tipo <strong>27XJS</strong>. Lo tienes en
          el correo que te mandamos al escribir al profesor. Busca
          «AcademiAvanza» en tu buzón, y mira también el spam. Y si ya has
          pagado, es lo que pusiste en el concepto del Bizum.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error"
        >
          {error === 'faltan'
            ? 'Rellena los dos campos.'
            : 'No hemos encontrado nada con esos datos. Revisa que el código esté bien copiado y que sea el mismo teléfono con el que escribiste.'}
        </p>
      )}

      <form action={recuperar} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-carbon" htmlFor="codigo">
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            placeholder="27XJS"
            autoCapitalize="characters"
            className={`${claseCampo} font-mono uppercase tracking-widest`}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-carbon"
            htmlFor="telefono"
          >
            Tu teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            placeholder="600 123 456"
            className={claseCampo}
          />
        </div>

        <button className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro">
          Entrar
        </button>
      </form>

      {/*
        La salida para quien tampoco encuentra el código.
        Sin esto, esa persona se queda fuera para siempre y con diez euros
        pagados. Se resuelve escribiendo un correo, que es intervención manual
        de Lucía —pero aquí es lo correcto: el caso es raro, y la alternativa
        automática sería dejar entrar sólo con el teléfono, que es justo lo que
        no se puede hacer.
      */}
      <p className="mt-8 border-t border-gris-borde pt-6 text-sm text-gris-medio">
        ¿Tampoco encuentras el código? Escríbenos a{' '}
        <a
          href="mailto:info@academiavanza.es"
          className="text-carbon underline underline-offset-4"
        >
          info@academiavanza.es
        </a>{' '}
        con el nombre del profesor al que escribiste y tu teléfono, y te lo
        buscamos nosotros.
      </p>

      {/* Esta página es de familias, pero se llama «he perdido mi enlace» y es
          la que sale en el pie de todas las pantallas. Un profesor que pierda
          el suyo va a acabar aquí, y sin esta línea se quedaría intentando
          entrar con un código que nunca ha tenido. */}
      <p className="mt-4 text-sm text-gris-medio">
        ¿Eres profesor y lo que has perdido es el enlace de tu ficha?{' '}
        <Link
          href="/mi-ficha"
          className="text-carbon underline underline-offset-4"
        >
          Se recupera aquí
        </Link>
        , con tu correo.
      </p>
    </main>
  );
}
