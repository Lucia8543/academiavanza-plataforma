import { redirect } from 'next/navigation';
import { marcarIncidencia } from '@/app/admin/buzon/acciones';
import {
  incidenciasEnTexto,
  listarIncidencias,
} from '@/backend/services/incidencias';
import { haySesion } from '@/backend/services/sesion-admin';
import { CopiarIncidencias } from '@/frontend/features/administracion/copiar-incidencias';

/**
 * Lo que la gente cuenta que no funciona.
 *
 * Se lee y se marca, nada más. No hay forma de contestar desde aquí a propósito:
 * un buzón que además es un chat se convierte en una obligación diaria, y esta
 * plataforma no puede tener ninguna.
 */

export const metadata = {
  title: 'Buzón · AcademiAvanza',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const COMO_QUIEN: Record<string, string> = {
  familia: 'Una familia',
  profesor: 'Un profesor',
  visita: 'Alguien de la web',
};

export default async function PaginaBuzonAdmin() {
  if (!(await haySesion())) redirect('/admin/entrar');

  const [incidencias, texto] = await Promise.all([
    listarIncidencias(),
    incidenciasEnTexto(),
  ]);

  const pendientes = incidencias.filter((i) => i.estado !== 'resuelta');
  const resueltas = incidencias.filter((i) => i.estado === 'resuelta');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-azul-confianza">Buzón</h1>
          <p className="mt-1 text-sm text-gris-medio">
            {pendientes.length} sin resolver · {resueltas.length} resueltas
          </p>
        </div>
        <a
          href="/admin"
          className="text-sm text-gris-medio underline underline-offset-4"
        >
          Volver al panel
        </a>
      </header>

      <CopiarIncidencias texto={texto} />

      {pendientes.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gris-borde p-6 text-center text-gris-medio">
          Nadie ha contado ningún fallo. Puede ser buena señal o puede ser que
          nadie encuentre el enlace del pie.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {pendientes.map((i) => (
            <article
              key={i.id}
              className="rounded-xl border border-gris-borde bg-white p-5"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-bold text-azul-confianza">
                  {COMO_QUIEN[i.quien] ?? 'Alguien'}
                </h2>
                <span className="text-sm text-gris-medio">
                  {i.creado_en.toLocaleDateString('es-ES')}
                  {i.pagina ? ` · desde ${i.pagina}` : ''}
                </span>
              </header>

              <p className="mt-3 whitespace-pre-wrap text-carbon">{i.texto}</p>

              {i.email && (
                <p className="mt-3 text-sm text-gris-medio">
                  Quiere respuesta:{' '}
                  <a
                    className="underline underline-offset-4"
                    href={`mailto:${i.email}`}
                  >
                    {i.email}
                  </a>
                </p>
              )}

              <form action={marcarIncidencia} className="mt-4">
                <input type="hidden" name="id" value={i.id} />
                <input type="hidden" name="estado" value="resuelta" />
                <button className="rounded-lg border border-gris-borde px-4 py-2 text-sm font-semibold text-carbon hover:bg-gris-claro">
                  Marcar como resuelta
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      {resueltas.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-carbon">Ya resueltas</h2>
          <div className="mt-4 space-y-3">
            {resueltas.map((i) => (
              <article
                key={i.id}
                className="rounded-xl border border-gris-borde bg-gris-claro/40 p-4"
              >
                <p className="text-sm text-gris-medio">
                  {COMO_QUIEN[i.quien] ?? 'Alguien'} ·{' '}
                  {i.creado_en.toLocaleDateString('es-ES')}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-carbon">
                  {i.texto}
                </p>
                <form action={marcarIncidencia} className="mt-3">
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="estado" value="nueva" />
                  <button className="text-sm text-gris-medio underline underline-offset-4">
                    Devolver a pendientes
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
