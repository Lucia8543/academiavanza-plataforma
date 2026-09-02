'use client';

import Link from 'next/link';

/**
 * La pantalla que se ve cuando algo se rompe de verdad.
 *
 * No había ninguna, y el hueco no era teórico: una profesora rellenó el alta
 * entera, le dio a enviar mientras se estaba desplegando una versión nueva, y
 * la petición se quedó apuntando a un formulario que ya no existía. Por su
 * parte no pasó nada. Ni error, ni confirmación, ni pista. Escribió semanas
 * después preguntando por qué no le llegaba el enlace de su ficha, y la ficha
 * nunca había existido.
 *
 * Ese caso concreto no se puede evitar del todo: cada despliegue sustituye la
 * instancia, y quien tenía la página abierta se queda con un formulario
 * huérfano. Lo que sí se puede es que no sea invisible, y que la salida —
 * recargar y volver a enviar— esté escrita donde ella está mirando.
 *
 * Va en castellano y sin detalles técnicos a propósito. Quien llega aquí es
 * una madre buscando profesor o un universitario dándose de alta, no alguien
 * que vaya a leer una traza de errores.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-azul-confianza">
        Algo se ha roto por nuestra parte
      </h1>

      <p className="mt-4 text-carbon">
        No es culpa tuya y no has hecho nada mal. Lo más probable es que
        hubieras dejado esta página abierta un rato y mientras tanto hayamos
        publicado una versión nueva.
      </p>

      <p className="mt-3 text-carbon">
        <strong>Si estabas enviando algo, no se ha guardado.</strong> Vuelve a
        intentarlo, que esta vez debería ir.
      </p>

      <div className="mt-8 space-y-3">
        <button
          onClick={reset}
          className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          Volver a intentarlo
        </button>

        <Link
          href="/"
          className="block rounded-lg border border-gris-borde px-6 py-3 font-semibold text-carbon transition hover:bg-gris-claro"
        >
          Ir al inicio
        </Link>
      </div>

      <p className="mt-8 border-t border-gris-borde pt-6 text-sm text-gris-medio">
        Si vuelve a pasar, escríbenos a{' '}
        <a
          href="mailto:info@academiavanza.es"
          className="text-carbon underline underline-offset-4"
        >
          info@academiavanza.es
        </a>{' '}
        contando qué estabas haciendo, y lo miramos.
      </p>
    </main>
  );
}
