import { aprobar, borrar, rechazar, retirar } from '@/app/admin/acciones';
import type { Ficha } from '@/backend/repositories/profesores';
import { DIAS, FRANJAS } from '@/shared/schemas/profesor';

/**
 * Una ficha vista desde el panel. Pensada para leerse en un móvil de un
 * vistazo y decidir en dos minutos.
 */

const DIA_CORTO = Object.fromEntries(DIAS.map((d) => [d.numero, d.corta]));

function franjaDeHora(hora: Date): string {
  const h = hora.toISOString().slice(11, 16);
  const entrada = Object.entries(FRANJAS).find(([, f]) => f.inicio === h);
  return entrada ? entrada[1].etiqueta.toLowerCase() : h;
}

const boton =
  'rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60';

export function TarjetaFicha({ f }: { f: Ficha }) {
  const colegio =
    f.colegios?.nombre_corto ?? f.colegios?.nombre ?? f.colegio_otro;
  const colegioNuevo = !f.colegios && Boolean(f.colegio_otro);

  const asignaturas = f.profesor_asignaturas.map((a) => a.asignaturas.nombre);
  const niveles = f.profesor_niveles.map((n) => n.niveles.nombre);
  const idiomas = f.profesor_certificaciones.map(
    (c) =>
      `${c.certificaciones_idioma.idioma} ${c.certificaciones_idioma.nivel_mcer ?? ''}`.trim(),
  );

  return (
    <article className="rounded-xl border border-gris-borde bg-white p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-azul-confianza">
          {f.nombre} {f.apellidos}
        </h3>
        <span className="text-sm text-gris-medio">
          {new Date(f.creado_en).toLocaleDateString('es-ES')}
        </span>
      </header>

      <p className="mt-1 text-sm text-gris-medio">{f.email}</p>

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="inline font-medium text-carbon">Colegio: </dt>
          <dd className="inline text-carbon">{colegio ?? '—'}</dd>
          {colegioNuevo && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              no está en el catálogo
            </span>
          )}
        </div>

        <div>
          <dt className="inline font-medium text-carbon">Estudia: </dt>
          <dd className="inline text-carbon">
            {f.titulacion} en {f.universidad}
            {f.titulacion_finalizada
              ? ' · terminada'
              : f.curso_actual
                ? ` · ${f.curso_actual}.º curso`
                : ''}
          </dd>
        </div>

        <div>
          <dt className="inline font-medium text-carbon">Da: </dt>
          <dd className="inline text-carbon">
            {asignaturas.join(', ') || '—'}
          </dd>
        </div>

        <div>
          <dt className="inline font-medium text-carbon">A: </dt>
          <dd className="inline text-carbon">{niveles.join(', ') || '—'}</dd>
        </div>

        <div>
          <dt className="inline font-medium text-carbon">Modalidad: </dt>
          <dd className="inline text-carbon">
            {f.modalidad}
            {f.zona_otra ? ` · ${f.zona_otra}` : ''}
          </dd>
        </div>

        {idiomas.length > 0 && (
          <div>
            <dt className="inline font-medium text-carbon">Idiomas: </dt>
            <dd className="inline text-carbon">{idiomas.join(', ')}</dd>
          </div>
        )}

        {f.profesor_disponibilidad.length > 0 && (
          <div>
            <dt className="inline font-medium text-carbon">Puede: </dt>
            <dd className="inline text-carbon">
              {f.profesor_disponibilidad
                .map(
                  (d) =>
                    `${DIA_CORTO[d.dia_semana]} ${franjaDeHora(d.hora_inicio)}`,
                )
                .join(' · ')}
            </dd>
          </div>
        )}
      </dl>

      {f.puntos_fuertes && (
        <blockquote className="mt-4 border-l-2 border-verde-avanza bg-gris-claro p-3 text-sm italic text-carbon">
          «{f.puntos_fuertes}»
        </blockquote>
      )}

      {f.motivo_rechazo && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-error">
          Rechazada: {f.motivo_rechazo}
        </p>
      )}

      {/* --- Botones ---------------------------------------------------- */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-gris-borde pt-4">
        {f.estado === 'pendiente' ? (
          <>
            <form action={aprobar}>
              <input type="hidden" name="id" value={f.id} />
              <button
                className={`${boton} bg-verde-avanza text-white hover:bg-verde-avanza-oscuro`}
              >
                Publicar
              </button>
            </form>

            <form action={rechazar} className="flex flex-1 gap-2">
              <input type="hidden" name="id" value={f.id} />
              <input
                name="motivo"
                placeholder="Motivo del rechazo"
                className="min-w-0 flex-1 rounded-lg border border-gris-borde px-3 py-2 text-sm"
              />
              <button
                className={`${boton} border border-gris-borde text-carbon hover:bg-gris-claro`}
              >
                Rechazar
              </button>
            </form>
          </>
        ) : (
          <form action={retirar}>
            <input type="hidden" name="id" value={f.id} />
            <button
              className={`${boton} border border-gris-borde text-carbon hover:bg-gris-claro`}
            >
              Retirar del directorio
            </button>
          </form>
        )}

        <form action={borrar} className="ml-auto">
          <input type="hidden" name="id" value={f.id} />
          <button className={`${boton} text-sm text-error underline`}>
            Borrar
          </button>
        </form>
      </div>
    </article>
  );
}
