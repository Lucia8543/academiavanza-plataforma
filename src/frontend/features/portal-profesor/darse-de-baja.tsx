'use client';

import { useActionState, useState } from 'react';
import {
  darseDeBaja,
  type EstadoBaja,
} from '@/app/mi-ficha/[token]/acciones';

/**
 * Darse de baja, al final del panel y detrás de dos pasos.
 *
 * El sitio y la forma son parte del arreglo, no decoración. Va al final, sin
 * color de alarma y sin invitar a pulsarlo, porque casi nadie que abre este
 * panel viene a borrarse. Pero está, y se llama lo que es: la política de
 * privacidad promete esto por escrito y durante un tiempo no existía.
 *
 * Dos pasos, y el segundo obliga a escribir una palabra. No es desconfianza:
 * esta página se abre desde un enlace de correo, muchas veces en el móvil, y
 * detrás del botón hay un borrado sin vuelta atrás.
 */

const INICIAL: EstadoBaja = {};

export function DarseDeBaja({ token }: { token: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState(darseDeBaja, INICIAL);

  if (!abierto) {
    return (
      <div className="mt-10 border-t border-gris-borde pt-6">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-sm text-gris-medio underline underline-offset-4 hover:text-carbon"
        >
          Quiero darme de baja y que borréis mi ficha
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-xl border border-gris-borde bg-gris-claro/40 p-5">
      <h2 className="font-bold text-carbon">Darte de baja</h2>

      <p className="mt-2 text-sm leading-relaxed text-carbon">
        Se borra tu ficha y dejas de aparecer en el directorio. Se borran tu
        nombre, tu correo, tu teléfono y todo lo que escribiste. El enlace de
        esta página deja de funcionar en cuanto lo confirmes, así que guarda
        antes lo que quieras conservar.
      </p>

      <p className="mt-2 text-sm leading-relaxed text-carbon">
        Si alguna familia llegó a pagar por tu contacto, se conserva únicamente
        la fecha y el importe, sin tu nombre: es lo que acredita que ese dinero
        entró, y no podemos destruirlo.
      </p>

      <p className="mt-2 text-sm leading-relaxed text-carbon">
        Las solicitudes que tengas sin contestar se cierran, y a esas familias
        les avisamos de que no vas a poder.
      </p>

      <p className="mt-3 text-sm font-medium text-carbon">
        Esto no se puede deshacer. Si sólo quieres dejar de recibir solicitudes
        una temporada, cierra esto y usa «Pausar mi ficha»: no borra nada y
        puedes volver cuando quieras.
      </p>

      <form action={accion} className="mt-4">
        <input type="hidden" name="token" value={token} />

        <label
          htmlFor="confirmacion"
          className="block text-sm font-medium text-carbon"
        >
          Para confirmar, escribe <strong>BAJA</strong>
        </label>
        <input
          id="confirmacion"
          name="confirmacion"
          autoComplete="off"
          className="mt-1 w-40 rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza"
        />

        {estado.error && (
          <p className="mt-2 rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error">
            {estado.error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={enviando}
            className="rounded-lg bg-error px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {enviando ? 'Borrando…' : 'Borrar mi ficha para siempre'}
          </button>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-lg border border-gris-borde px-5 py-2.5 text-sm font-semibold text-carbon hover:bg-gris-claro"
          >
            Mejor no
          </button>
        </div>
      </form>
    </div>
  );
}
