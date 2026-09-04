'use client';

import { useState } from 'react';
import { retirar } from '@/app/solicitud/[token]/acciones';
import {
  MOTIVOS_SIN_PAGAR,
  PARA_LA_FAMILIA,
} from '@/shared/textos/motivos-cierre';

/**
 * «Retirar esta solicitud», para las que todavía no ha contestado nadie.
 *
 * POR QUÉ EXISTE
 *
 * Escribir es gratis, así que una familia con prisa escribe a tres o cuatro
 * profesores, y hasta ahora **no tenía forma de cerrar los que le sobraban**.
 * Sólo podía decir que no después de que alguien aceptara, que es un paso tarde:
 * para entonces ya hay un cobro de diez euros pedido por un contacto que no
 * quiere.
 *
 * Pasó de verdad, con una madre que encontró profesora el mismo día y se
 * encontró con tres conversaciones abiertas que no sabía apagar. Acabó
 * resolviéndose por WhatsApp y con Lucía cerrando solicitudes a mano, que es la
 * clase de cosa que este proyecto existe para no tener.
 *
 * ES CASI EL MISMO COMPONENTE QUE `Dejarlo`, Y NO SE HAN FUNDIDO
 *
 * Se parecen en la forma —botón discreto, luego la pregunta— y son dos momentos
 * distintos del recorrido. Aquél sale cuando el profesor ya ha dicho que sí y la
 * familia decide no pagar; éste sale antes de que nadie conteste. Cambian los
 * textos, el aviso que recibe el profesor y lo que significa el motivo.
 *
 * Juntarlos en uno con tres parámetros de comportamiento habría dejado un
 * componente que hay que leer dos veces para saber en cuál de los dos casos
 * estás. Se han quedado separados a conciencia; si un día divergen más, mejor.
 */

export function RetirarSolicitud({
  token,
  nombreProfesor,
}: {
  token: string;
  nombreProfesor: string;
}) {
  const [preguntando, setPreguntando] = useState(false);

  if (!preguntando) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setPreguntando(true)}
          className="text-sm text-gris-medio underline underline-offset-4 transition hover:text-carbon"
        >
          Retirar esta solicitud
        </button>
      </div>
    );
  }

  return (
    <form action={retirar} className="mt-4 rounded-lg bg-gris-claro p-4">
      <input type="hidden" name="token" value={token} />

      <fieldset>
        <legend className="text-sm font-semibold text-carbon">
          ¿Retiramos tu solicitud a {nombreProfesor}?
        </legend>
        <p className="mt-1 mb-3 text-sm text-gris-medio">
          Le avisamos de que ya no hace falta que conteste. No pagas nada, no le
          perjudica en nada, y puedes volver a escribirle cuando quieras.
        </p>

        {/*
          El motivo es opcional aquí, y en `Dejarlo` es obligatorio.

          Allí la familia está abandonando algo que ya funcionaba a medias y la
          pregunta es la única forma de saber por qué. Aquí lo más probable es
          que haya encontrado a otra persona y esté cerrando tres pestañas
          seguidas. Obligarla a contestar tres veces lo mismo la convence de no
          cerrar ninguna, que es lo contrario de lo que buscamos.
        */}
        <p className="mb-2 text-sm text-gris-medio">
          Si quieres, dinos por qué. Nos ayuda a saber qué arreglar.
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
                className="h-4 w-4 accent-verde-avanza"
              />
              {PARA_LA_FAMILIA[motivo]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
        <button className="rounded-lg border border-gris-borde bg-white px-5 py-2.5 text-sm font-semibold text-carbon transition hover:bg-white/70">
          Retirarla
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
