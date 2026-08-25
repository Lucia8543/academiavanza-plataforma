import { redirect } from 'next/navigation';
import { haySesion } from '@/backend/services/sesion-admin';
import { FormularioEntrar } from '@/frontend/features/administracion/formulario-entrar';

export const metadata = { title: 'Entrar · AcademiAvanza' };

export default async function PaginaEntrar() {
  if (await haySesion()) redirect('/admin');

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-extrabold text-azul-confianza">
        Academi<span className="text-verde-avanza">Avanza</span>
      </h1>
      <p className="mt-1 text-sm text-gris-medio">Panel de administración</p>

      <div className="mt-8">
        <FormularioEntrar />
      </div>
    </main>
  );
}
