'use client';

import { useActionState, useState } from 'react';
import { reclamar, type EstadoVale } from '@/app/solicitud/[token]/acciones';
import {
  MOTIVOS_TRAS_HABLAR,
  PARA_LA_FAMILIA,
} from '@/shared/textos/motivos-cierre';

/**
 * Cómo dice una familia que no ha salido bien.
 *
 * Está escrito sin drama y sin culpar a nadie. Quien llega aquí ya ha pagado y
 * ya está molesto; lo último que necesita es un formulario que le pida
 * explicaciones o que le insinúe que se lo está inventando.
 *
 * Son dos caminos y no uno porque significan cosas distintas. «No conseguí
 * no me ha escrito» dice algo del profesor y cuenta para pausarle la ficha. «Ya
 * hablamos» no dice nada malo de nadie, no cuenta para nada, y es el único que
 * lleva pregunta detrás.
 *
 * La pregunta es de opciones cerradas y no un cuadro de texto. El motivo está
 * razonado en motivos-cierre.ts, pero el resumen es que un cuadro de texto aquí
 * se rellena poco y mal, y lo poco que se rellena puede traer el nombre del
 * alumno o su diagnóstico dentro.
 */

const INICIAL: EstadoVale = {};

export function ReclamarVale({
  token,
  puedeDecirSinContacto,
  diasQueFaltan,
}: {
  token: string;
  puedeDecirSinContacto: boolean;
  diasQueFaltan: number;
}) {
  const [estado, accion, enviando] = useActionState(reclamar, INICIAL);
  const [preguntando, setPreguntando] = useState(false);

  if (estado.ok) return null; // La página ya enseña el vale concedido.

  return (
    <div className="mt-4 rounded-xl border border-gris-borde bg-white p-5">
      <h4 className="font-semibold text-carbon">¿No ha salido bien?</h4>
      <p className="mt-1 text-sm text-gris-medio">
        Te damos otro contacto sin pagar de nuevo, al momento y sin esperar a
        que nadie te conteste.
      </p>

      {estado.error && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {estado.error}
        </p>
      )}

      {!preguntando ? (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <form action={accion} className="flex-1">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="motivo" value="sin-contacto" />
              <button
                disabled={enviando || !puedeDecirSinContacto}
                className="w-full rounded-lg border border-gris-borde px-4 py-3 text-sm font-semibold text-carbon transition hover:bg-gris-claro disabled:opacity-50"
              >
                No he conseguido que me escriba
              </button>
            </form>

            {/*
              Este no envía nada todavía: abre la pregunta. Es un botón normal y
              no un enlace porque no lleva a ninguna parte, y así quien navegue
              con el teclado lo encuentra donde espera.
            */}
            <button
              type="button"
              onClick={() => setPreguntando(true)}
              className="flex-1 rounded-lg border border-gris-borde px-4 py-3 text-sm font-semibold text-carbon transition hover:bg-gris-claro"
            >
              Hablamos pero no ha funcionado
            </button>
          </div>

          {!puedeDecirSinContacto && (
            <p className="mt-3 text-sm text-gris-medio">
              Para decir que no te ha escrito hay que esperar{' '}
              {diasQueFaltan === 1 ? 'un día más' : `${diasQueFaltan} días más`}.
              Muchos profesores tardan un día o dos en llamar.
            </p>
          )}
        </>
      ) : (
        <form action={accion} className="mt-4">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="motivo" value="no-funciono" />

          <fieldset>
            <legend className="text-sm font-semibold text-carbon">
              ¿Qué es lo que no ha encajado?
            </legend>
            <p className="mt-1 mb-3 text-sm text-gris-medio">
              Se lo contamos al profesor sin decirle quién eres, para que sepa
              por qué no seguisteis. Tu contacto gratis es el mismo elijas lo que
              elijas.
            </p>

            <div className="flex flex-col gap-1">
              {MOTIVOS_TRAS_HABLAR.map((motivo) => (
                <label
                  key={motivo}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-carbon transition hover:bg-gris-claro"
                >
                  <input
                    type="radio"
                    name="detalle"
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
            <button
              disabled={enviando}
              className="rounded-lg bg-verde-avanza px-5 py-3 text-sm font-semibold text-white transition hover:bg-verde-avanza-oscuro disabled:opacity-60"
            >
              {enviando ? 'Un momento…' : 'Darme otro contacto'}
            </button>
            <button
              type="button"
              onClick={() => setPreguntando(false)}
              className="rounded-lg px-5 py-3 text-sm font-semibold text-gris-medio transition hover:text-carbon"
            >
              Volver
            </button>
          </div>
        </form>
      )}

      <p className="mt-4 border-t border-gris-borde pt-3 text-xs text-gris-medio">
        Si has probado con varios y ninguno te encaja, escríbenos a{' '}
        <a
          href="mailto:info@academiavanza.es"
          className="underline underline-offset-4"
        >
          info@academiavanza.es
        </a>{' '}
        y te devolvemos el dinero.
      </p>
    </div>
  );
}
