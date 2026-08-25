import {
  buscarProfesores,
  contarPublicadas,
  opcionesDeFiltro,
} from '@/backend/repositories/directorio';
import { Filtrado } from '@/frontend/features/directorio/filtros';
import { TarjetaProfesor } from '@/frontend/features/directorio/tarjeta-profesor';
import type { Filtros } from '@/shared/types/directorio';

export const metadata = {
  title: 'Profesores · AcademiAvanza',
  description:
    'Profesores particulares en Madrid, con el colegio del que vienen.',
};

// El orden es aleatorio y las fichas cambian cuando se aprueba una nueva, así
// que esta página no se guarda en caché: se calcula en cada visita.
export const dynamic = 'force-dynamic';

type Parametros = { [clave: string]: string | string[] | undefined };

/** De la dirección al filtro. Lo que no sea texto sencillo se ignora. */
function leerFiltros(p: Parametros): Filtros {
  const uno = (clave: string) => {
    const valor = p[clave];
    return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined;
  };

  return {
    asignatura: uno('asignatura'),
    nivel: uno('nivel'),
    modalidad: uno('modalidad'),
    colegio: uno('colegio'),
    idioma: uno('idioma'),
  };
}

export default async function PaginaProfesores({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const filtros = leerFiltros(await searchParams);
  const hayFiltros = Object.values(filtros).some(Boolean);

  const [fichas, opciones, total] = await Promise.all([
    buscarProfesores(filtros),
    opcionesDeFiltro(),
    contarPublicadas(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza sm:text-4xl">
          Profesores
        </h1>
        <p className="mt-3 max-w-2xl text-carbon">
          Todos han estudiado en un colegio de Madrid y nos han dicho en cuál.
          Escribe a quien encaje contigo: el primer contacto no cuesta nada y no
          hay ningún intermediario.
        </p>
      </header>

      <div className="mt-8">
        <Filtrado
          opciones={opciones}
          actuales={filtros}
          hayFiltros={hayFiltros}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      <p className="mt-8 text-sm text-gris-medio">
        {fichas.length === total
          ? `${total} ${total === 1 ? 'profesor' : 'profesores'}`
          : `${fichas.length} de ${total}`}
        {' · el orden cambia en cada visita'}
      </p>

      {fichas.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gris-borde p-10 text-center">
          {total === 0 ? (
            <p className="text-gris-medio">
              Todavía no hay ninguna ficha publicada. Estamos empezando.
            </p>
          ) : (
            <>
              <p className="font-medium text-carbon">
                Nadie encaja con todo lo que has pedido.
              </p>
              <p className="mt-2 text-sm text-gris-medio">
                Prueba a dejar en «Me es indiferente» el filtro que menos te
                importe. El de colegio suele ser el que más recorta.
              </p>
              <a
                href="/profesores"
                className="mt-4 inline-block text-sm text-verde-avanza-oscuro underline underline-offset-4"
              >
                Ver todos los profesores
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {fichas.map((f) => (
            <TarjetaProfesor key={f.id} f={f} />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      <section className="mt-16 border-t border-gris-borde pt-8">
        <h2 className="text-lg font-bold text-carbon">
          ¿Eres profesor y quieres aparecer aquí?
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gris-medio">
          Publicar tu ficha es gratis. Rellenas el formulario, la revisamos y
          aparece en el directorio.
        </p>
        <a
          href="/registro"
          className="mt-4 inline-block rounded-lg border border-verde-avanza px-5 py-2.5 font-semibold text-verde-avanza-oscuro transition hover:bg-verde-avanza-claro"
        >
          Publicar mi ficha
        </a>
      </section>
    </main>
  );
}
