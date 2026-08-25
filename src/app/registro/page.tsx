import type { Metadata } from 'next';
import { cargarCatalogos } from '@/backend/repositories/catalogos';
import { FormularioRegistro } from '@/frontend/features/portal-profesor/formulario-registro';

export const metadata: Metadata = {
  title: 'Da clases con AcademiAvanza',
  description:
    'Publica tu ficha en el directorio y recibe contactos de familias que buscan profesor.',
};

// Los catálogos cambian muy poco, pero si Lucía aprueba un colegio nuevo
// queremos que aparezca sin esperar. Una hora es un buen punto medio.
export const revalidate = 3600;

export default async function PaginaRegistro() {
  const catalogos = await cargarCatalogos();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza sm:text-4xl">
          Da clases con Academi<span className="text-verde-avanza">Avanza</span>
        </h1>
        <p className="mt-4 text-lg text-carbon">
          Rellena tu ficha una vez. Las familias te encontrarán por colegio,
          asignatura y curso, y te escribirán directamente.
        </p>
        <p className="mt-4 text-sm text-gris-medio">
          Tarda unos cinco minutos. No pedimos foto, ni notas, ni justificantes.
          Tampoco cobramos nada, ni a ti ni a las familias.
        </p>
      </header>

      <FormularioRegistro catalogos={catalogos} />
    </main>
  );
}
