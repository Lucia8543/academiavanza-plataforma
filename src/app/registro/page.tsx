import type { Metadata } from 'next';
import { cargarCatalogos } from '@/backend/repositories/catalogos';
import { precioVigente } from '@/backend/repositories/tarifas';
import { FormularioRegistro } from '@/frontend/features/portal-profesor/formulario-registro';

export const metadata: Metadata = {
  title: 'Da clases con AcademiAvanza',
  description:
    'Publica tu ficha en el directorio y recibe contactos de familias que buscan profesor.',
};

// Los catálogos cambian muy poco, pero si Lucía aprueba un colegio nuevo
// queremos que aparezca sin esperar. Una hora es un buen punto medio.
export const revalidate = 3600;

/**
 * El encabezado no está aquí, sino dentro del formulario.
 *
 * Es la única forma de que desaparezca cuando la ficha ya se ha enviado. Antes
 * se quedaba arriba diciendo «rellena tu ficha una vez» y «a ti no te cobramos
 * nada» encima de un «Ficha recibida», y un texto que invita a hacer algo que
 * ya has hecho sobra y confunde.
 */
export default async function PaginaRegistro() {
  const [catalogos, precio] = await Promise.all([
    cargarCatalogos(),
    precioVigente(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <FormularioRegistro
        catalogos={catalogos}
        precioTexto={new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(precio)}
      />
    </main>
  );
}
