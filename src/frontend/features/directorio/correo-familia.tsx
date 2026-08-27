'use client';

import { useActionState, useState } from 'react';
import {
  cambiarCorreo,
  type EstadoCorreo,
} from '@/app/solicitud/[token]/acciones';
import { sugerirCorreo } from '@/shared/schemas/correo-erratas';

/**
 * «Te hemos escrito a este correo. ¿Está bien?»
 *
 * Aparece en la página de seguimiento, donde la familia aterriza justo después
 * de enviar el formulario. Es el único momento en que se puede cazar un correo
 * mal tecleado: a partir de ahí no le llega nada, y quien no recibe nada no
 * sospecha que se equivocó, simplemente cree que nadie le ha contestado.
 *
 * Se enseña el correo tal y como lo escribió, no una versión bonita. Ver
 * «ana@gmial.com» escrito con sus letras es lo que hace saltar la alarma.
 */

const INICIAL: EstadoCorreo = {};

export function CorreoFamilia({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [estado, accion, guardando] = useActionState(cambiarCorreo, INICIAL);
  const [editando, setEditando] = useState(false);
  const [nuevo, setNuevo] = useState(email);

  const sugerencia = sugerirCorreo(email);

  if (estado.ok && !editando) {
    return (
      <p className="mt-4 rounded-lg border border-verde-avanza bg-verde-avanza-claro px-4 py-3 text-sm text-verde-avanza-oscuro">
        Corregido. Te escribiremos a {nuevo}.
      </p>
    );
  }

  if (!editando) {
    return (
      <div
        className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
          sugerencia
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-gris-borde bg-gris-claro text-carbon'
        }`}
      >
        <p>
          Te avisaremos a <strong>{email}</strong>.
          {sugerencia && (
            <>
              {' '}
              ¿Seguro? Quizá querías decir <strong>{sugerencia}</strong>.
            </>
          )}
        </p>
        <button
          onClick={() => {
            setNuevo(sugerencia ?? email);
            setEditando(true);
          }}
          className="mt-1 underline underline-offset-4"
        >
          {sugerencia ? 'Corregirlo' : 'No es ese, cambiarlo'}
        </button>
      </div>
    );
  }

  return (
    <form
      action={accion}
      className="mt-4 rounded-lg border border-gris-borde bg-gris-claro p-4"
    >
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-medium text-carbon" htmlFor="email">
        Tu correo
      </label>
      <input
        id="email"
        name="email"
        type="email"
        value={nuevo}
        onChange={(e) => setNuevo(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none"
      />
      {estado.error && (
        <p className="mt-1 text-sm text-error">{estado.error}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          disabled={guardando}
          className="rounded-lg bg-verde-avanza px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-lg border border-gris-borde px-4 py-2 text-sm text-carbon"
        >
          Dejarlo como está
        </button>
      </div>
    </form>
  );
}
