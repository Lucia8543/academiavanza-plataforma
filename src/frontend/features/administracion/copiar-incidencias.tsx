'use client';

import { useState } from 'react';

/**
 * El botón que convierte cincuenta quejas sueltas en algo accionable.
 *
 * Es la pieza que hace que este buzón sirva de algo. Leer las incidencias una a
 * una en un panel no lleva a ningún arreglo: se leen, se asiente y se cierra la
 * pestaña. En un solo texto sí se pueden repasar de golpe y pegar donde haga
 * falta para que salgan los cambios de ahí.
 *
 * El texto lo prepara el servidor y llega ya montado. No lleva ningún correo
 * dentro: quien dejó el suyo lo dejó para que le contestaran, no para acabar en
 * un fichero que se copia y se pega.
 */
export function CopiarIncidencias({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<'listo' | 'copiado' | 'error'>('listo');

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setEstado('copiado');
          } catch {
            setEstado('error');
          }
          setTimeout(() => setEstado('listo'), 3000);
        }}
        className="rounded-lg bg-azul-confianza px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        {estado === 'copiado'
          ? 'Copiado'
          : estado === 'error'
            ? 'No se ha podido copiar'
            : 'Copiar todas las pendientes'}
      </button>

      <p className="mt-2 text-sm text-gris-medio">
        Se copian sólo las que no has marcado como resueltas, sin correos.
      </p>
    </div>
  );
}
