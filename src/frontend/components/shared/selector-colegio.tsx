'use client';

import { useMemo, useState } from 'react';

/**
 * Buscador de colegios.
 *
 * Sustituye al desplegable. Con sesenta y tantos centros, una lista desplegable
 * obliga a recorrerla entera; aquí se escriben dos o tres letras y aparece.
 *
 * La búsqueda ignora acentos y mayúsculas: quien escribe «angel» encuentra
 * «Santo Ángel», y quien escribe «maravillas» encuentra «La Salle Maravillas»
 * aunque no empiece por ahí.
 */

export type ColegioOpcion = {
  id: string;
  nombre: string;
  nombre_corto: string | null;
  municipio: string | null;
};

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const MAXIMO_RESULTADOS = 8;

export function SelectorColegio({
  colegios,
  colegioId,
  colegioOtro,
  onElegir,
  onEscribir,
}: {
  colegios: ColegioOpcion[];
  colegioId: string;
  colegioOtro: string;
  onElegir: (id: string) => void;
  onEscribir: (texto: string) => void;
}) {
  const [busqueda, setBusqueda] = useState('');

  const elegido = colegios.find((c) => c.id === colegioId);
  const etiqueta = (c: ColegioOpcion) => c.nombre_corto ?? c.nombre;

  const resultados = useMemo(() => {
    const q = normalizar(busqueda);
    if (q.length < 2) return [];

    return colegios
      .filter((c) => {
        const texto = normalizar(`${etiqueta(c)} ${c.municipio ?? ''}`);
        return texto.includes(q);
      })
      .slice(0, MAXIMO_RESULTADOS);
  }, [busqueda, colegios]);

  const sinResultados = normalizar(busqueda).length >= 3 && resultados.length === 0;

  // Ya hay uno elegido: se muestra y se puede cambiar.
  if (elegido) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-verde-avanza bg-verde-avanza-claro px-4 py-3">
        <span className="font-medium text-verde-avanza-oscuro">
          {etiqueta(elegido)}
          {elegido.municipio && (
            <span className="font-normal text-gris-medio">
              {' '}
              · {elegido.municipio}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            onElegir('');
            setBusqueda('');
          }}
          className="shrink-0 text-sm font-medium text-verde-avanza underline underline-offset-4"
        >
          Cambiar
        </button>
      </div>
    );
  }

  // Escrito a mano porque no aparecía en la lista.
  if (colegioOtro) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gris-borde bg-gris-claro px-4 py-3">
        <span className="font-medium text-carbon">{colegioOtro}</span>
        <button
          type="button"
          onClick={() => {
            onEscribir('');
            setBusqueda('');
          }}
          className="shrink-0 text-sm font-medium text-verde-avanza underline underline-offset-4"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        className="w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza"
        placeholder="Escribe las primeras letras, mon, sale, ángel…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {resultados.length > 0 && (
        <ul className="mt-2 divide-y divide-gris-borde overflow-hidden rounded-lg border border-gris-borde">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onElegir(c.id)}
                className="flex w-full items-baseline gap-2 px-4 py-3 text-left hover:bg-verde-avanza-claro"
              >
                <span className="font-medium text-carbon">{etiqueta(c)}</span>
                {c.municipio && (
                  <span className="text-sm text-gris-medio">{c.municipio}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {sinResultados && (
        <div className="mt-2 rounded-lg border border-gris-borde bg-gris-claro p-4">
          <p className="text-sm text-carbon">
            No tenemos ningún colegio que se llame así.
          </p>
          <button
            type="button"
            onClick={() => onEscribir(busqueda.trim())}
            className="mt-2 rounded-lg bg-verde-avanza px-4 py-2 text-sm font-semibold text-white hover:bg-verde-avanza-oscuro"
          >
            Usar «{busqueda.trim()}» como mi colegio
          </button>
          <p className="mt-2 text-sm text-gris-medio">
            Lo añadiremos al catálogo al revisar tu ficha. Pon también el
            municipio si puedes.
          </p>
        </div>
      )}

      {normalizar(busqueda).length > 0 && normalizar(busqueda).length < 2 && (
        <p className="mt-2 text-sm text-gris-medio">
          Escribe al menos dos letras.
        </p>
      )}
    </div>
  );
}
