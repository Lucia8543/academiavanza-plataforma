'use client';

import { useActionState, useState } from 'react';
import {
  comprobarCodigo,
  confirmar,
  type EstadoCobro,
} from '@/app/admin/cobros/acciones';

/**
 * Donde Lucía convierte un Bizum recibido en dos teléfonos abiertos.
 *
 * Son dos pasos y no uno a propósito. Ella lee el código de una notificación
 * del móvil y lo teclea; si se equivoca en un carácter y el sistema confirmara
 * a la primera, le habría dado el teléfono de una familia a un profesor que no
 * es. Eso no se deshace. Así que primero enseña a quién corresponde, con
 * nombres, y sólo entonces aparece el botón.
 */

const INICIAL: EstadoCobro = { paso: 'inicio' };

const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n,
  );

export function ConfirmadorBizum() {
  const [buscado, buscar, buscando] = useActionState(comprobarCodigo, INICIAL);
  const [cobrado, cobrar, cobrando] = useActionState(confirmar, INICIAL);
  const [codigo, setCodigo] = useState('');

  // El resultado de cobrar manda sobre el de buscar: es lo último que ha
  // pasado.
  const estado = cobrado.paso === 'inicio' ? buscado : cobrado;

  return (
    <div className="rounded-xl border-2 border-azul-confianza bg-white p-5">
      <h2 className="text-lg font-bold text-azul-confianza">
        He recibido un Bizum
      </h2>
      <p className="mt-1 text-sm text-gris-medio">
        Escribe el código que viene en el concepto. Te enseño de quién es antes
        de dar el pago por bueno y pasarle al profesor el teléfono de la
        familia.
      </p>

      <form action={buscar} className="mt-4 flex flex-wrap gap-2">
        <input
          name="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="27XJS"
          autoCapitalize="characters"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-gris-borde px-3 py-3 text-center font-mono text-xl uppercase tracking-widest text-carbon focus:border-verde-avanza focus:outline-none"
        />
        <button
          disabled={buscando}
          className="rounded-lg bg-azul-confianza px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {/* --- Error --------------------------------------------------------- */}
      {estado.paso === 'error' && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error"
        >
          {estado.mensaje}
        </p>
      )}

      {/* --- Confirmación -------------------------------------------------- */}
      {estado.paso === 'comprobar' && estado.resumen && (
        <div className="mt-4 rounded-lg border border-gris-borde bg-gris-claro p-4">
          <p className="text-sm text-gris-medio">
            Código <span className="font-mono font-bold">{estado.codigo}</span>
          </p>

          <dl className="mt-3 space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-carbon">Familia: </dt>
              <dd className="inline text-carbon">
                {estado.resumen.nombreFamilia}
                {estado.resumen.telefono ? ` · ${estado.resumen.telefono}` : ''}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-carbon">Profesor: </dt>
              <dd className="inline text-carbon">{estado.resumen.profesor}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-carbon">Curso: </dt>
              <dd className="inline text-carbon">
                {estado.resumen.nivel ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-carbon">Importe: </dt>
              <dd className="inline font-semibold text-carbon">
                {euros(estado.resumen.importe)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-sm text-carbon">
            Comprueba que el importe coincide con lo que te ha llegado al
            banco. Al confirmar, el profesor recibirá el teléfono de la familia,
            y eso no se deshace.
          </p>

          <form action={cobrar} className="mt-4">
            <input type="hidden" name="codigo" value={estado.codigo} />
            <button
              disabled={cobrando}
              className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white disabled:opacity-60"
            >
              {cobrando
                ? 'Confirmando…'
                : 'Sí, me ha llegado. Dar el contacto'}
            </button>
          </form>
        </div>
      )}

      {/* --- Hecho --------------------------------------------------------- */}
      {estado.paso === 'hecho' && (
        <p className="mt-4 rounded-lg border border-verde-avanza bg-verde-avanza-claro px-4 py-3 text-sm text-verde-avanza-oscuro">
          {estado.mensaje}
        </p>
      )}
    </div>
  );
}
