import { redirect } from 'next/navigation';
import {
  actualizarPrecio,
  darVale,
  devolver,
} from '@/app/admin/cobros/acciones';
import {
  listarSolicitudes,
  pagosPorConfirmar,
  porQueNoSiguen,
} from '@/backend/repositories/solicitudes';
import { historialDePrecios, precioVigente } from '@/backend/repositories/tarifas';
import { correoConfigurado } from '@/backend/services/correo';
import { haySesion } from '@/backend/services/sesion-admin';
import { ConfirmadorBizum } from '@/frontend/features/administracion/confirmador-bizum';
import { SaludDelProceso } from '@/frontend/features/administracion/salud-del-proceso';
import { formatearTelefono } from '@/shared/schemas/telefono';
import {
  esMotivoCierre,
  PARA_EL_PROFESOR,
} from '@/shared/textos/motivos-cierre';

export const metadata = { title: 'Cobros · AcademiAvanza' };
export const dynamic = 'force-dynamic';

const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n,
  );

/** «hace 3 h», «hace 2 días». Recibe las horas ya contadas, no mira el reloj. */
function haceCuanto(horas: number): string {
  if (horas < 1) return 'hace un momento';
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  return `hace ${dias} día${dias === 1 ? '' : 's'}`;
}

/**
 * El mensaje que se manda por WhatsApp.
 *
 * Está escrito para alguien que abre el móvil en la cola del súper. Dice quién
 * escribe, qué quiere y qué tiene que hacer, en ese orden y en cuatro líneas.
 * El enlace va al final: un mensaje que empieza por un enlace parece una
 * estafa, y se borra sin leer.
 *
 * Va en primera persona del plural, como el resto de los textos, para que suene
 * a la plataforma y no a un mensaje personal de Lucía. Es lo que hace que el
 * profesor entienda que esto es un servicio y no un favor entre conocidos.
 */
function mensajeWhatsApp(datos: {
  nombre: string;
  nivel: string | null;
  enlace: string;
}): string {
  return [
    `Hola ${datos.nombre}, somos AcademiAvanza.`,
    '',
    `Una familia ha visto tu ficha y quiere clases${datos.nivel ? ` de ${datos.nivel}` : ''} contigo.`,
    '',
    'Aquí puedes ver lo que pide y decirnos si puedes cogerla o no. Si dices que sí, la familia paga el contacto y os pasamos el teléfono el uno del otro. Si no puedes, no pasa nada y nadie paga nada.',
    '',
    datos.enlace,
  ].join('\n');
}

/**
 * El WhatsApp a la familia cuando el correo no ha servido.
 *
 * Se le manda el enlace de su propia página, no el código suelto: ahí tiene las
 * instrucciones del Bizum y el botón para decir que lo deja.
 */
function enlaceWhatsAppFamilia(
  s: {
    nombre_familia: string;
    telefono_familia: string | null;
    token_familia: string;
  },
  base: string,
): string {
  const texto = [
    `Hola ${s.nombre_familia}, somos AcademiAvanza.`,
    '',
    'El profesor al que escribiste ha dicho que sí y está esperando. Aquí tienes lo que falta para que os paséis el teléfono, y también un botón por si al final no te hace falta:',
    '',
    `${base}/solicitud/${s.token_familia}`,
  ].join('\n');

  return `https://wa.me/34${(s.telefono_familia ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}

const ETIQUETA: Record<string, { texto: string; clase: string }> = {
  pendiente_profesor: {
    texto: 'esperando al profesor',
    clase: 'bg-gris-claro text-gris-medio',
  },
  aceptada: {
    texto: 'esperando el Bizum',
    clase: 'bg-amber-100 text-amber-800',
  },
  pagada: {
    texto: 'cobrada',
    clase: 'bg-verde-avanza-claro text-verde-avanza-oscuro',
  },
  rechazada: { texto: 'rechazada', clase: 'bg-gris-claro text-gris-medio' },
  caducada: { texto: 'caducada', clase: 'bg-gris-claro text-gris-medio' },
  cancelada: {
    texto: 'la familia lo dejó',
    clase: 'bg-gris-claro text-gris-medio',
  },
  devuelta: { texto: 'devuelta', clase: 'bg-amber-100 text-amber-800' },
};

export default async function PaginaCobros() {
  if (!(await haySesion())) redirect('/admin/entrar');

  const [solicitudes, precio, historial, motivos, dicenQueHanPagado] =
    await Promise.all([
      listarSolicitudes(),
      precioVigente(),
      historialDePrecios(),
      porQueNoSiguen(),
      pagosPorConfirmar(),
    ]);

  const totalMotivos = motivos.reduce((suma, m) => suma + m.veces, 0);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const esperandoBizum = solicitudes.filter((s) => s.estado === 'aceptada');
  const sinAvisar = solicitudes.filter(
    (s) => s.estado === 'pendiente_profesor',
  );

  /*
   * Pasadas veinticuatro horas deja de ser «aún no lo he mirado» y pasa a ser un
   * problema: hay una familia que ha pagado, no tiene el teléfono, y lleva un
   * día entero sin noticias.
   */
  const urgentes = dicenQueHanPagado.filter(
    (s) => s.horasEsperando >= 24,
  ).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-azul-confianza">Cobros</h1>
          <p className="mt-1 text-sm text-gris-medio">
            {esperandoBizum.length} esperando Bizum · {sinAvisar.length} sin
            avisar al profesor
          </p>
        </div>
        <a
          href="/admin"
          className="text-sm text-gris-medio underline underline-offset-4"
        >
          Fichas
        </a>
      </header>

      {/* Antes que nada: si el proceso diario no corre, lo demás importa menos. */}
      <SaludDelProceso />

      {/* ------------------------------------------------------------------ */}
      {/* Lo primero de la página, por encima incluso del confirmador: son las
          únicas filas en las que alguien ha puesto dinero y está esperando. */}
      {dicenQueHanPagado.length > 0 && (
        <section
          className={`mt-6 rounded-xl border-2 p-4 ${
            urgentes > 0
              ? 'border-error bg-red-50'
              : 'border-azul-confianza bg-white'
          }`}
        >
          <h2
            className={`font-bold ${urgentes > 0 ? 'text-error' : 'text-azul-confianza'}`}
          >
            {dicenQueHanPagado.length} dice
            {dicenQueHanPagado.length === 1 ? '' : 'n'} que ya ha
            {dicenQueHanPagado.length === 1 ? '' : 'n'} pagado
            {urgentes > 0 && ` · ${urgentes} lleva más de un día`}
          </h2>
          <p className="mt-1 text-sm text-carbon">
            Busca el Bizum por el código y confírmalo abajo. Hasta que lo hagas,
            esa familia ha pagado y no tiene el teléfono.
          </p>

          <ul className="mt-3 space-y-2">
            {dicenQueHanPagado.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gris-borde bg-white px-3 py-2 text-sm"
              >
                <span className="font-mono text-lg font-bold tracking-widest text-azul-confianza">
                  {s.codigo}
                </span>
                <span className="text-carbon">
                  {s.nombreFamilia} · {euros(s.importe)}
                </span>
                <span
                  className={
                    s.horasEsperando >= 24
                      ? 'font-semibold text-error'
                      : 'text-gris-medio'
                  }
                >
                  {haceCuanto(s.horasEsperando)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <ConfirmadorBizum />
      </div>

      {/* ------------------------------------------------------------------ */}
      {!correoConfigurado() && sinAvisar.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            Hay {sinAvisar.length} solicitud
            {sinAvisar.length === 1 ? '' : 'es'} que el profesor no sabe que
            tiene.
          </p>
          <p className="mt-1">
            El correo está apagado, así que el aviso no ha salido. Cópiale el
            enlace de abajo y mándaselo tú por WhatsApp.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-carbon">Solicitudes</h2>

        {solicitudes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-gris-borde p-6 text-center text-gris-medio">
            Todavía no ha escrito ninguna familia.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {solicitudes.map((s) => {
              const etiqueta = ETIQUETA[String(s.estado)] ?? {
                texto: String(s.estado),
                clase: 'bg-gris-claro text-gris-medio',
              };

              return (
                <article
                  key={s.id}
                  className="rounded-xl border border-gris-borde bg-white p-5"
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-bold text-azul-confianza">
                      {s.nombre_familia} → {s.profesores.nombre}{' '}
                      {s.profesores.apellidos}
                    </h3>
                    <span className="font-mono text-sm font-bold text-carbon">
                      {s.codigo}
                    </span>
                  </header>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${etiqueta.clase}`}
                    >
                      {etiqueta.texto}
                    </span>
                    <span className="text-gris-medio">
                      {new Date(s.enviado_en).toLocaleDateString('es-ES')}
                    </span>
                    <span className="text-gris-medio">
                      {s.niveles?.nombre ?? '—'}
                    </span>
                    <span className="font-medium text-carbon">
                      {s.vale_de ? 'con vale' : euros(Number(s.importe ?? 0))}
                    </span>
                  </div>

                  {s.mensaje && (
                    <blockquote className="mt-3 border-l-2 border-gris-borde pl-3 text-sm italic text-carbon">
                      «{s.mensaje}»
                    </blockquote>
                  )}

                  {s.motivo_rechazo && (
                    <p className="mt-3 rounded-lg bg-gris-claro p-3 text-sm text-carbon">
                      Dijo que no: {s.motivo_rechazo}
                    </p>
                  )}

                  {/* --- Lo que hay que hacer con ella ------------------- */}
                  <div className="mt-4 space-y-3 border-t border-gris-borde pt-4 text-sm">
                    {s.estado === 'pendiente_profesor' && (
                      <div>
                        <p className="text-gris-medio">
                          {s.avisado_push || s.avisado_correo
                            ? `Ya le hemos avisado ${[
                                s.avisado_push ? 'al móvil' : null,
                                s.avisado_correo ? 'por correo' : null,
                              ]
                                .filter(Boolean)
                                .join(' y ')}. Si no contesta, dale un toque:`
                            : 'No hemos podido avisarle. Dale un toque tú:'}
                        </p>

                        {/* Un solo botón. Abre WhatsApp con el mensaje escrito
                            y sólo hay que darle a enviar. No es automático
                            —para eso haría falta la API de Meta, que exige
                            verificar empresa y se lleva por delante el número—
                            pero es un toque y el profesor recibe algo con
                            sentido en vez de un enlace suelto. */}
                        <a
                          href={`https://wa.me/34${(s.profesores.telefono ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(
                            mensajeWhatsApp({
                              nombre: s.profesores.nombre,
                              nivel: s.niveles?.nombre ?? null,
                              enlace: `${base}/aceptar/${s.token_profesor}`,
                            }),
                          )}`}
                          target="_blank"
                          rel="noopener"
                          className="mt-3 inline-block rounded-lg bg-[#25D366] px-5 py-2.5 font-semibold text-white"
                        >
                          Avisar por WhatsApp
                        </a>

                        <p className="mt-3 text-xs text-gris-medio">
                          {s.profesores.email}
                          {s.profesores.telefono
                            ? ` · ${formatearTelefono(s.profesores.telefono)}`
                            : ' · sin teléfono'}
                        </p>
                      </div>
                    )}

                    {s.estado === 'aceptada' && (
                      <div>
                        <p className="text-carbon">
                          Ha aceptado. Esperando el Bizum con el concepto{' '}
                          <span className="font-mono font-bold">
                            {s.codigo}
                          </span>
                          .
                          {s.intencion_pago === 'si' &&
                            ' La familia dice que va a pagar.'}
                          {s.recordatorio_pago_en &&
                            !s.intencion_pago &&
                            ' Ya se le recordó y no ha contestado.'}
                        </p>

                        {/* El mismo recurso que con el profesor: si los avisos
                            automáticos no llegan, su teléfono lo tienes. */}
                        <a
                          href={enlaceWhatsAppFamilia(s, base)}
                          target="_blank"
                          rel="noopener"
                          className="mt-3 inline-block rounded-lg bg-[#25D366] px-5 py-2.5 font-semibold text-white"
                        >
                          Escribir a la familia
                        </a>
                      </div>
                    )}

                    {s.estado === 'pagada' && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-gris-medio">
                          Familia {formatearTelefono(s.telefono_familia ?? '')} ·
                          Profesor{' '}
                          {s.profesores.telefono
                            ? formatearTelefono(s.profesores.telefono)
                            : '—'}
                        </span>

                        {s.vale_concedido ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              s.motivo_vale === 'sin-contacto'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-verde-avanza-claro text-verde-avanza-oscuro'
                            }`}
                          >
                            {/* El motivo importa: «no consiguió hablar» señala
                                al profesor y cuenta para pausarle la ficha;
                                «no funcionó» no dice nada malo de nadie. */}
                            {s.motivo_vale === 'sin-contacto'
                              ? 'vale · no consiguió hablar con él'
                              : s.motivo_vale === 'no-funciono'
                                ? 'vale · hablaron y no funcionó'
                                : 'vale concedido a mano'}
                          </span>
                        ) : (
                          <form action={darVale}>
                            <input
                              type="hidden"
                              name="codigo"
                              value={s.codigo}
                            />
                            <button className="text-sm text-verde-avanza-oscuro underline underline-offset-4">
                              Darle un vale
                            </button>
                          </form>
                        )}

                        {/* La devolución la haces tú por Bizum; esto sólo deja
                            constancia de que la hiciste, de cuánto y de por
                            qué. Sin ella, dentro de dos meses hay un apunte en
                            el banco sin ninguna explicación. */}
                        <details className="w-full">
                          <summary className="cursor-pointer text-sm text-gris-medio">
                            He devuelto el dinero
                          </summary>

                          {/* El concepto del Bizum de vuelta.
                              Con el mismo código, la devolución y el cobro
                              quedan emparejados en el extracto del banco. Sin
                              eso son dos apuntes sueltos que dentro de dos
                              meses no hay quien relacione. */}
                          <p className="mt-2 rounded-lg bg-gris-claro px-3 py-2 text-sm text-carbon">
                            Al hacer el Bizum de vuelta a{' '}
                            <strong>
                              {formatearTelefono(s.telefono_familia ?? '')}
                            </strong>
                            , pon en el concepto:{' '}
                            <span className="font-mono font-bold">
                              Devolucion {s.codigo}
                            </span>
                          </p>

                          <form
                            action={devolver}
                            className="mt-2 flex flex-wrap gap-2"
                          >
                            <input
                              type="hidden"
                              name="codigo"
                              value={s.codigo}
                            />
                            <input
                              name="importe"
                              inputMode="decimal"
                              defaultValue={Number(s.importe ?? 0)}
                              className="w-20 rounded-lg border border-gris-borde px-2 py-1.5 text-sm"
                            />
                            <input
                              name="motivo"
                              placeholder="Por qué se lo devolviste"
                              className="min-w-0 flex-1 rounded-lg border border-gris-borde px-3 py-1.5 text-sm"
                            />
                            <button className="rounded-lg border border-gris-borde px-3 py-1.5 text-sm font-semibold text-carbon hover:bg-gris-claro">
                              Apuntarlo
                            </button>
                          </form>
                        </details>
                      </div>
                    )}

                    {s.estado === 'devuelta' && (
                      <p className="text-carbon">
                        Devuelto {euros(Number(s.importe_devuelto ?? 0))} el{' '}
                        {s.devuelta_en
                          ? new Date(s.devuelta_en).toLocaleDateString('es-ES')
                          : '—'}
                        {s.motivo_devolucion ? ` · ${s.motivo_devolucion}` : ''}
                      </p>
                    )}

                    {s.estado === 'cancelada' && (
                      <p className="text-gris-medio">
                        La familia dijo que al final no le hacía falta. Ya está
                        avisado el profesor.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ */}
      {/* Va justo encima del precio a propósito: es lo que hay que mirar
          antes de tocarlo. Si «no quería pagar por el contacto» empieza a
          subir, el problema no son los profesores. */}
      <section className="mt-12 border-t border-gris-borde pt-8">
        <h2 className="text-lg font-bold text-carbon">Por qué no siguen</h2>
        {totalMotivos === 0 ? (
          <p className="mt-2 text-sm text-gris-medio">
            Todavía no ha contestado nadie. Aparecerá aquí en cuanto alguna
            familia deje una solicitud a medias o pida otro contacto.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gris-medio">
              {totalMotivos} respuesta{totalMotivos === 1 ? '' : 's'} desde el
              principio. Esto no se lo enseñes a nadie: son los motivos en
              crudo, y el de arriba del todo es el que dice si el precio del
              contacto está frenando a la gente.
            </p>
            <ul className="mt-4 space-y-2">
              {motivos.map(({ motivo, veces }) => (
                <li
                  key={motivo}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gris-borde bg-white px-4 py-2.5 text-sm"
                >
                  <span
                    className={
                      motivo === 'coste-contacto'
                        ? 'font-semibold text-amber-800'
                        : 'text-carbon'
                    }
                  >
                    {esMotivoCierre(motivo) ? PARA_EL_PROFESOR[motivo] : motivo}
                  </span>
                  <span className="shrink-0 tabular-nums text-gris-medio">
                    {veces} · {Math.round((veces / totalMotivos) * 100)} %
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      <section className="mt-12 border-t border-gris-borde pt-8">
        <h2 className="text-lg font-bold text-carbon">Precio del contacto</h2>
        <p className="mt-1 text-sm text-gris-medio">
          Ahora mismo: <strong>{euros(precio)}</strong>. Cambiarlo no afecta a
          las solicitudes que ya existen: cada una se queda con lo que costaba
          cuando se creó.
        </p>

        <form action={actualizarPrecio} className="mt-4 flex flex-wrap gap-2">
          <input
            name="importe"
            inputMode="decimal"
            placeholder="10"
            className="w-24 rounded-lg border border-gris-borde px-3 py-2 text-carbon"
          />
          <input
            name="motivo"
            placeholder="Por qué lo cambias"
            className="min-w-0 flex-1 rounded-lg border border-gris-borde px-3 py-2 text-sm text-carbon"
          />
          <button className="rounded-lg border border-gris-borde px-4 py-2 text-sm font-semibold text-carbon hover:bg-gris-claro">
            Cambiar
          </button>
        </form>

        {historial.length > 1 && (
          <ul className="mt-4 space-y-1 text-sm text-gris-medio">
            {historial.map((t) => (
              <li key={t.id}>
                {euros(Number(t.importe))} desde{' '}
                {new Date(t.vigente_desde).toLocaleDateString('es-ES')}
                {t.vigente_hasta
                  ? ` hasta ${new Date(t.vigente_hasta).toLocaleDateString('es-ES')}`
                  : ' · vigente'}
                {t.motivo ? ` — ${t.motivo}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
