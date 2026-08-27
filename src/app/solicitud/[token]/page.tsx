import { notFound } from 'next/navigation';
import {
  otrasDeLaMismaFamilia,
  porTokenFamilia,
} from '@/backend/repositories/solicitudes';
import { DIAS_PARA_RECLAMAR } from '@/backend/services/solicitud';
import { hePagado } from '@/app/solicitud/[token]/acciones';
import { CorreoFamilia } from '@/frontend/features/directorio/correo-familia';
import { Dejarlo } from '@/frontend/features/directorio/dejarlo';
import { GuardarEnlace } from '@/frontend/features/directorio/guardar-enlace';
import { ReclamarVale } from '@/frontend/features/directorio/reclamar-vale';
import { formatearTelefono } from '@/shared/schemas/telefono';
import { porHora } from '@/shared/textos/precios';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tu solicitud · AcademiAvanza',
  // Una dirección privada no debe acabar en un buscador.
  robots: { index: false, follow: false },
};

/** Cómo se ve cada estado en la lista de «tus otras solicitudes». */
const ETIQUETA: Record<string, { texto: string; clase: string }> = {
  pendiente_profesor: {
    texto: 'esperando respuesta',
    clase: 'bg-gris-claro text-gris-medio',
  },
  aceptada: { texto: 'falta pagar', clase: 'bg-amber-100 text-amber-800' },
  pagada: {
    texto: 'ya podéis hablar',
    clase: 'bg-verde-avanza-claro text-verde-avanza-oscuro',
  },
  rechazada: { texto: 'no pudo', clase: 'bg-gris-claro text-gris-medio' },
  caducada: { texto: 'sin respuesta', clase: 'bg-gris-claro text-gris-medio' },
};

const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n,
  );

function Paso({
  numero,
  titulo,
  estado,
  children,
}: {
  numero: number;
  titulo: string;
  estado: 'hecho' | 'ahora' | 'pendiente';
  children?: React.ReactNode;
}) {
  const circulo =
    estado === 'hecho'
      ? 'bg-verde-avanza text-white'
      : estado === 'ahora'
        ? 'bg-azul-confianza text-white'
        : 'bg-gris-claro text-gris-medio';

  return (
    <li className="flex gap-4">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${circulo}`}
      >
        {estado === 'hecho' ? '✓' : numero}
      </span>
      <div className="flex-1 pb-6">
        <h3
          className={`font-semibold ${estado === 'pendiente' ? 'text-gris-medio' : 'text-carbon'}`}
        >
          {titulo}
        </h3>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

export default async function PaginaSolicitud({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const s = await porTokenFamilia(token);

  if (!s) notFound();

  // Sus otras solicitudes: una familia con dos hijos acaba con tres o cuatro
  // enlaces sueltos por el correo, y desde cualquiera puede llegar al resto.
  const otras = await otrasDeLaMismaFamilia(s.telefonoFamilia, token);

  const bizum = process.env.BIZUM_TELEFONO;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza">
        Tu solicitud a {s.profesor}
      </h1>
      <p className="mt-2 text-carbon">
        {s.colegio ? `De ${s.colegio}. ` : ''}
        {s.nivel ? `Para ${s.nivel}.` : ''}
      </p>

      <GuardarEnlace codigo={s.codigo} email={s.emailFamilia ?? null} />

      {/* Aquí es donde se caza un correo mal tecleado: la familia acaba de
          llegar de enviar el formulario y todavía se acuerda de lo que
          escribió. Después ya no vuelve, porque no le llega ningún aviso. */}
      {s.emailFamilia && (
        <CorreoFamilia token={token} email={s.emailFamilia} />
      )}

      {/* ------------------------------------------------------------------ */}
      <ol className="mt-10">
        <Paso numero={1} titulo="Has escrito a este profesor" estado="hecho">
          <p className="text-sm text-gris-medio">
            El {new Date(s.enviadaEn).toLocaleDateString('es-ES')}. Todavía no
            tiene tu teléfono.
          </p>
        </Paso>

        {/* --- Paso 2: la decisión ---------------------------------------- */}
        {s.estado === 'pendiente_profesor' && (
          <Paso numero={2} titulo="Esperando a que conteste" estado="ahora">
            <p className="text-sm text-carbon">
              Le hemos avisado. Suele contestar en un día o dos. Si dice que no,
              no pagas nada y puedes escribir a otro.
            </p>
          </Paso>
        )}

        {s.estado === 'rechazada' && (
          <Paso numero={2} titulo="No puede cogerte ahora" estado="ahora">
            <div className="rounded-lg border border-gris-borde bg-white p-4">
              {s.motivoRechazo && (
                <p className="text-sm italic text-carbon">«{s.motivoRechazo}»</p>
              )}
              <p className="mt-2 text-sm text-carbon">
                No has pagado nada y no vas a pagar nada por esto.
              </p>
              <a
                href="/profesores"
                className="mt-3 inline-block rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white"
              >
                Buscar otro profesor
              </a>
            </div>
          </Paso>
        )}

        {(s.estado === 'aceptada' ||
          s.estado === 'pagada' ||
          s.estado === 'devuelta' ||
          s.estado === 'cancelada') && (
          <Paso numero={2} titulo="Ha aceptado" estado="hecho" />
        )}

        {/* Se cerró sin que el profesor llegara a contestar. */}
        {s.estado === 'caducada' && (
          <Paso numero={2} titulo="Esta solicitud se ha cerrado" estado="ahora">
            <div className="rounded-lg border border-gris-borde bg-gris-claro p-4">
              <p className="text-sm text-carbon">
                Ha pasado el plazo sin que se completara. No has pagado nada.
                Puedes escribir a otro profesor, o a este mismo otra vez.
              </p>
              <a
                href="/profesores"
                className="mt-3 inline-block rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white"
              >
                Ver el directorio
              </a>
            </div>
          </Paso>
        )}

        {/* --- Paso 3: el pago -------------------------------------------- */}
        {/*
          Quien ya ha avisado de que ha pagado no vuelve a ver las instrucciones
          del Bizum. Dejárselas delante, con el código en grande y el importe,
          es indistinguible de decirle que no nos ha llegado: la mitad pagaría
          dos veces y la otra mitad escribiría preguntando qué ha fallado.
        */}
        {s.estado === 'aceptada' && s.avisoDePago && (
          <Paso numero={3} titulo="Comprobando tu pago" estado="ahora">
            <div className="rounded-xl border-2 border-azul-confianza bg-white p-5">
              <p className="text-carbon">
                <strong>Nos has dicho que ya has hecho el Bizum.</strong> Lo
                comprobamos a mano, así que puede tardar un rato —más si es de
                noche o fin de semana—. En cuanto lo veamos se abre el contacto
                y aparece aquí el teléfono.
              </p>
              <p className="mt-3 text-sm text-gris-medio">
                No tienes que hacer nada más, y no vamos a volver a pedírtelo. Si
                pasan más de dos días, escríbenos a{' '}
                <a
                  href="mailto:info@academiavanza.es"
                  className="underline underline-offset-4"
                >
                  info@academiavanza.es
                </a>{' '}
                con tu código <strong className="font-mono">{s.codigo}</strong>.
              </p>
            </div>
          </Paso>
        )}

        {s.estado === 'aceptada' && !s.avisoDePago && (
          <Paso numero={3} titulo="Haz el Bizum" estado="ahora">
            <div className="rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-5">
              {s.gratisPorVale ? (
                <p className="text-carbon">
                  Este contacto no te cuesta nada: estás usando el vale del
                  anterior. No tienes que hacer nada, recarga en un momento.
                </p>
              ) : (
                <>
                  <p className="text-carbon">
                    Envía <strong>{euros(s.importe)}</strong> por Bizum
                    {bizum ? (
                      <>
                        {' '}
                        al <strong>{formatearTelefono(bizum)}</strong>
                      </>
                    ) : null}{' '}
                    poniendo esto en el concepto:
                  </p>

                  <p className="my-4 text-center font-mono text-3xl font-bold tracking-widest text-verde-avanza-oscuro">
                    {s.codigo}
                  </p>

                  <p className="text-sm text-carbon">
                    Sin el código no sabremos que ese Bizum es tuyo. Cópialo tal
                    cual.
                  </p>

                  {/* Lo que se paga aquí es el contacto, no las clases. Sin
                      esta línea, alguien puede pagar creyendo que ya está todo
                      arreglado y descubrir el precio de la hora en la llamada.
                      Es la causa más evitable de «he pagado en vano». */}
                  <p className="mt-4 border-t border-verde-avanza pt-3 text-sm text-carbon">
                    <span className="font-medium">
                      Esto paga el contacto, no las clases.
                    </span>{' '}
                    {s.precioReferencia !== null ? (
                      <>
                        La hora de {s.nivel} está en{' '}
                        <strong>{porHora(s.precioReferencia)}</strong> de
                        referencia, pero el precio lo acordáis vosotros en la
                        primera llamada.
                      </>
                    ) : (
                      <>
                        Cuánto cobra por hora lo acordáis vosotros en la primera
                        llamada.
                      </>
                    )}{' '}
                    Si no os ponéis de acuerdo, dínoslo y te damos otro contacto
                    sin pagar.
                  </p>
                </>
              )}

              {/*
                El botón de «ya está» va aquí y no escondido abajo, porque es lo
                que hace la familia justo después de salir de la aplicación del
                banco. Sin él, la plataforma no distingue a quien ha pagado de
                quien no, y acaba reclamándole el pago y cerrándole la solicitud
                a alguien que ya ha puesto su dinero.
              */}
              {!s.gratisPorVale && (
                <form
                  action={hePagado}
                  className="mt-4 border-t border-verde-avanza pt-4"
                >
                  <input type="hidden" name="token" value={token} />
                  <button className="w-full rounded-lg bg-verde-avanza px-5 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro">
                    Ya he hecho el Bizum
                  </button>
                  <p className="mt-2 text-center text-xs text-gris-medio">
                    Púlsalo al volver del banco. Así sabemos que hay un pago
                    tuyo esperando y dejamos de darte la lata.
                  </p>
                </form>
              )}

              <p className="mt-4 border-t border-verde-avanza pt-3 text-sm text-gris-medio">
                Comprobamos los pagos a mano, así que puede pasar un rato hasta
                que se abra —más si es de noche o fin de semana—. Te avisaremos
                por correo en cuanto esté.
              </p>

              {s.intencionPago !== 'si' && <Dejarlo token={token} />}

              {s.intencionPago === 'si' && (
                <p className="mt-3 text-sm text-gris-medio">
                  Nos has dicho que vas a pagar. Aquí seguimos cuando lo hagas.
                </p>
              )}
            </div>
          </Paso>
        )}

        {s.estado === 'pagada' && (
          <Paso numero={3} titulo="Pago recibido" estado="hecho" />
        )}

        {s.estado === 'cancelada' && (
          <Paso numero={3} titulo="Lo dejaste aquí" estado="ahora">
            <div className="rounded-lg border border-gris-borde bg-gris-claro p-4">
              <p className="text-sm text-carbon">
                Nos dijiste que al final no te hacía falta y se lo hemos contado
                al profesor. No has pagado nada. Si cambias de idea, puedes
                volver a escribirle.
              </p>
              <a
                href="/profesores"
                className="mt-3 inline-block rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white"
              >
                Ver el directorio
              </a>
            </div>
          </Paso>
        )}

        {s.estado === 'devuelta' && (
          <Paso numero={3} titulo="Te devolvimos el dinero" estado="hecho">
            <p className="text-sm text-gris-medio">
              Sigues teniendo su teléfono aquí abajo por si queréis retomarlo.
            </p>
          </Paso>
        )}

        {/* Los pasos que todavía no tocan se enseñan en gris, no se esconden.
            Una lista que salta del 2 al 4 parece rota, y quien la mira no
            sabe si le falta algo por hacer. */}
        {(s.estado === 'pendiente_profesor' || s.estado === 'rechazada') && (
          <Paso numero={3} titulo="Pagas el contacto" estado="pendiente" />
        )}

        {/* --- Paso 4: el teléfono ---------------------------------------- */}
        {s.estado === 'pagada' || s.estado === 'devuelta' ? (
          <Paso numero={4} titulo="Ya podéis hablar" estado="hecho">
            <div className="rounded-xl border-2 border-verde-avanza bg-white p-5">
              <p className="text-sm text-gris-medio">
                Teléfono de {s.profesor}
              </p>
              <p className="mt-1">
                <a
                  href={`tel:${s.telefonoProfesor?.replace(/\s/g, '')}`}
                  className="text-2xl font-bold text-verde-avanza-oscuro underline underline-offset-4"
                >
                  {s.telefonoProfesor}
                </a>
              </p>
              <p className="mt-3 text-sm text-carbon">
                También le hemos dado el tuyo. El precio de las clases y los
                horarios los acordáis entre vosotros: nosotros ya no
                intervenimos.
              </p>
            </div>

            {s.tieneVale ? (
              <div className="mt-4 rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-5">
                <h4 className="font-bold text-verde-avanza-oscuro">
                  Tienes un contacto gratis
                </h4>
                <p className="mt-2 text-sm text-carbon">
                  Escribe a otro profesor y, cuando te pida el vale, pon este
                  código:
                </p>
                <p className="my-3 text-center font-mono text-2xl font-bold tracking-widest text-verde-avanza-oscuro">
                  {s.codigo}
                </p>
                <a
                  href="/profesores"
                  className="inline-block rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Buscar otro profesor
                </a>
              </div>
            ) : (
              <ReclamarVale
                token={token}
                puedeDecirSinContacto={
                  (s.diasDesdePago ?? 0) >= DIAS_PARA_RECLAMAR
                }
                diasQueFaltan={Math.max(
                  0,
                  DIAS_PARA_RECLAMAR - (s.diasDesdePago ?? 0),
                )}
              />
            )}
          </Paso>
        ) : (
          <Paso numero={4} titulo="Os pasamos los teléfonos" estado="pendiente" />
        )}
      </ol>

      {/* ------------------------------------------------------------------ */}
      {otras.length > 0 && (
        <section className="mt-12 border-t border-gris-borde pt-8">
          <h2 className="text-lg font-bold text-carbon">
            Tus otras solicitudes
          </h2>
          <p className="mt-1 text-sm text-gris-medio">
            Si buscas profesor para más de una asignatura o para más de un hijo,
            aquí las tienes todas.
          </p>

          <ul className="mt-4 space-y-2">
            {otras.map((o) => (
              <li key={o.token}>
                <a
                  href={`/solicitud/${o.token}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-gris-borde bg-white px-4 py-3 transition hover:bg-gris-claro"
                >
                  <span className="font-medium text-azul-confianza">
                    {o.profesor}
                  </span>
                  <span className="text-sm text-gris-medio">
                    {o.nivel ?? '—'}
                  </span>
                  <span
                    className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ETIQUETA[o.estado]?.clase ?? 'bg-gris-claro text-gris-medio'
                    }`}
                  >
                    {ETIQUETA[o.estado]?.texto ?? o.estado}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
