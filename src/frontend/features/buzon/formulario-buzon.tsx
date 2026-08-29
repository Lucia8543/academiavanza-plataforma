'use client';

import { useActionState } from 'react';
import { enviarIncidencia, type EstadoBuzon } from '@/app/buzon/acciones';
import { CamposTrampa } from '@/frontend/components/shared/campos-trampa';

/**
 * El formulario para contar que algo no funciona.
 *
 * Está pensado para que lo rellene alguien enfadado o con prisa, que es el
 * estado normal de quien viene aquí. Por eso hay **un solo campo obligatorio** y
 * ninguna pregunta sobre quién es: de dónde viene ya lo sabemos por la página
 * anterior, y preguntarle el nombre sería pedirle un favor a quien nos está
 * haciendo uno.
 *
 * El correo es opcional y está explicado: sirve para contestarle, no para
 * apuntarle a nada.
 */

const INICIAL: EstadoBuzon = {};

export function FormularioBuzon() {
  const [estado, accion, enviando] = useActionState(enviarIncidencia, INICIAL);

  /*
   * De dónde venía, leído al enviar y no al pintar.
   *
   * Tiene que leerse en el navegador —el servidor no lo sabe, y la cabecera
   * `Referer` de este envío apuntaría a `/buzon`, que es inútil—, pero no hace
   * falta ningún efecto ni ningún estado: basta con meterlo en el formulario
   * justo antes de mandarlo. Guardarlo en un estado desde un efecto provocaba
   * un repintado de más por un dato que sólo se usa una vez.
   *
   * Se recorta en el servidor: las direcciones privadas llevan el token dentro.
   */
  async function enviar(formulario: FormData) {
    formulario.set('pagina', document.referrer || window.location.pathname);
    accion(formulario);
  }

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-verde-avanza bg-verde-avanza-claro p-5">
        <h2 className="font-bold text-verde-avanza-oscuro">Gracias, de verdad</h2>
        <p className="mt-2 text-sm text-carbon">
          Lo hemos apuntado. No contestamos a todo, pero lo leemos todo, y esto
          es lo que hace que la web deje de fallar por donde falla.
        </p>
      </div>
    );
  }

  return (
    <form action={enviar} className="relative">
      <CamposTrampa />

      <label htmlFor="texto" className="block text-sm font-medium text-carbon">
        ¿Qué ha pasado?
      </label>
      <p className="mt-1 text-sm text-gris-medio">
        Con una frase basta. Si puedes, dinos qué estabas intentando hacer y qué
        pasó en su lugar.
      </p>
      <textarea
        id="texto"
        name="texto"
        rows={5}
        maxLength={2000}
        required
        placeholder="Intenté escribir a un profesor y el botón no hacía nada…"
        className="mt-2 w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza"
      />

      <p className="mt-1 text-xs text-gris-medio">
        No nos cuentes nada sobre la salud de tu hijo ni de tus alumnos: para
        arreglar la web no nos hace falta y no podemos guardarlo.
      </p>

      <label
        htmlFor="email"
        className="mt-5 block text-sm font-medium text-carbon"
      >
        Tu correo, si quieres que te contestemos
      </label>
      <p className="mt-1 text-sm text-gris-medio">
        Opcional. Sólo lo usamos para responderte a esto.
      </p>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        className="mt-2 w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza"
      />

      {estado.error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error"
        >
          {estado.error}
        </p>
      )}

      <button
        disabled={enviando}
        className="mt-6 rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white hover:bg-verde-avanza-oscuro disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  );
}
