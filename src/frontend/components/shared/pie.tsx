import Link from 'next/link';

/**
 * El pie de página.
 *
 * Va en todas las pantallas porque los textos legales tienen que ser accesibles
 * desde cualquiera de ellas, no sólo desde la portada. Y porque la frase de
 * arriba —lo que la plataforma hace y lo que no— es la que evita que alguien se
 * lleve una idea equivocada de lo que ha contratado.
 */

const enlaces = [
  { href: '/profesores', texto: 'Buscar profesor' },
  { href: '/registro', texto: 'Publicar mi ficha' },
  /*
   * «He perdido mi enlace» y no «Recuperar mi solicitud».
   *
   * Nadie piensa «voy a recuperar mi solicitud». Piensa «he perdido el enlace»,
   * y busca esas palabras. Un enlace del pie sólo sirve si está escrito con las
   * palabras que la persona ya tiene en la cabeza.
   */
  { href: '/solicitud', texto: 'He perdido mi enlace' },
];

const legales = [
  { href: '/legal/aviso-legal', texto: 'Aviso legal' },
  { href: '/legal/privacidad', texto: 'Privacidad' },
  { href: '/legal/cookies', texto: 'Cookies' },
];

export function Pie() {
  return (
    <footer className="mt-20 border-t border-gris-borde bg-gris-claro">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex max-w-2xl items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            className="hidden h-10 w-10 shrink-0 sm:block"
          />
          <p className="text-sm leading-relaxed text-gris-medio">
            <span className="font-semibold text-carbon">AcademiAvanza</span>{' '}
            pone en contacto a familias y profesores particulares en Madrid. No
            damos clases, no empleamos a los profesores y no intervenimos en el
            precio ni en los horarios. El colegio y los estudios que aparecen en
            cada ficha los declara el propio profesor.
          </p>
        </div>

        <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="text-carbon underline underline-offset-4"
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gris-medio">
          {legales.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="underline underline-offset-4"
            >
              {e.texto}
            </Link>
          ))}
          <a
            href="mailto:info@academiavanza.es"
            className="underline underline-offset-4"
          >
            info@academiavanza.es
          </a>
        </nav>
      </div>
    </footer>
  );
}
