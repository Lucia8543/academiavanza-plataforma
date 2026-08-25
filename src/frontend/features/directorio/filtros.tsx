import type { Filtros, OpcionesFiltro } from '@/shared/types/directorio';

/**
 * Los filtros del directorio.
 *
 * Es un formulario normal que viaja por la dirección de la página, sin nada de
 * JavaScript. Tres motivos, por orden de importancia:
 *
 * 1. Funciona siempre, también con la conexión a medias en el metro.
 * 2. La búsqueda se puede guardar en marcadores y mandar por WhatsApp: la
 *    dirección lleva dentro lo que se ha filtrado.
 * 3. El botón de atrás del móvil hace lo que se espera.
 *
 * Todos los filtros empiezan en «Me es indiferente», y esa opción existe de
 * forma explícita. Dejar el desplegable en blanco no es lo mismo que decir que
 * te da igual: lo primero es una duda, lo segundo es una respuesta.
 */

const INDIFERENTE = 'Me es indiferente';

const claseSelect =
  'mt-1 w-full rounded-lg border border-gris-borde bg-white px-3 py-2 text-carbon ' +
  'focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza';

function Campo({
  nombre,
  etiqueta,
  valor,
  opciones,
}: {
  nombre: string;
  etiqueta: string;
  valor: string;
  opciones: { valor: string; texto: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-carbon" htmlFor={nombre}>
        {etiqueta}
      </label>
      <select
        id={nombre}
        name={nombre}
        defaultValue={valor}
        className={claseSelect}
      >
        <option value="">{INDIFERENTE}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Filtrado({
  opciones,
  actuales,
  hayFiltros,
}: {
  opciones: OpcionesFiltro;
  actuales: Filtros;
  hayFiltros: boolean;
}) {
  return (
    <form
      method="get"
      className="rounded-xl border border-gris-borde bg-gris-claro p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo
          nombre="asignatura"
          etiqueta="Asignatura"
          valor={actuales.asignatura ?? ''}
          opciones={opciones.asignaturas.map((a) => ({
            valor: a.id,
            texto: a.nombre,
          }))}
        />

        <Campo
          nombre="nivel"
          etiqueta="Curso"
          valor={actuales.nivel ?? ''}
          opciones={opciones.niveles.map((n) => ({
            valor: n.id,
            texto: n.nombre,
          }))}
        />

        <Campo
          nombre="modalidad"
          etiqueta="Modalidad"
          valor={actuales.modalidad ?? ''}
          opciones={[
            { valor: 'online', texto: 'Online' },
            { valor: 'presencial', texto: 'Presencial' },
          ]}
        />

        <Campo
          nombre="colegio"
          etiqueta="Colegio del profesor"
          valor={actuales.colegio ?? ''}
          opciones={opciones.colegios.map((c) => ({
            valor: c.id,
            texto: c.nombre,
          }))}
        />

        {opciones.idiomas.length > 0 && (
          <Campo
            nombre="idioma"
            etiqueta="Idioma acreditado"
            valor={actuales.idioma ?? ''}
            opciones={opciones.idiomas.map((i) => ({ valor: i, texto: i }))}
          />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="rounded-lg bg-verde-avanza px-5 py-2.5 font-semibold text-white transition hover:bg-verde-avanza-oscuro">
          Buscar
        </button>

        {hayFiltros && (
          <a
            href="/profesores"
            className="text-sm text-gris-medio underline underline-offset-4"
          >
            Quitar filtros
          </a>
        )}
      </div>
    </form>
  );
}
