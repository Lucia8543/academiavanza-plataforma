'use client';

import { useActionState } from 'react';
import { entrar } from '@/app/admin/acciones';

export function FormularioEntrar() {
  const [estado, accion, enviando] = useActionState(entrar, {});

  return (
    <form action={accion} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium text-carbon"
          htmlFor="clave"
        >
          Contraseña
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoFocus
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza"
        />
        {estado.error && (
          <p className="mt-2 text-sm text-error">{estado.error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white hover:bg-verde-avanza-oscuro disabled:opacity-60"
      >
        {enviando ? 'Comprobando…' : 'Entrar'}
      </button>
    </form>
  );
}
