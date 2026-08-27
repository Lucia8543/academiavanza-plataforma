import Link from 'next/link';

export const metadata = { title: 'No encontrado · AcademiAvanza' };

/**
 * La pantalla que se ve cuando una dirección no lleva a ninguna parte.
 *
 * Aquí no cae quien se ha equivocado tecleando: cae quien ha copiado mal un
 * enlace largo, o quien vuelve a su página de seguimiento tres meses después,
 * cuando su solicitud ya se ha borrado. Son personas que estaban buscando algo
 * concreto y suyo, así que la página tiene que ofrecerles la salida y no un
 * error en inglés.
 */
export default function NoEncontrado() {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-azul-confianza">
        Aquí no hay nada
      </h1>

      <p className="mt-4 text-carbon">
        Esta dirección no existe o ha dejado de existir. Suele pasar por dos
        motivos: el enlace se copió a medias, o han pasado más de tres meses y
        la solicitud ya se ha borrado, que es lo que hacemos con los datos de
        las familias.
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href="/solicitud"
          className="block rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          He perdido mi enlace
        </Link>
        <p className="text-sm text-gris-medio">
          Si escribiste a un profesor, entras con tu código y tu teléfono.
        </p>

        <Link
          href="/profesores"
          className="mt-4 block rounded-lg border border-gris-borde px-6 py-3 font-semibold text-carbon transition hover:bg-gris-claro"
        >
          Ver el directorio
        </Link>
      </div>

      <p className="mt-10 text-sm text-gris-medio">
        Si eres profesor y has perdido el enlace de tu ficha, escríbenos a{' '}
        <a
          href="mailto:info@academiavanza.es"
          className="underline underline-offset-4"
        >
          info@academiavanza.es
        </a>{' '}
        y te mandamos otro.
      </p>
    </main>
  );
}
