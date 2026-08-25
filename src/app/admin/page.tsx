import { redirect } from 'next/navigation';
import { salir } from '@/app/admin/acciones';
import {
  listarPendientes,
  listarRevisadas,
} from '@/backend/repositories/profesores';
import { haySesion } from '@/backend/services/sesion-admin';
import { TarjetaFicha } from '@/frontend/features/administracion/tarjeta-ficha';

export const metadata = { title: 'Panel · AcademiAvanza' };

// Nunca se guarda en caché: aquí se viene a ver el estado de ahora.
export const dynamic = 'force-dynamic';

export default async function PaginaAdmin() {
  if (!(await haySesion())) redirect('/admin/entrar');

  const [pendientes, revisadas] = await Promise.all([
    listarPendientes(),
    listarRevisadas(),
  ]);

  const publicadas = revisadas.filter((f) => f.estado === 'activo');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-azul-confianza">
            Fichas
          </h1>
          <p className="mt-1 text-sm text-gris-medio">
            {publicadas.length} publicadas · {pendientes.length} por revisar
          </p>
        </div>
        <form action={salir}>
          <button className="text-sm text-gris-medio underline underline-offset-4">
            Salir
          </button>
        </form>
      </header>

      {/* ---------------------------------------------------------------- */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-carbon">
          Por revisar
          {pendientes.length > 0 && (
            <span className="ml-2 rounded-full bg-aviso px-2 py-0.5 text-sm text-white">
              {pendientes.length}
            </span>
          )}
        </h2>

        {pendientes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-gris-borde p-6 text-center text-gris-medio">
            Nada pendiente. Puedes cerrar el móvil.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendientes.map((f) => (
              <TarjetaFicha key={f.id} f={f} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {revisadas.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-carbon">Ya revisadas</h2>
          <div className="mt-4 space-y-4">
            {revisadas.map((f) => (
              <TarjetaFicha key={f.id} f={f} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
