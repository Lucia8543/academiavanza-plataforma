'use client';

import { useState } from 'react';
import { contestarRecordatorio } from '@/app/solicitud/[token]/acciones';
import {
  MOTIVOS_SIN_PAGAR,
  PARA_LA_FAMILIA,
} from '@/shared/textos/motivos-cierre';

/**
 * «Al final no me hace falta, dejadlo».
 *
 * Un profesor que dijo que sí y una familia que no aparece es la peor
 * combinación de todas: él espera y nadie le dice nada. Este botón existe para
 * cerrar eso, y por eso está a la vista y no escondido.
 *
 * La pregunta que sale al pulsarlo es el único sitio donde se puede medir el
 * abandono más frecuente de todos: el de quien acepta el precio de las clases y
 * luego no paga el contacto. Hasta ahora esa gente se iba en silencio y no había
 * forma de saber si se caían por los diez euros o por cualquier otra cosa.
 *
 * Está en dos pasos a propósito. El primer botón sigue siendo una salida de un
 * clic —nadie se queda atrapado— y la pregunta llega después, cuando ya ha
 * decidido irse y contestarla no le cuesta la decisión.
 */

export function Dejarlo({ token }: { token: string }) {
  const [preguntando, setPreguntando] = useState(false);

  if (!preguntando) {
    return (
      <div className="mt-4 border-t border-verde-avanza pt-3">
        <button
          type="button"
          onClick={() => setPreguntando(true)}
          className="text-sm text-gris-medio underline underline-offset-4 transition hover:text-carbon"
        >
          Al final no me hace falta, dejadlo
        </button>
      </div>
    );
  }

  return (
    <form
      action={contestarRecordatorio}
      className="mt-4 border-t border-verde-avanza pt-3"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="va" value="no" />

      <fieldset>
        <legend className="text-sm font-semibold text-carbon">
          ¿Qué ha pasado?
        </legend>
        <p className="mt-1 mb-3 text-sm text-gris-medio">
          Nos ayuda a saber qué arreglar. No pagas nada y al profesor sólo le
          decimos que no sigues, sin quién eres.
        </p>

        <div className="flex flex-col gap-1">
          {MOTIVOS_SIN_PAGAR.map((motivo) => (
            <label
              key={motivo}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-carbon transition hover:bg-white"
            >
              <input
                type="radio"
                name="motivo"
                value={motivo}
                required
                className="h-4 w-4 accent-verde-avanza"
              />
              {PARA_LA_FAMILIA[motivo]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
        <button className="rounded-lg border border-gris-borde bg-white px-5 py-2.5 text-sm font-semibold text-carbon transition hover:bg-gris-claro">
          Dejarlo aquí
        </button>
        <button
          type="button"
          onClick={() => setPreguntando(false)}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gris-medio transition hover:text-carbon"
        >
          Volver
        </button>
      </div>
    </form>
  );
}
