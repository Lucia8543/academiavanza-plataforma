import {
  buscarProfesores,
  contarPublicadas,
  opcionesDeFiltro,
} from '@/backend/repositories/directorio';
import { precioVigente } from '@/backend/repositories/tarifas';
import { Filtrado } from '@/frontend/features/directorio/filtros';
import { TarjetaProfesor } from '@/frontend/features/directorio/tarjeta-profesor';
import type { Filtros } from '@/shared/types/directorio';

const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n,
  );

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

  const [fichas, opciones, total, precio] = await Promise.all([
    buscarProfesores(filtros),
    opcionesDeFiltro(),
    contarPublicadas(),
    precioVigente(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza sm:text-4xl">
          Profesores
        </h1>
        <p className="mt-3 max-w-2xl text-carbon">
          Todos han estudiado en un colegio de Madrid y nos han dicho en cuál.
          Escribir es gratis. Solo pagas {euros(precio)} si el profesor acepta
          darte clase, y entonces os pasamos el teléfono el uno del otro. Lo que
          cueste la clase lo acordáis vosotros.
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
        {/* «Es gratuito» y no «no te cuesta nada»: esta página la lee sobre
            todo una familia que sí va a pagar, y la fórmula anterior la
            invitaba a compararse. Mismo criterio que en la portada. */}
        <p className="mt-2 max-w-2xl text-sm text-gris-medio">
          Publicar tu ficha es gratuito: quien paga el contacto es la familia, y
          solo si tú aceptas darle clase. Rellenas el formulario, lo revisamos y
          tu ficha se publica.
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
