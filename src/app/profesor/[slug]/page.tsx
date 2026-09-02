import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  buscarPorSlug,
  nivelesDe,
  tiempoDeRespuesta,
} from '@/backend/repositories/directorio';
import { precioVigente } from '@/backend/repositories/tarifas';
import { FormularioContacto } from '@/frontend/features/directorio/formulario-contacto';
import { DIAS, FRANJAS, type Franja } from '@/shared/schemas/profesor';
import {
  LO_QUE_NO_COMPROBAMOS,
  NO_INTERVENIMOS,
} from '@/shared/textos/descargos';
import { aceptaSolicitudes, AVISO_CUPO, ETIQUETA_CUPO } from '@/shared/reglas/cupo';
import {
  ANIMO_FUERA_DE_ZONA,
  comoDaClase,
  EXPLICACION_PRESENCIAL,
} from '@/shared/textos/modalidad';
import {
  agruparPorPrecio,
  porHora,
  PRECIO_ES_ORIENTATIVO,
} from '@/shared/textos/precios';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const f = await buscarPorSlug(slug);

  if (!f) return { title: 'Profesor no encontrado · AcademiAvanza' };

  return {
    title: `${f.nombrePublico} · AcademiAvanza`,
    description: f.colegio
      ? `${f.nombrePublico}, de ${f.colegio}. Da ${f.asignaturas.join(', ')}.`
      : `${f.nombrePublico} da ${f.asignaturas.join(', ')}.`,
    /*
     * La ficha de una persona no se indexa. Lo dice el prd-00 §3.2: «El
     * directorio sí; las personas concretas, no».
     *
     * El motivo es que quien se da de alta acepta aparecer en AcademiAvanza, no
     * que su nombre y su colegio salgan al buscar su nombre en Google durante
     * los años siguientes. Muchos son recién salidos del instituto.
     */
    robots: { index: false, follow: true },
  };
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gris-borde pt-6">
      <h2 className="text-sm font-medium uppercase tracking-wide text-gris-medio">
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gris-claro px-3 py-1 text-sm text-carbon">
      {children}
    </span>
  );
}

/**
 * La disponibilidad, como una rejilla y no como una lista.
 *
 * Una lista de «L mañana · X tarde · V tarde» obliga a leerla entera para saber
 * si encaja con la tarde de los martes. La rejilla se mira de un vistazo, que
 * es lo que hace alguien decidiendo entre cinco profesores.
 */
function Rejilla({
  disponibilidad,
}: {
  disponibilidad: { dia: number; franja: Franja }[];
}) {
  const marcado = new Set(disponibilidad.map((d) => `${d.dia}-${d.franja}`));
  const franjas = Object.keys(FRANJAS) as Franja[];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] text-center text-sm">
        <thead>
          <tr>
            <th className="w-20" />
            {DIAS.map((d) => (
              <th key={d.numero} className="pb-2 font-medium text-gris-medio">
                <abbr title={d.etiqueta} className="no-underline">
                  {d.corta}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {franjas.map((f) => (
            <tr key={f}>
              <th className="py-1 pr-3 text-right font-medium text-gris-medio">
                {FRANJAS[f].etiqueta}
              </th>
              {DIAS.map((d) => {
                const libre = marcado.has(`${d.numero}-${f}`);
                return (
                  <td key={d.numero} className="p-1">
                    <div
                      className={`mx-auto h-7 rounded ${
                        libre ? 'bg-verde-avanza' : 'bg-gris-claro'
                      }`}
                      aria-label={`${d.etiqueta} ${FRANJAS[f].etiqueta}: ${
                        libre ? 'disponible' : 'no disponible'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gris-medio">
        Horario orientativo, según lo que nos ha dicho. Lo concreto lo acordáis
        vosotros.
      </p>
    </div>
  );
}

export default async function PaginaProfesor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const f = await buscarPorSlug(slug);

  if (!f) notFound();

  const [niveles, precio, respuesta] = await Promise.all([
    nivelesDe(f.id),
    precioVigente(),
    tiempoDeRespuesta(f.id),
  ]);

  const estudios = f.titulacionFinalizada
    ? `${f.titulacion}, terminada`
    : f.cursoActual
      ? `${f.titulacion}, ${f.cursoActual}.º curso`
      : f.titulacion;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <a
        href="/profesores"
        className="text-sm text-gris-medio underline underline-offset-4"
      >
        ← Volver al directorio
      </a>

      <header className="mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza sm:text-4xl">
          {f.nombrePublico}
        </h1>

        {f.colegio && (
          <p className="mt-2 text-lg font-medium text-verde-avanza-oscuro">
            Estudió en {f.colegio}
          </p>
        )}

        {/*
          El aviso va aquí, pegado al colegio, y no al final de la página.
          El prd-00 §3.2 lo pide así con estas palabras: «un aviso permanente y
          visible, no escondido en el pie». Es donde la familia está mirando
          cuando decide, y decidir es dejar a un desconocido a solas con su hijo.
        */}
        <div className="mt-4 rounded-lg border border-gris-claro bg-gris-claro/40 px-4 py-3">
          <p className="text-sm font-medium text-carbon">
            Lo que AcademiAvanza no comprueba
          </p>
          {LO_QUE_NO_COMPROBAMOS.map((frase) => (
            <p key={frase} className="mt-1 text-sm leading-relaxed text-carbon">
              {frase}
            </p>
          ))}
        </div>

        {estudios && (
          <p className="mt-1 text-carbon">
            {estudios}
            {f.universidad ? ` · ${f.universidad}` : ''}
          </p>
        )}

        {/* Dos señales de confianza que no cuestan nada y no prometen nada:
            una la declara él, la otra la hemos medido nosotros. */}
        {(f.anosExperiencia !== null || respuesta) && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {f.anosExperiencia !== null && (
              <span className="rounded-full bg-gris-claro px-3 py-1 text-carbon">
                {f.anosExperiencia === 0
                  ? 'Empieza ahora a dar clases'
                  : f.anosExperiencia === 1
                    ? 'Un año dando clases'
                    : `${f.anosExperiencia} años dando clases`}
              </span>
            )}

            {respuesta && (
              <span className="rounded-full bg-verde-avanza-claro px-3 py-1 font-medium text-verde-avanza-oscuro">
                {respuesta === 'mismo-dia'
                  ? 'Suele contestar el mismo día'
                  : respuesta === 'un-dia'
                    ? 'Suele contestar en un día'
                    : 'Suele tardar unos días en contestar'}
              </span>
            )}
          </div>
        )}
      </header>

      {/*
        El aviso de hueco, con el mismo sitio para los dos casos.

        El de «sin hueco» va en gris y no en ámbar: el ámbar es un «ojo, con
        cuidado» y aquí no hay nada que decidir, es una constatación. Y explica
        por qué no hay formulario más abajo, que si no se lee como una página
        rota.
      */}
      {AVISO_CUPO[f.cupo] && (
        <p
          className={`mt-6 rounded-xl border p-4 text-sm ${
            f.cupo === 'completo'
              ? 'border-gris-borde bg-gris-claro text-carbon'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          <span className="font-medium">{ETIQUETA_CUPO[f.cupo]}.</span>{' '}
          {AVISO_CUPO[f.cupo]}
        </p>
      )}

      {f.puntosFuertes && (
        <blockquote className="mt-6 border-l-4 border-verde-avanza bg-gris-claro p-4 text-lg italic text-carbon">
          «{f.puntosFuertes}»
        </blockquote>
      )}

      <div className="mt-10 space-y-6">
        <Bloque titulo="Asignaturas">
          <div className="flex flex-wrap gap-2">
            {f.asignaturas.map((a) => (
              <Etiqueta key={a}>{a}</Etiqueta>
            ))}
          </div>
        </Bloque>

        {/* Los cursos con su precio de referencia al lado.
            Es el hueco más caro que quedaba: una familia pagaba el contacto,
            llamaba, y descubría una tarifa que no podía permitirse. Ahora lo
            sabe antes de escribir.

            Van agrupados por tramos de precio, no curso a curso: seis líneas
            seguidas repitiendo «15 €/h» hacen parecer complicado algo que no lo
            es. Y la explicación larga de qué son estos precios ya no está aquí,
            porque era idéntica en las cuarenta y seis fichas y no dice nada del
            profesor; vive una sola vez en el directorio. Aquí queda la frase
            corta, que sí tiene que ir pegada a los números. */}
        <Bloque titulo="Cursos y precio de referencia">
          <ul className="divide-y divide-gris-borde">
            {agruparPorPrecio(niveles).map((t) => (
              <li
                key={t.clave}
                className="flex items-baseline justify-between gap-3 py-2"
              >
                <span className="text-carbon">{t.etiqueta}</span>
                <span className="font-semibold text-carbon">
                  {t.precio === null ? 'A convenir' : porHora(t.precio)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gris-medio">
            {PRECIO_ES_ORIENTATIVO}
          </p>
        </Bloque>

        <Bloque titulo="Cómo da clase">
          <p className="text-carbon">
            {comoDaClase(f.modalidad, f.zona, f.desplazamientoFlexible)}
          </p>
          {f.modalidad !== 'online' && (
            <>
              <p className="mt-1 text-sm text-gris-medio">
                {EXPLICACION_PRESENCIAL}
              </p>
              {/* La zona no es una frontera. Sin esta línea, una familia de
                  fuera se descarta sola y el profesor nunca se entera de que
                  la habría cogido. */}
              {f.zona && (
                <p className="mt-2 rounded-lg bg-gris-claro px-3 py-2 text-sm text-carbon">
                  {ANIMO_FUERA_DE_ZONA}
                </p>
              )}
            </>
          )}
        </Bloque>

        {f.idiomas.length > 0 && (
          <Bloque titulo="Idiomas">
            <div className="flex flex-wrap gap-2">
              {f.idiomas.map((i) => (
                <Etiqueta key={i}>{i}</Etiqueta>
              ))}
            </div>
            {/* Lo declara quien se da de alta. No pedimos el título, y por eso
                no podemos decir que esté comprobado. */}
            <p className="mt-2 text-xs text-gris-medio">
              Según lo indicado por el profesor. No hemos visto los títulos.
            </p>
          </Bloque>
        )}

        {(f.disponibilidad.length > 0 || f.notaDisponibilidad) && (
          <Bloque titulo="Cuándo suele poder">
            {f.disponibilidad.length > 0 && (
              <Rejilla disponibilidad={f.disponibilidad} />
            )}
            {/*
              La rejilla va por franjas de varias horas, así que dice menos de
              lo que el profesor sabe. Esta línea es donde cabe el matiz: la
              hora exacta dentro de la franja, o lo que le cambia en octubre.
            */}
            {f.notaDisponibilidad && (
              <p className="mt-3 text-sm text-gris-medio">
                {f.notaDisponibilidad}
              </p>
            )}
          </Bloque>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*
        A quien no tiene hueco no se le puede escribir, y ése es el motivo de
        que exista el tercer estado.

        Cobrarle a una familia por contactar con alguien que **ya nos ha dicho
        que no puede cogerla** sería venderle algo que sabemos que no existe.
        Acabaría en un vale, una devolución y dos personas descontentas, que es
        exactamente el problema que teníamos con la distancia.

        Su ficha sigue publicada: quien está lleno en septiembre puede tener
        hueco en enero, y una academia con cuarenta profesores tiene que verse
        con cuarenta.
      */}
      {aceptaSolicitudes(f.cupo) ? (
        <div className="mt-12">
          <FormularioContacto
            slug={f.slug}
            nombreProfesor={f.nombrePublico}
            niveles={niveles}
            precio={precio}
            daPresencial={f.modalidad !== 'online'}
          />
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-gris-borde bg-gris-claro p-6 text-center">
          <p className="font-medium text-carbon">
            Ahora mismo no puedes escribirle
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gris-medio">
            {f.nombrePublico} nos ha dicho que tiene la agenda completa este
            curso. No te dejamos escribirle para que no pagues por un contacto
            que no iba a salir adelante.
          </p>
          <Link
            href="/profesores"
            className="mt-4 inline-block rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
          >
            Ver otros profesores
          </Link>
        </div>
      )}

      {/*
        Aquí ya sólo queda lo que hace la plataforma. Lo que NO comprueba se ha
        dicho arriba, junto al colegio, que es donde hay que decirlo.
      */}
      <p className="mt-6 text-xs leading-relaxed text-gris-medio">
        {NO_INTERVENIMOS}
      </p>
    </main>
  );
}
