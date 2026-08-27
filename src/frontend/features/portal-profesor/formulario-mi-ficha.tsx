'use client';

import { useActionState, useState } from 'react';
import {
  guardarCambios,
  type EstadoEdicion,
} from '@/app/mi-ficha/[token]/acciones';
import type { Catalogos } from '@/backend/repositories/catalogos';
import { DIAS, FRANJAS } from '@/shared/schemas/profesor';

/**
 * Edición de la propia ficha.
 *
 * Es el mismo formulario del alta menos lo que no se puede tocar: el nombre y
 * el colegio, que son lo que administración revisa antes de publicar. Lo demás
 * cambia con el tiempo —las asignaturas que uno se ve capaz de dar, el horario
 * cuando empieza el cuatrimestre, el correo cuando cambia de universidad— y
 * tenerlo que pedir por correo es la manera de que nadie lo actualice nunca.
 *
 * Nace relleno con lo que ya tiene marcado, no en blanco. Un formulario de
 * edición vacío es una trampa: quien no se fije lo guarda y se borra media
 * ficha.
 */

const INICIAL: EstadoEdicion = {};

const claseCampo =
  'w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon ' +
  'focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza';

const claseEtiqueta = 'block text-sm font-medium text-carbon';
const claseCasilla = 'h-4 w-4 accent-[#2E7D5E]';

type Seleccion = {
  asignaturas: string[];
  niveles: string[];
  certificaciones: string[];
  disponibilidad: string[];
};

export function FormularioMiFicha({
  token,
  catalogos,
  seleccion,
  telefono,
  email,
  puntosFuertes,
  anosExperiencia,
  modalidad,
  zona,
  desplazamientoFlexible,
}: {
  token: string;
  catalogos: Catalogos;
  seleccion: Seleccion;
  telefono: string;
  email: string;
  puntosFuertes: string;
  anosExperiencia: string;
  modalidad: string;
  zona: string;
  desplazamientoFlexible: boolean;
}) {
  const [estado, accion, guardando] = useActionState(guardarCambios, INICIAL);

  const [v, setV] = useState({
    ...seleccion,
    telefono,
    email,
    puntosFuertes,
    anosExperiencia,
    modalidad,
    zona,
    desplazamientoFlexible,
  });

  const alternar = (
    campo: 'asignaturas' | 'niveles' | 'certificaciones' | 'disponibilidad',
    valor: string,
  ) =>
    setV((actual) => ({
      ...actual,
      [campo]: actual[campo].includes(valor)
        ? actual[campo].filter((x) => x !== valor)
        : [...actual[campo], valor],
    }));

  return (
    <form action={accion} className="mt-5 space-y-8">
      <input type="hidden" name="token" value={token} />

      {estado.error && (
        <p className="rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error">
          {estado.error}
        </p>
      )}

      {estado.ok && (
        <p className="rounded-lg border border-verde-avanza bg-verde-avanza-claro px-4 py-3 text-sm text-verde-avanza-oscuro">
          Guardado. Las familias ya ven tu ficha así.
        </p>
      )}

      {/* --- Asignaturas -------------------------------------------------- */}
      <fieldset>
        <legend className={claseEtiqueta}>Asignaturas</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {catalogos.asignaturas.map((a) => (
            <label
              key={a.id}
              className="flex items-center gap-2 text-sm text-carbon"
            >
              <input
                type="checkbox"
                name="asignaturas"
                value={a.id}
                className={claseCasilla}
                checked={v.asignaturas.includes(a.id)}
                onChange={() => alternar('asignaturas', a.id)}
              />
              {a.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      {/* --- Cursos ------------------------------------------------------- */}
      <fieldset>
        <legend className={claseEtiqueta}>Cursos</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {catalogos.niveles.map((n) => (
            <label
              key={n.id}
              className="flex items-center gap-2 text-sm text-carbon"
            >
              <input
                type="checkbox"
                name="niveles"
                value={n.id}
                className={claseCasilla}
                checked={v.niveles.includes(n.id)}
                onChange={() => alternar('niveles', n.id)}
              />
              {n.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      {/* --- Idiomas ------------------------------------------------------ */}
      <fieldset>
        <legend className={claseEtiqueta}>Idiomas acreditados</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {catalogos.certificaciones.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 text-sm text-carbon"
            >
              <input
                type="checkbox"
                name="certificaciones"
                value={c.id}
                className={claseCasilla}
                checked={v.certificaciones.includes(c.id)}
                onChange={() => alternar('certificaciones', c.id)}
              />
              {c.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      {/* --- Modalidad ---------------------------------------------------- */}
      <fieldset>
        <legend className={claseEtiqueta}>Cómo das clase</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {[
            { valor: 'online', etiqueta: 'Sólo online' },
            { valor: 'presencial', etiqueta: 'Sólo a domicilio del alumno' },
            { valor: 'ambas', etiqueta: 'Las dos' },
          ].map((o) => (
            <label
              key={o.valor}
              className="flex items-center gap-2 text-sm text-carbon"
            >
              <input
                type="radio"
                name="modalidad"
                value={o.valor}
                className={claseCasilla}
                checked={v.modalidad === o.valor}
                onChange={(e) =>
                  setV((a) => ({ ...a, modalidad: e.target.value }))
                }
              />
              {o.etiqueta}
            </label>
          ))}
        </div>

        {v.modalidad !== 'online' && (
          <div className="mt-4 sm:w-1/2">
            <label className={claseEtiqueta} htmlFor="zona">
              Zonas a las que te desplazas
            </label>
            <input
              id="zona"
              name="zona"
              className={claseCampo}
              value={v.zona}
              onChange={(e) => setV((a) => ({ ...a, zona: e.target.value }))}
            />
            <label className="mt-3 flex items-start gap-2 text-sm text-carbon">
              <input
                type="checkbox"
                name="desplazamientoFlexible"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2E7D5E]"
                checked={v.desplazamientoFlexible}
                onChange={(e) =>
                  setV((a) => ({
                    ...a,
                    desplazamientoFlexible: e.target.checked,
                  }))
                }
              />
              <span>
                Puedo ir a otras zonas si el horario o la duración compensan.{' '}
                <span className="text-gris-medio">
                  Márcalo si te lo plantearías: hay familias de fuera de tu zona
                  que, si no, ni te escriben.
                </span>
              </span>
            </label>
          </div>
        )}
      </fieldset>

      {/* --- Horario ------------------------------------------------------ */}
      <fieldset>
        <legend className={claseEtiqueta}>Cuándo sueles poder</legend>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[26rem] text-center text-sm">
            <thead>
              <tr>
                <th className="w-20" />
                {(Object.keys(FRANJAS) as (keyof typeof FRANJAS)[]).map((f) => (
                  <th key={f} className="pb-2 font-medium text-gris-medio">
                    {FRANJAS[f].etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS.map((d) => (
                <tr key={d.numero} className="border-t border-gris-borde">
                  <th className="py-2 pr-2 text-right font-medium text-gris-medio">
                    {d.etiqueta}
                  </th>
                  {(Object.keys(FRANJAS) as (keyof typeof FRANJAS)[]).map(
                    (f) => {
                      const clave = `${d.numero}-${f}`;
                      return (
                        <td key={f} className="py-2 text-center">
                          <input
                            type="checkbox"
                            name="disponibilidad"
                            value={clave}
                            aria-label={`${d.etiqueta}, ${FRANJAS[f].etiqueta}`}
                            className="h-5 w-5 accent-[#2E7D5E]"
                            checked={v.disponibilidad.includes(clave)}
                            onChange={() => alternar('disponibilidad', clave)}
                          />
                        </td>
                      );
                    },
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      {/* --- Teléfono y presentación -------------------------------------- */}
      <div className="sm:w-1/2">
        <label className={claseEtiqueta} htmlFor="telefono">
          Tu teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          className={claseCampo}
          value={v.telefono}
          onChange={(e) => setV((a) => ({ ...a, telefono: e.target.value }))}
        />
        <p className="mt-1 text-sm text-gris-medio">
          No se publica. Solo lo recibe una familia que ha pagado el contacto.
        </p>
      </div>

      {/* El correo es su identidad: por ahí le llegan las solicitudes. Si
          cambia de dirección y no puede decírnoslo, se queda incomunicado sin
          enterarse de que lo está. */}
      <div className="sm:w-1/2">
        <label className={claseEtiqueta} htmlFor="email">
          Tu correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          className={claseCampo}
          value={v.email}
          onChange={(e) => setV((a) => ({ ...a, email: e.target.value }))}
        />
        <p className="mt-1 text-sm text-gris-medio">
          Aquí te avisamos cuando una familia te quiere. No se publica.
        </p>
      </div>

      <div className="sm:w-56">
        <label className={claseEtiqueta} htmlFor="anosExperiencia">
          Años dando clases particulares
        </label>
        <input
          id="anosExperiencia"
          name="anosExperiencia"
          inputMode="numeric"
          className={claseCampo}
          value={v.anosExperiencia}
          onChange={(e) =>
            setV((a) => ({ ...a, anosExperiencia: e.target.value }))
          }
        />
        <p className="mt-1 text-sm text-gris-medio">
          Aparece en tu ficha. Déjalo en blanco si prefieres no decirlo.
        </p>
      </div>

      <div>
        <label className={claseEtiqueta} htmlFor="puntosFuertes">
          Algo que te distinga al dar clase
        </label>
        <textarea
          id="puntosFuertes"
          name="puntosFuertes"
          rows={4}
          maxLength={300}
          className={claseCampo}
          value={v.puntosFuertes}
          onChange={(e) =>
            setV((a) => ({ ...a, puntosFuertes: e.target.value }))
          }
        />
      </div>

      <button
        disabled={guardando}
        className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro disabled:opacity-60 sm:w-auto"
      >
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
