'use client';

import { useState } from 'react';
import { formatearTelefono } from '@/shared/schemas/telefono';

/**
 * Los profesores a los que les queda un día antes de perder la solicitud.
 *
 * **Nada de esto es necesario para que la plataforma funcione.** Al profesor ya
 * se le ha avisado dos veces por correo y por el móvil, la solicitud se cierra
 * sola al cumplirse el plazo que eligió la familia, y a ella se le manda un
 * correo explicándoselo. Si esta pantalla no la abre nadie durante seis meses,
 * no pasa nada.
 *
 * Existe porque un mensaje de WhatsApp escrito por una persona rescata a un
 * chaval de veinte años que no abre el correo, y mientras haya alguien aquí para
 * mandarlo, merece la pena. Cuando no lo haya, la lista se queda sin abrir y el
 * circuito automático sigue igual.
 *
 * No hay integración con WhatsApp ni se manda nada desde aquí: se copia un texto
 * y se pega donde cada uno quiera. Lo que se copia no lleva el nombre de la
 * familia ni su mensaje, sólo el curso, porque el profesor todavía no ha
 * aceptado y esos datos no son suyos.
 */

type Fila = {
  codigo: string;
  nivel: string;
  diasEsperando: number;
  diasQueQuedan: number;
  profesor: string;
  telefono: string | null;
  enlace: string;
};

function mensaje(fila: Fila, base: string): string {
  const plazo =
    fila.diasQueQuedan === 0
      ? 'hoy se cierra sola'
      : fila.diasQueQuedan === 1
        ? 'mañana se cierra sola'
        : `se cierra sola en ${fila.diasQueQuedan} días`;

  return [
    `Hola ${fila.profesor.split(' ')[0]}, soy de AcademiAvanza.`,
    '',
    `Tienes una familia esperando respuesta para clases de ${fila.nivel} desde hace ${fila.diasEsperando} días, y ${plazo}.`,
    '',
    'Si no puedes cogerla no pasa nada, pero dilo y así ella puede buscar a otra persona:',
    `${base}${fila.enlace}`,
  ].join('\n');
}

export function RescatePorWhatsApp({
  filas,
  base,
}: {
  filas: Fila[];
  base: string;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);

  if (filas.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-carbon">
        A punto de perderse
        <span className="ml-2 rounded-full bg-aviso px-2 py-0.5 text-sm text-white">
          {filas.length}
        </span>
      </h2>

      <p className="mt-1 text-sm text-gris-medio">
        Llevan días sin contestar y ya se les ha recordado por correo y al móvil.
        Esto es por si quieres darles un toque tú; si no lo haces, se cierran
        solas y a la familia se le avisa igual.
      </p>

      <div className="mt-4 space-y-3">
        {filas.map((f) => (
          <article
            key={f.codigo}
            className="rounded-xl border border-gris-borde bg-white p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-bold text-azul-confianza">{f.profesor}</h3>
              <span
                className={
                  f.diasQueQuedan <= 1
                    ? 'text-sm font-medium text-error'
                    : 'text-sm text-gris-medio'
                }
              >
                {f.diasQueQuedan === 0
                  ? 'se cierra hoy'
                  : f.diasQueQuedan === 1
                    ? 'se cierra mañana'
                    : `quedan ${f.diasQueQuedan} días`}
              </span>
            </div>

            <p className="mt-1 text-sm text-gris-medio">
              {f.nivel} · esperando {f.diasEsperando} días
              {f.telefono
                ? ` · ${formatearTelefono(f.telefono)}`
                : ' · sin teléfono'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  // Si el navegador deniega el portapapeles, se avisa en el
                  // propio botón. Callarse dejaría a alguien pegando nada.
                  try {
                    await navigator.clipboard.writeText(mensaje(f, base));
                    setCopiado(f.codigo);
                  } catch {
                    setCopiado(`${f.codigo}-error`);
                  }
                  setTimeout(() => setCopiado(null), 2500);
                }}
                className="rounded-lg border border-gris-borde px-4 py-2 text-sm font-semibold text-carbon hover:bg-gris-claro"
              >
                {copiado === f.codigo
                  ? 'Copiado'
                  : copiado === `${f.codigo}-error`
                    ? 'No se ha podido copiar'
                    : 'Copiar mensaje'}
              </button>

              {f.telefono && (
                <a
                  href={`https://wa.me/34${f.telefono.replace(/\D/g, '').slice(-9)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gris-borde px-4 py-2 text-sm font-semibold text-carbon hover:bg-gris-claro"
                >
                  Abrir WhatsApp
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
