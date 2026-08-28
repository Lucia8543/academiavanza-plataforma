import { notFound } from 'next/navigation';
import {
  apuntarCupo,
  confirmar,
  pausar,
  reactivar,
} from '@/app/mi-ficha/[token]/acciones';
import { cargarCatalogos } from '@/backend/repositories/catalogos';
import {
  caducadasSinContestar,
  cargarMiFicha,
  seleccionActual,
} from '@/backend/repositories/mi-ficha';
import { profesorDelPanel } from '@/backend/services/acceso-profesor';
import { DarseDeBaja } from '@/frontend/features/portal-profesor/darse-de-baja';
import { SinContestar } from '@/frontend/features/portal-profesor/sin-contestar';
import { FormularioMiFicha } from '@/frontend/features/portal-profesor/formulario-mi-ficha';
import { DIAS, FRANJAS } from '@/shared/schemas/profesor';
import { CUPO_SE_CAMBIA } from '@/shared/textos/modalidad';
import { PARA_EL_PROFESOR } from '@/shared/textos/motivos-cierre';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mi ficha · AcademiAvanza',
  // Es una dirección privada: no debe acabar en un buscador.
  robots: { index: false, follow: false },
};

const DIA_CORTO = Object.fromEntries(DIAS.map((d) => [d.numero, d.corta]));

const MESES_HASTA_RECORDATORIO = 3;

export default async function PaginaMiFicha({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const profesorId = await profesorDelPanel(token);

  if (!profesorId) notFound();

  const [ficha, seleccion, catalogos, caducadas] = await Promise.all([
    cargarMiFicha(profesorId),
    seleccionActual(profesorId),
    cargarCatalogos(),
    caducadasSinContestar(profesorId),
  ]);

  if (!ficha || !seleccion) notFound();

  const publicada = ficha.estado === 'activo';
  const enElDirectorio = publicada && ficha.disponible;

  const tocaConfirmar =
    enElDirectorio && ficha.mesesSinConfirmar >= MESES_HASTA_RECORDATORIO;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza">
          Hola, {ficha.nombre}
        </h1>
        <p className="mt-2 text-carbon">
          Esta es tu ficha. Guarda esta dirección: es tu forma de entrar y no hay
          ninguna contraseña.
        </p>
      </header>

      {/* --- Estado ------------------------------------------------------- */}
      <section className="mt-8 rounded-xl border border-gris-borde bg-white p-5">
        {!publicada && ficha.estado === 'pendiente' && (
          <>
            <h2 className="font-bold text-azul-confianza">
              Todavía la estamos revisando
            </h2>
            <p className="mt-2 text-sm text-carbon">
              Te avisaremos por correo en cuanto esté publicada. Mientras tanto
              puedes cambiar lo que quieras aquí abajo.
            </p>
          </>
        )}

        {ficha.estado === 'rechazado' && (
          <>
            <h2 className="font-bold text-azul-confianza">
              No hemos podido publicarla
            </h2>
            {ficha.motivoRechazo && (
              <p className="mt-2 rounded-lg bg-gris-claro p-3 text-sm italic text-carbon">
                «{ficha.motivoRechazo}»
              </p>
            )}
            <p className="mt-2 text-sm text-carbon">
              Corrige lo que haga falta aquí abajo y la volvemos a mirar.
            </p>
          </>
        )}

        {publicada && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-azul-confianza">
                  {enElDirectorio
                    ? 'Tu ficha está publicada'
                    : 'Tu ficha está en pausa'}
                </h2>
                <p className="mt-1 text-sm text-gris-medio">
                  {enElDirectorio
                    ? 'Las familias pueden verte y escribirte.'
                    : 'No apareces en el directorio y no recibirás solicitudes. Nada se ha borrado.'}
                </p>
              </div>

              <form action={enElDirectorio ? pausar : reactivar}>
                <input type="hidden" name="token" value={token} />
                <button
                  className={
                    enElDirectorio
                      ? 'rounded-lg border border-gris-borde px-5 py-2.5 text-sm font-semibold text-carbon hover:bg-gris-claro'
                      : 'rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white hover:bg-verde-avanza-oscuro'
                  }
                >
                  {enElDirectorio ? 'Pausar mi ficha' : 'Volver al directorio'}
                </button>
              </form>
            </div>

            {enElDirectorio && (
              <>
                {/* Lo mismo que se le pregunta al aceptar, por si quiere
                    cambiarlo en otro momento. Quien va justo sigue apareciendo,
                    pero avisando: es lo que evita mandarle gente a alguien que
                    no puede cogerla, sin borrarle del directorio. */}
                <div className="mt-4 border-t border-gris-borde pt-4">
                  <p className="text-sm font-medium text-carbon">
                    {ficha.cupo === 'busca'
                      ? 'Ahora mismo apareces como que buscas alumnos.'
                      : 'Ahora mismo apareces como que vas justo de sitio.'}
                  </p>
                  <p className="mt-1 text-sm text-gris-medio">
                    {ficha.cupo === 'busca'
                      ? 'Sales delante de los que van llenos. Si te llenas, dínoslo aquí y dejaremos de mandarte gente.'
                      : 'Sigues en el directorio, pero avisamos a las familias de que ya tienes alumnos, y sales detrás de los que buscan.'}
                  </p>
                  <p className="mt-1 text-sm text-gris-medio">
                    {CUPO_SE_CAMBIA}
                  </p>

                  <form action={apuntarCupo} className="mt-3">
                    <input type="hidden" name="token" value={token} />
                    <input
                      type="hidden"
                      name="cupo"
                      value={ficha.cupo === 'busca' ? 'justo' : 'busca'}
                    />
                    <button className="rounded-lg border border-gris-borde px-4 py-2 text-sm font-semibold text-carbon hover:bg-gris-claro">
                      {ficha.cupo === 'busca'
                        ? 'Voy justo, avisadlo'
                        : 'Ya puedo coger más alumnos'}
                    </button>
                  </form>
                </div>

                <p className="mt-4 border-t border-gris-borde pt-4 text-sm">
                  <a
                    href={`/profesor/${ficha.slug}`}
                    className="text-verde-avanza-oscuro underline underline-offset-4"
                  >
                    Ver cómo te ven las familias
                  </a>
                </p>
              </>
            )}
          </>
        )}
      </section>

      {/* Las solicitudes que se le han pasado. Va aquí arriba, no escondido al
          final, porque a las cinco le sale la ficha del directorio y tiene que
          poder verlo venir. */}
      <SinContestar caducadas={caducadas} />

      {/* --- ¿Sigues disponible? ------------------------------------------ */}
      {tocaConfirmar && (
        <section className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-900">¿Sigues cogiendo alumnos?</h2>
          <p className="mt-2 text-sm text-amber-900">
            Hace {ficha.mesesSinConfirmar} meses que no nos lo confirmas. Es
            para que ninguna familia escriba a alguien que ya no da clase.
          </p>
          <form action={confirmar} className="mt-4">
            <input type="hidden" name="token" value={token} />
            <button className="rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white hover:bg-verde-avanza-oscuro">
              Sí, sigo disponible
            </button>
          </form>
        </section>
      )}

      {/* --- Solicitudes sin contestar ------------------------------------ */}
      {ficha.pendientes.length > 0 && (
        <section className="mt-6 rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-5">
          <h2 className="font-bold text-verde-avanza-oscuro">
            Tienes {ficha.pendientes.length}{' '}
            {ficha.pendientes.length === 1 ? 'familia' : 'familias'} esperando tu
            respuesta
          </h2>
          <ul className="mt-3 space-y-2">
            {ficha.pendientes.map((s) => (
              <li key={s.token}>
                <a
                  href={`/aceptar/${s.token}`}
                  className="font-medium text-verde-avanza-oscuro underline underline-offset-4"
                >
                  {s.nivel ?? 'Solicitud'} ·{' '}
                  {new Date(s.enviadaEn).toLocaleDateString('es-ES')}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Resumen ------------------------------------------------------ */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-carbon">Cómo estás ahora</h2>
        <dl className="mt-3 space-y-2 rounded-xl border border-gris-borde bg-gris-claro p-5 text-sm">
          <div>
            <dt className="inline font-medium text-carbon">En el directorio: </dt>
            <dd className="inline text-carbon">{ficha.nombrePublico}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-carbon">Colegio: </dt>
            <dd className="inline text-carbon">{ficha.colegio ?? '—'}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-carbon">Contacto: </dt>
            <dd className="inline text-carbon">
              {ficha.email} · {ficha.telefono}
            </dd>
          </div>
          {ficha.disponibilidad.length > 0 && (
            <div>
              <dt className="inline font-medium text-carbon">Horario: </dt>
              <dd className="inline text-carbon">
                {ficha.disponibilidad
                  .map(
                    (d) =>
                      `${DIA_CORTO[d.dia]} ${FRANJAS[d.franja].etiqueta.toLowerCase()}`,
                  )
                  .join(' · ')}
              </dd>
            </div>
          )}
          {ficha.contactosPagados > 0 && (
            <div>
              <dt className="inline font-medium text-carbon">
                Familias que han contactado contigo:{' '}
              </dt>
              <dd className="inline text-carbon">{ficha.contactosPagados}</dd>
            </div>
          )}
        </dl>
        <p className="mt-2 text-xs text-gris-medio">
          El nombre y el colegio no se pueden cambiar desde aquí, porque son lo
          que revisamos antes de publicar. Si hay un error, escríbenos a
          info@academiavanza.es.
        </p>
      </section>

      {/* --- Por qué no siguieron ----------------------------------------- */}
      {ficha.motivosCierre.length > 0 && (
        <section className="mt-10 border-t border-gris-borde pt-8">
          <h2 className="text-lg font-bold text-carbon">
            Por qué no siguieron algunas familias
          </h2>
          <p className="mt-2 text-sm text-gris-medio">
            Cuando una familia no sigue adelante le preguntamos por qué, y aquí
            está lo que han contestado en los últimos seis meses. Casi nunca
            tiene que ver contigo: lo normal es que no cuadre un horario o que
            les quede lejos.
          </p>

          <ul className="mt-4 space-y-2">
            {ficha.motivosCierre.map(({ motivo, veces }) => (
              <li
                key={motivo}
                className="flex items-center justify-between gap-4 rounded-lg border border-gris-borde bg-white px-4 py-3 text-sm"
              >
                <span className="text-carbon">{PARA_EL_PROFESOR[motivo]}</span>
                <span className="shrink-0 rounded-full bg-gris-claro px-2.5 py-0.5 text-xs font-semibold text-gris-medio">
                  {veces === 1 ? 'una familia' : `${veces} familias`}
                </span>
              </li>
            ))}
          </ul>

          {/*
            No se dice qué familia dijo qué, ni cuándo. Con pocas solicitudes al
            trimestre, una fecha basta para ponerle nombre y apellidos a una
            opinión, y eso convertiría una pregunta útil en una delación.
          */}
          <p className="mt-3 text-xs text-gris-medio">
            No te decimos quién ha dicho cada cosa ni cuándo, y a las familias
            les avisamos de ello antes de contestar. Esto es para que sepas por
            dónde van las cosas, no para que averigües quién fue.
          </p>
        </section>
      )}

      {/* --- Edición ------------------------------------------------------ */}
      <section className="mt-10 border-t border-gris-borde pt-8">
        <h2 className="text-lg font-bold text-carbon">Cambiar mi ficha</h2>
        <FormularioMiFicha
          token={token}
          catalogos={catalogos}
          seleccion={seleccion}
          telefono={ficha.telefono}
          email={ficha.email}
          puntosFuertes={ficha.puntosFuertes ?? ''}
          anosExperiencia={
            ficha.anosExperiencia === null ? '' : String(ficha.anosExperiencia)
          }
          modalidad={ficha.modalidad}
          zona={ficha.zona ?? ''}
          desplazamientoFlexible={ficha.desplazamientoFlexible}
        />
      </section>

      {/* La baja va al final, sin llamar la atención, pero existe. La política
          de privacidad la promete «desde el enlace de tu ficha». */}
      <DarseDeBaja token={token} />
    </main>
  );
}
