'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * «Guarda esta página».
 *
 * Esta caja es la que evita el peor final posible de una solicitud: una familia
 * que ha pagado diez euros, cierra la pestaña y ya no puede volver a entrar. No
 * hay contraseña ni cuenta —a propósito, para no obligar a nadie a registrarse—
 * así que la dirección es la llave, y una llave se pierde.
 *
 * Antes esto era un párrafo que decía «añádela a marcadores». Media frase de
 * jerga: hay padres que no saben lo que es un marcador, y quien lo sabe tampoco
 * lo hace porque leer no es lo mismo que actuar. Así que aquí hay botones que
 * hacen la cosa, y no instrucciones para que la haga otro.
 *
 * El orden no es casual. Primero WhatsApp, que es donde esta gente guarda todo
 * lo que le importa y donde sabe buscar; después copiar; y el código el último,
 * porque es el plan C y no conviene que parezca el plan A.
 */

export function GuardarEnlace({
  codigo,
  email,
}: {
  codigo: string;
  /** Dónde le hemos mandado el enlace, o null si no dejó correo. */
  email: string | null;
}) {
  const [copiado, setCopiado] = useState(false);

  /*
   * La dirección se lee al pulsar y no al pintar.
   *
   * En el servidor no existe `window`, así que leerla mientras se dibuja daría
   * una página distinta en el servidor y en el navegador. Y de paso sale gratis
   * exacta: es literalmente la página en la que está.
   */
  function enlace() {
    return typeof window === 'undefined' ? '' : window.location.href;
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 4000);
    } catch {
      // Sin permiso de portapapeles no hay nada que hacer desde aquí, pero
      // tampoco hay que dejarla sin salida: para eso está el código de abajo.
      setCopiado(false);
    }
  }

  function porWhatsApp() {
    const texto = `Mi solicitud en AcademiAvanza (código ${codigo}): ${enlace()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(texto)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <div className="mt-6 rounded-xl border-2 border-azul-confianza bg-white p-5">
      <h2 className="font-bold text-azul-confianza">Guarda esta página</h2>
      <p className="mt-1 text-sm text-carbon">
        Es tu sitio para ver cómo va todo, pagar cuando toque y ver el teléfono
        del profesor. No tiene contraseña:{' '}
        <strong>si pierdes el enlace, pierdes la entrada</strong>. Tardas diez
        segundos en dejarlo a mano.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={porWhatsApp}
          className="flex-1 rounded-lg bg-verde-avanza px-4 py-3 text-sm font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          Mandármelo por WhatsApp
        </button>
        <button
          type="button"
          onClick={copiar}
          className="flex-1 rounded-lg border border-gris-borde px-4 py-3 text-sm font-semibold text-carbon transition hover:bg-gris-claro"
        >
          {copiado ? '¡Copiado!' : 'Copiar el enlace'}
        </button>
      </div>

      {/* Lo de WhatsApp necesita una línea de explicación: quien lo pulsa espera
          que pase algo automático y lo que sale es la lista de contactos. */}
      <p className="mt-2 text-xs text-gris-medio">
        WhatsApp te preguntará a quién se lo mandas. Puedes mandártelo a ti
        misma, o a quien lleve esto en casa.
      </p>

      {email && (
        <p className="mt-4 border-t border-gris-borde pt-3 text-sm text-carbon">
          También te lo hemos mandado por correo a{' '}
          <strong className="break-all">{email}</strong>. Si no lo ves, mira en
          la carpeta de spam.
        </p>
      )}

      <div className="mt-4 border-t border-gris-borde pt-3">
        <p className="text-sm text-carbon">
          Y si aun así lo pierdes, tu código es:
        </p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-azul-confianza">
          {codigo}
        </p>
        <p className="mt-1 text-sm text-gris-medio">
          Con ese código y tu teléfono vuelves a entrar desde{' '}
          <Link
            href="/solicitud"
            className="font-medium text-carbon underline underline-offset-4"
          >
            He perdido mi enlace
          </Link>
          , abajo del todo en cualquier página. Es también el código que pondrás
          en el Bizum.
        </p>
      </div>
    </div>
  );
}
