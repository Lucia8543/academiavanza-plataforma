import {
  aprobar,
  borrar,
  cambiarCupo,
  darDeAltaColegio,
  rechazar,
  retirar,
} from '@/app/admin/acciones';
import type { Ficha } from '@/backend/repositories/profesores';
import { ETIQUETA_CUPO, normalizarCupo, OPCIONES_CUPO } from '@/shared/reglas/cupo';
import { DIAS, FRANJAS } from '@/shared/schemas/profesor';
import {
  esSospechaConocida,
  EXPLICACION_SOSPECHA,
} from '@/shared/schemas/trampa-bots';

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

  // Las dos condiciones que la base de datos y la acción exigen para publicar.
  const sePuedePublicar = Boolean(f.colegios) && Boolean(f.telefono);

  const asignaturas = f.profesor_asignaturas.map((a) => a.asignaturas.nombre);
  const niveles = f.profesor_niveles.map((n) => n.niveles.nombre);
  const idiomas = f.profesor_certificaciones.map(
    (c) =>
      `${c.certificaciones_idioma.idioma} ${c.certificaciones_idioma.nivel_mcer ?? ''}`.trim(),
  );

  const cupo = normalizarCupo(f.cupo);

  // Lo que vio el detector antibots, si vio algo. `esSospechaConocida` filtra
  // cualquier valor raro que hubiera podido quedar guardado, para que un texto
  // inesperado no reviente la pantalla entera del panel.
  const avisoSospecha = esSospechaConocida(f.sospecha_bot)
    ? EXPLICACION_SOSPECHA[f.sospecha_bot]
    : null;

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

      <p className="mt-1 text-sm text-gris-medio">
        {f.email}
        {f.telefono ? ` · ${f.telefono}` : ''}
      </p>

      {/*
        El aviso del detector antibots.

        Va arriba del todo, justo debajo del nombre, porque es lo que cambia
        cómo se lee todo lo demás. Y va en morado y no en rojo a propósito: no
        es un error de la ficha ni algo que haya hecho mal quien la envió, es
        una duda nuestra sobre cómo llegó.

        Antes de esto, un envío marcado se borraba solo y no llegaba a esta
        pantalla. Aquí está la diferencia entera del cambio: la decisión la
        toma quien lee, con el motivo delante.
      */}
      {avisoSospecha && (
        <p className="mt-3 rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm text-purple-900">
          <span className="font-medium">{avisoSospecha.titulo}.</span>{' '}
          {avisoSospecha.texto}
        </p>
      )}

      {/* Sin teléfono la ficha no puede publicarse: es lo que recibe la familia
          al final del recorrido, y la base de datos lo exige para estar activa.
          Son fichas de antes de que lo pidiéramos. */}
      {!f.telefono && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <span className="font-medium">Sin teléfono.</span> Esta ficha es de
          antes de que lo pidiéramos y no se puede publicar, porque es lo que recibe la
          familia cuando paga. Escríbele para pedírselo, o bórrala si es una
          prueba.
        </p>
      )}

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

        {/* Sin colegio del catálogo la ficha no se puede publicar. Antes sí se
            podía, y salía sin ningún colegio: ni el texto que escribió, ni un
            hueco, ni un aviso. El badge del colegio es el producto. */}
        {colegioNuevo && f.estado === 'pendiente' && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              <span className="font-medium">Escribió el colegio a mano.</span>{' '}
              Hasta que esté en el catálogo no se puede publicar, porque saldría sin
              colegio y sin poder filtrarse por él.
            </p>
            <p className="mt-1">
              Si es un colegio de verdad, dale de alta con este botón. Si está
              mal escrito o no lo es, rechaza la ficha y pídele que lo corrija.
            </p>
            <form action={darDeAltaColegio} className="mt-3">
              <input type="hidden" name="id" value={f.id} />
              <button
                className={`${boton} border border-amber-400 bg-white text-amber-900 hover:bg-amber-100`}
              >
                Dar de alta «{f.colegio_otro}» y asociarlo
              </button>
            </form>
          </div>
        )}

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
            {/* El servidor rechaza igualmente una ficha sin colegio o sin
                teléfono. Apagar el botón es para no hacer pulsar algo que no
                va a funcionar, no para impedirlo: eso está en la acción. */}
            <form action={aprobar}>
              <input type="hidden" name="id" value={f.id} />
              <button
                disabled={!sePuedePublicar}
                title={
                  sePuedePublicar
                    ? undefined
                    : 'Antes hay que resolver el colegio y el teléfono'
                }
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
          <>
            {/*
              El hueco, cambiable desde aquí.

              El profesor ya puede hacerlo solo desde su ficha, pero quien te
              avisa por WhatsApp de que se ha llenado no va a entrar en su
              enlace a buscar un botón. Antes de esto, la única salida era
              pedírselo y esperar a que lo hiciera.

              Sólo aparece en las publicadas: en una ficha pendiente el hueco
              no significa nada porque todavía no la ve ninguna familia.
            */}
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-sm text-gris-medio">Hueco:</span>
              {OPCIONES_CUPO.map((o) => (
                <form key={o.valor} action={cambiarCupo}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="cupo" value={o.valor} />
                  <button
                    title={o.texto}
                    className={`${boton} border text-sm ${
                      cupo === o.valor
                        ? o.valor === 'completo'
                          ? 'border-gris-medio bg-gris-claro text-carbon'
                          : o.valor === 'justo'
                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                            : 'border-verde-avanza bg-verde-avanza-claro text-verde-avanza-oscuro'
                        : 'border-gris-borde text-gris-medio hover:bg-gris-claro'
                    }`}
                  >
                    {cupo === o.valor ? '✓ ' : ''}
                    {o.valor === 'busca'
                      ? 'Busca'
                      : (ETIQUETA_CUPO[o.valor] ?? o.titulo)}
                  </button>
                </form>
              ))}
            </div>

            <form action={retirar}>
              <input type="hidden" name="id" value={f.id} />
              <button
                className={`${boton} border border-gris-borde text-carbon hover:bg-gris-claro`}
              >
                Retirar del directorio
              </button>
            </form>
          </>
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
