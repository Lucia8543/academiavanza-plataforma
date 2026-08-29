import { redirect } from 'next/navigation';
import { salir } from '@/app/admin/acciones';
import {
  listarPausadasSolas,
  listarPendientes,
  listarRevisadas,
} from '@/backend/repositories/profesores';
import {
  aPuntoDeCaducar,
  contarPorEstado,
} from '@/backend/repositories/solicitudes';
import { correoConfigurado } from '@/backend/services/correo';
import { incidenciasSinResolver } from '@/backend/services/incidencias';
import { haySesion } from '@/backend/services/sesion-admin';
import { RescatePorWhatsApp } from '@/frontend/features/administracion/rescate-por-whatsapp';
import { SaludDelProceso } from '@/frontend/features/administracion/salud-del-proceso';
import { TarjetaFicha } from '@/frontend/features/administracion/tarjeta-ficha';

export const metadata = { title: 'Panel · AcademiAvanza' };

// Nunca se guarda en caché: aquí se viene a ver el estado de ahora.
export const dynamic = 'force-dynamic';

export default async function PaginaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  if (!(await haySesion())) redirect('/admin/entrar');

  const { aviso } = await searchParams;

  const [
    pendientes,
    revisadas,
    porEstado,
    pausadasSolas,
    porPerderse,
    sinResolver,
  ] =
    await Promise.all([
      listarPendientes(),
      listarRevisadas(),
      contarPorEstado(),
      listarPausadasSolas(),
      aPuntoDeCaducar(),
      incidenciasSinResolver(),
    ]);

  const publicadas = revisadas.filter((f) => f.estado === 'activo');
  const esperandoBizum = porEstado.aceptada ?? 0;
  const sinAvisar = porEstado.pendiente_profesor ?? 0;

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

      {/*
        El rechazo que no se guardó.

        Va arriba del todo y en rojo porque lo que hay que entender es que **no
        se ha hecho nada**: la ficha sigue pendiente y al profesor no le ha
        llegado ningún correo. Un aviso discreto aquí haría creer que se
        rechazó y que sólo hubo una pega de forma.
      */}
      {aviso === 'motivo-sensible' && (
        <div
          role="alert"
          className="mt-6 rounded-xl border-2 border-error bg-red-50 p-4"
        >
          <h2 className="font-bold text-error">No se ha rechazado la ficha</h2>
          <p className="mt-1 text-sm leading-relaxed text-carbon">
            El motivo que has escrito menciona algo que parece un dato de salud.
            Ese texto se le manda al profesor por correo y se queda guardado en
            su ficha, así que no lo hemos guardado.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gris-medio">
            La ficha sigue pendiente y él no ha recibido nada. Vuelve a
            rechazarla explicando qué falta en la ficha, sin mencionar
            diagnósticos ni salud de nadie.
          </p>
        </div>
      )}

      <SaludDelProceso />

      {/* ---------------------------------------------------------------- */}
      {/*
        Profesores que han salido del directorio sin pedirlo.
        Ya se les ha avisado por correo y por el móvil, pero ninguno de los dos
        llega siempre. Esto es la tercera red: si el directorio se queda corto,
        aquí está la explicación y el teléfono para llamar.
      */}
      {pausadasSolas.length > 0 && (
        <section className="mt-6 rounded-xl border border-aviso bg-amber-50 p-4">
          <h2 className="font-bold text-amber-900">
            {pausadasSolas.length} ficha{pausadasSolas.length === 1 ? '' : 's'} se
            ha{pausadasSolas.length === 1 ? '' : 'n'} pausado sola
            {pausadasSolas.length === 1 ? '' : 's'}
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Dos familias no consiguieron hablar con ell{pausadasSolas.length === 1 ? 'a' : 'as'}.
            Ya se le{pausadasSolas.length === 1 ? '' : 's'} ha avisado, pero puede que
            no se hayan enterado. Vuelven al directorio en cuanto entren en su
            enlace y le den a reactivar.
          </p>
          <ul className="mt-3 space-y-1">
            {pausadasSolas.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-carbon">
                  {p.nombre} {p.apellidos}
                </span>
                <span className="text-gris-medio">{p.telefono ?? p.email}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      <a
        href="/admin/cobros"
        className="mt-6 flex items-center justify-between gap-3 rounded-xl border-2 border-azul-confianza bg-white p-5 transition hover:bg-gris-claro"
      >
        <div>
          <h2 className="font-bold text-azul-confianza">Cobros</h2>
          <p className="mt-1 text-sm text-gris-medio">
            {esperandoBizum} esperando Bizum · {sinAvisar} sin avisar al profesor
          </p>
        </div>
        <span className="text-2xl text-azul-confianza">→</span>
      </a>

      <a
        href="/admin/buzon"
        className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gris-borde bg-white p-5 transition hover:bg-gris-claro"
      >
        <div>
          <h2 className="font-bold text-azul-confianza">Buzón</h2>
          <p className="mt-1 text-sm text-gris-medio">
            {sinResolver === 0
              ? 'Nadie ha contado ningún fallo'
              : sinResolver === 1
                ? '1 fallo contado sin resolver'
                : `${sinResolver} fallos contados sin resolver`}
          </p>
        </div>
        <span className="text-2xl text-azul-confianza">→</span>
      </a>

      {!correoConfigurado() && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">El envío de correo está apagado.</p>
          <p className="mt-1">
            Ni los profesores se enteran de que tienen una solicitud, ni las
            familias de que han sido aceptadas. Hasta que el dominio esté
            verificado tienes que avisar tú, desde la pantalla de cobros.
          </p>
        </div>
      )}

      {/* ----------------------------------------------------------------
          El rescate va antes de «por revisar» porque tiene fecha límite y
          revisar fichas no. Si sólo da tiempo a mirar una cosa, que sea ésta.
      */}
      <RescatePorWhatsApp
        filas={porPerderse}
        base={process.env.NEXT_PUBLIC_APP_URL ?? 'https://academiavanza.es'}
      />

      {/* ---------------------------------------------------------------- */}
      <section className="mt-12">
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
