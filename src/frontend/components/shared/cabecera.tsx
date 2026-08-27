import Link from 'next/link';

/**
 * La cabecera de todas las páginas.
 *
 * Existe por dos motivos, y el segundo es el importante.
 *
 * El primero es de navegación: hasta ahora, quien entraba al directorio no
 * tenía ninguna forma de volver a la portada salvo borrar la dirección a mano.
 *
 * El segundo es que **un profesor y una familia entran buscando cosas
 * opuestas**, y la web entera está escrita para la familia. El profesor que
 * llega —normalmente porque alguien le ha pasado el enlace por WhatsApp— se
 * encontraba con una portada que le habla de precios, de colegios y de cómo
 * pagar, y tenía que bajar hasta el final del todo para descubrir que lo suyo
 * era gratis. La mayoría no baja: cierra.
 *
 * Por eso el enlace de profesor está aquí arriba, visible desde el primer
 * segundo y en todas las páginas, y no escondido al fondo de una sola.
 *
 * No se marca cuál es la página actual a propósito: son dos puertas, no un
 * menú donde uno esté «dentro» de una sección.
 */
export function Cabecera() {
  return (
    <header className="border-b border-gris-borde bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-extrabold tracking-tight text-azul-confianza">
            Academi<span className="text-verde-avanza">Avanza</span>
          </span>
        </Link>

        {/*
          Dice «Soy profesor» y no «Publicar mi ficha». La diferencia importa:
          quien llega no está pensando en publicar nada, está comprobando si
          este sitio va con él. Se identifica antes de decidir.

          Y lleva «gratis» dentro del propio botón, porque es la única palabra
          que hace que un profesor siga leyendo. Lo primero que se pregunta
          cualquiera que ve una plataforma nueva es cuánto le van a cobrar.
        */}
        <Link
          href="/registro"
          className="shrink-0 rounded-lg border border-verde-avanza px-3 py-2 text-sm font-semibold text-verde-avanza-oscuro transition hover:bg-verde-avanza-claro sm:px-4"
        >
          Soy profesor
          <span className="hidden sm:inline"> · publicar gratis</span>
        </Link>
      </div>
    </header>
  );
}
