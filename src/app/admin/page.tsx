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

/**
 * Una casilla que filtra la lista de un solo clic.
 *
 * Por dentro es un formulario diminuto con un botón, y las tres alternativas se
 * descartaron por un motivo cada una:
 *
 * Una casilla de verdad, `<input type="checkbox">`, obligaría a marcarla y
 * después pulsar «Buscar», que son dos gestos para una decisión que se toma en
 * uno.
 *
 * Un enlace con `aria-pressed` es lo que había aquí primero, y ESLint lo tumbó
 * con razón: `aria-pressed` describe algo que se queda pulsado, y un enlace no
 * se queda pulsado, lleva a otro sitio. Un lector de pantalla habría anunciado
 * una contradicción.
 *
 * Un botón con JavaScript funcionaría, y no hace falta. Así esto sigue yendo
 * con JavaScript desactivado, que es como llega media web cuando algo falla.
 *
 * El cuadrito es un `span` dibujado en vez del cuadrito del navegador, para que
 * el botón entero sea la zona pulsable y no sólo cuatro píxeles. Va marcado
 * como decorativo, porque quien no lo ve ya tiene el estado en `aria-pressed`.
 */
function Casilla({
  busqueda,
  destino,
  activa,
  texto,
}: {
  busqueda: string;
  destino: 'solo' | 'sin';
  activa: boolean;
  texto: string;
}) {
  return (
    <form action="/admin">
      {/* Filtrar no borra la búsqueda que hubiera puesta. */}
      {busqueda && <input type="hidden" name="q" value={busqueda} />}

      {/* Si ya está activa no se manda nada, y así el mismo botón la apaga y
          devuelve la lista completa. Es lo que la hace comportarse como una
          casilla y no como dos botones que se pisan. */}
      {!activa && <input type="hidden" name="marcados" value={destino} />}

      <button
        type="submit"
        aria-pressed={activa}
        className={
          'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ' +
          (activa
            ? 'border-purple-700 bg-purple-700 text-white'
            : 'border-purple-300 bg-white text-purple-900 hover:bg-purple-100')
        }
      >
        <span
          aria-hidden="true"
          className={
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[11px] font-bold leading-none ' +
            (activa
              ? 'border-white bg-white text-purple-700'
              : 'border-purple-400 bg-white text-transparent')
          }
        >
          ✓
        </span>
        {texto}
      </button>
    </form>
  );
}

// Nunca se guarda en caché: aquí se viene a ver el estado de ahora.
export const dynamic = 'force-dynamic';

export default async function PaginaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; q?: string; marcados?: string }>;
}) {
  if (!(await haySesion())) redirect('/admin/entrar');

  const { aviso, q, marcados } = await searchParams;
  const busqueda = (q ?? '').trim();

  /*
   * Qué hacer con las fichas que el detector antibots marcó.
   *
   * Tres estados y no dos, porque las dos preguntas que se hacen delante de
   * esta lista son distintas. Una es «enséñame lo raro para mirarlo»; la otra
   * es «quítame lo raro de en medio para trabajar tranquila». Con un solo
   * interruptor sólo se puede contestar a una de las dos.
   */
  const soloMarcados = marcados === 'solo';
  const sinMarcados = marcados === 'sin';

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

  /*
   * El buscador del panel.
   *
   * Filtra en memoria y no en la base de datos porque la lista entera son
   * ciento y pico fichas: traerlas todas y descartar aquí cuesta menos que una
   * consulta más, y evita tocar los repositorios.
   *
   * Se comparan las cadenas sin tildes y en minúsculas. Media academia se llama
   * «Martínez» o «Peñalver», y un buscador que no encuentra a María porque
   * escribiste «Maria» es un buscador que no se usa.
   */
  const sinTildes = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const coincide = (f: (typeof revisadas)[number]) => {
    if (!busqueda) return true;
    const donde = sinTildes(
      [
        f.nombre,
        f.apellidos,
        f.email,
        f.telefono ?? '',
        f.colegios?.nombre ?? '',
        f.colegios?.nombre_corto ?? '',
        f.colegio_otro ?? '',
      ].join(' '),
    );
    // Cada palabra por separado: «maria garcia» encuentra a María de los
    // Ángeles García, que escrito del tirón no saldría.
    return sinTildes(busqueda)
      .split(/\s+/)
      .every((palabra) => donde.includes(palabra));
  };

  /*
   * El filtro de marcados, que se suma al buscador en vez de sustituirlo.
   *
   * Existe porque el detector antibots ya no descarta nada, sino que marca y
   * deja pasar (ADR 0009). Sin una forma de separarlas, esa marca sería una
   * etiqueta escondida en medio de ciento y pico fichas, que es casi lo mismo
   * que no ponerla.
   */
  const pasaElFiltro = (f: { sospecha_bot: string | null }) => {
    if (soloMarcados) return f.sospecha_bot !== null;
    if (sinMarcados) return f.sospecha_bot === null;
    return true;
  };

  const pendientesVistas = pendientes.filter(coincide).filter(pasaElFiltro);
  const revisadasVistas = revisadas.filter(coincide).filter(pasaElFiltro);
  const encontradas = pendientesVistas.length + revisadasVistas.length;

  // Sobre el total y no sobre lo filtrado. Es el número que decide si el
  // control llega a enseñarse, así que tiene que contar también las que la
  // búsqueda de ese momento esté escondiendo.
  const cuantosMarcados =
    pendientes.filter((f) => f.sospecha_bot !== null).length +
    revisadas.filter((f) => f.sospecha_bot !== null).length;

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
      {/*
        Buscar por nombre, correo, teléfono o colegio.

        Es un formulario normal que recarga la página, no un filtro que va
        escribiendo. Con ciento y pico fichas la diferencia no se nota, y así
        funciona igual sin JavaScript y la búsqueda queda en la dirección: se
        puede guardar en favoritos o mandársela a alguien.
      */}
      <form action="/admin" className="mt-12 flex flex-wrap gap-2">
        {/* Buscar no deshace el filtro de marcados. Sin esta línea, escribir un
            nombre devolvería la lista completa y parecería que la casilla se
            había desmarcado sola. */}
        {marcados && <input type="hidden" name="marcados" value={marcados} />}

        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre, correo, teléfono o colegio"
          aria-label="Buscar una ficha"
          className="min-w-0 flex-1 rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza"
        />
        <button className="rounded-lg bg-azul-confianza px-5 py-2 font-semibold text-white transition hover:opacity-90">
          Buscar
        </button>
        {(busqueda || soloMarcados || sinMarcados) && (
          <a
            href="/admin"
            className="rounded-lg border border-gris-borde px-4 py-2 text-sm font-semibold text-carbon transition hover:bg-gris-claro"
          >
            Quitar
          </a>
        )}
      </form>

      {/*
        Las dos casillas de los marcados como posible robot.

        Son enlaces con aspecto de casilla, no casillas de un formulario, y es a
        propósito: una casilla de verdad obligaría a pulsarla y después pulsar
        «Buscar», que son dos gestos para una decisión que se toma en uno. Así
        cada clic aplica el filtro y además funciona sin JavaScript.

        Sólo aparecen si hay alguna marcada. Un control permanente que casi
        siempre lleva a una lista vacía acaba formando parte del decorado, y el
        día que haya algo tampoco se leerá.
      */}
      {cuantosMarcados > 0 && (
        <fieldset className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3">
          <legend className="px-1 text-sm font-medium text-purple-900">
            {cuantosMarcados === 1
              ? '1 ficha llegó con pinta de envío automático'
              : `${cuantosMarcados} fichas llegaron con pinta de envío automático`}
          </legend>

          <div className="flex flex-wrap gap-2">
            <Casilla
              busqueda={busqueda}
              destino="solo"
              activa={soloMarcados}
              texto="Ver sólo ésas"
            />
            <Casilla
              busqueda={busqueda}
              destino="sin"
              activa={sinMarcados}
              texto="Quitarlas de la lista"
            />
          </div>

          <p className="mt-2 text-xs leading-relaxed text-purple-900">
            Están publicadas o pendientes como cualquier otra. La marca es sólo
            un aviso, y vuelve a pulsar la misma casilla para verlas todas otra
            vez.
          </p>
        </fieldset>
      )}

      {busqueda && (
        <p role="status" className="mt-2 text-sm text-gris-medio">
          {encontradas === 0
            ? `Ninguna ficha con «${busqueda}».`
            : encontradas === 1
              ? `1 ficha con «${busqueda}».`
              : `${encontradas} fichas con «${busqueda}».`}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-carbon">
          Por revisar
          {pendientesVistas.length > 0 && (
            <span className="ml-2 rounded-full bg-aviso px-2 py-0.5 text-sm text-white">
              {pendientesVistas.length}
            </span>
          )}
        </h2>

        {pendientesVistas.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-gris-borde p-6 text-center text-gris-medio">
            {/* «Nada pendiente» a secas, con un filtro puesto, es mentira: hay
                fichas esperando y lo que pasa es que están escondidas. Quien lo
                lea así cerrará el móvil creyendo que no hay nada que hacer. */}
            {soloMarcados
              ? 'Ninguna por revisar de las marcadas.'
              : sinMarcados
                ? 'Ninguna por revisar, quitando las marcadas.'
                : busqueda
                  ? 'Ninguna por revisar con esa búsqueda.'
                  : 'Nada pendiente. Puedes cerrar el móvil.'}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendientesVistas.map((f) => (
              <TarjetaFicha key={f.id} f={f} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {revisadasVistas.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-carbon">Ya revisadas</h2>
          <div className="mt-4 space-y-4">
            {revisadasVistas.map((f) => (
              <TarjetaFicha key={f.id} f={f} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
