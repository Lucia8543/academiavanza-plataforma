import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/backend/repositories/cliente';
import { cambiarCupo } from '@/backend/repositories/mi-ficha';
import { porTokenProfesor } from '@/backend/repositories/solicitudes';
import { decidir } from '@/backend/services/solicitud';
import { ActivarAvisos } from '@/frontend/features/portal-profesor/activar-avisos';
import { esCupoOPausa } from '@/shared/reglas/cupo';
import { cuantosEnPalabras } from '@/shared/textos/hermanos';
import { PRECIO_ES_ORIENTATIVO, porHora } from '@/shared/textos/precios';
import { CUPO_SE_CAMBIA } from '@/shared/textos/modalidad';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Una familia quiere clases contigo · AcademiAvanza',
  robots: { index: false, follow: false },
};

/**
 * Donde el profesor dice sí o no.
 *
 * Se entra por un enlace largo que le llega por correo. No hay contraseña: el
 * enlace es la llave, igual que en el ADR 0005. Lo que hay detrás no es
 * sensible —el nombre de pila de una familia y un curso— y pedirle una
 * contraseña para contestar sí o no acabaría en que no contesta.
 *
 * El teléfono de la familia no está en esta página. Aparece más tarde, en el
 * correo que se manda cuando el contacto está pagado.
 */

/**
 * Apunta cuánto sitio le queda, desde el enlace de la solicitud.
 *
 * El token de la solicitud sirve de credencial: le llegó a él y a nadie más.
 * No hace falta pedirle nada más para dejarle decir si puede coger a otro.
 */
async function apuntarCupo(formulario: FormData) {
  'use server';

  const token = String(formulario.get('token') ?? '');
  const cupo = String(formulario.get('cupo') ?? '');

  if (!esCupoOPausa(cupo)) return;

  const solicitud = await db.contactos.findUnique({
    where: { token_profesor: token },
    select: { profesor_id: true },
  });

  if (!solicitud) return;

  await cambiarCupo(solicitud.profesor_id, cupo);

  revalidatePath(`/aceptar/${token}`);
  revalidatePath('/profesores');
}

async function aceptar(formulario: FormData) {
  'use server';
  const token = String(formulario.get('token') ?? '');
  /*
   * A qué alumnos dice que sí.
   *
   * Vacío significa «a todos», que es el caso normal y el único que existía
   * antes de que hubiera hermanos. Sólo llega relleno cuando la familia ha
   * dicho que le vale con que coja a alguno y él ha pulsado uno de los botones
   * concretos.
   */
  const alumnos = formulario.getAll('alumno').map(String);
  await decidir(token, 'aceptar', undefined, alumnos);
  redirect(`/aceptar/${token}`);
}

async function rechazar(formulario: FormData) {
  'use server';
  const token = String(formulario.get('token') ?? '');
  const motivo = String(formulario.get('motivo') ?? '');
  await decidir(token, 'rechazar', motivo);
  redirect(`/aceptar/${token}`);
}

export default async function PaginaAceptar({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const s = await porTokenProfesor(token);

  if (!s) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-azul-confianza">
        Una familia quiere clases contigo
      </h1>

      <dl className="mt-6 space-y-2 rounded-xl border border-gris-borde bg-white p-5 text-sm">
        {/*
          Los alumnos.

          Con uno, la línea de siempre. Con hermanos, uno por línea con sus
          horas al lado, porque quien puede coger sólo a uno necesita saber
          cuántas horas son **de cada uno** y no el total. Las solicitudes
          anteriores a que esto existiera no traen la lista, y entonces se
          enseña el curso suelto, que es exactamente lo que son.
        */}
        {s.alumnos.length > 1 ? (
          <div>
            <dt className="font-medium text-carbon">
              {cuantosEnPalabras(s.alumnos.length)}:
            </dt>
            <dd className="mt-1">
              <ul className="space-y-1">
                {s.alumnos.map((a) => (
                  <li key={a.id} className="text-carbon">
                    {a.nivel ?? '—'}
                    {a.horasSemana && (
                      <span className="text-gris-medio">
                        {' '}
                        · {a.horasSemana} a la semana
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : (
          <div>
            <dt className="inline font-medium text-carbon">Curso: </dt>
            <dd className="inline text-carbon">{s.nivel ?? '—'}</dd>
          </div>
        )}
        {/*
          Cuánto se cobra por ese curso, aquí y no sólo en la ficha pública.

          Es la primera pregunta que hace un profesor al recibir una propuesta,
          y hasta ahora la respuesta estaba en dos sitios que él no visita: su
          propia ficha, que es para las familias, y el formulario de contacto.
          Preguntaban por WhatsApp uno a uno.

          Va con la aclaración pegada, como en todas las pantallas donde
          aparece un importe: la plataforma no cobra ni impone este precio.
        */}
        {s.precioNivel !== null && (
          <div>
            <dt className="inline font-medium text-carbon">
              Precio de referencia:{' '}
            </dt>
            <dd className="inline text-carbon">
              {porHora(s.precioNivel)}{' '}
              <span className="text-gris-medio">{PRECIO_ES_ORIENTATIVO}</span>
            </dd>
          </div>
        )}
        {/*
          Dónde vive, justo debajo del curso.

          Son las dos preguntas que se hace cualquiera antes de decir que sí, y
          antes no estaba: se aceptaba a ciegas y a veces se descubría después
          que la familia vivía a una hora, con los diez euros ya cobrados.

          Sólo aparece si la solicitud la trae. Las anteriores a que se
          preguntara, y las de quien sólo da clase online, no la tienen, y una
          fila con un guión sería ruido.
        */}
        {s.zona && (
          <div>
            <dt className="inline font-medium text-carbon">Zona: </dt>
            <dd className="inline text-carbon">{s.zona}</dd>
          </div>
        )}
        {/*
          Y con la zona, las horas y los días.

          Lo pidió una profesora que no podía saber si le cabía en el horario
          antes de aceptar. Es el mismo problema que resolvió la zona y tiene
          la misma consecuencia si falta: o dice que no a algo que le venía
          bien, o le pide el teléfono a la familia antes de aceptar para
          preguntárselo, saltándose lo único que cobra la plataforma.

          Las dos son opcionales para la familia, así que la línea se omite
          entera cuando no hay nada que decir.
        */}
        {/* Con hermanos, las horas ya van en la línea de cada uno. */}
        {s.alumnos.length <= 1 && s.horasSemana && (
          <div>
            <dt className="inline font-medium text-carbon">
              Horas por semana:{' '}
            </dt>
            <dd className="inline text-carbon">{s.horasSemana}</dd>
          </div>
        )}
        {s.diasPreferidos && (
          <div>
            <dt className="inline font-medium text-carbon">
              Días que le vienen bien:{' '}
            </dt>
            <dd className="inline text-carbon">{s.diasPreferidos}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-medium text-carbon">Recibida: </dt>
          <dd className="inline text-carbon">
            {new Date(s.enviadaEn).toLocaleDateString('es-ES')}
          </dd>
        </div>
      </dl>

      {s.mensaje && (
        <blockquote className="mt-4 border-l-4 border-verde-avanza bg-gris-claro p-4 text-carbon">
          «{s.mensaje}»
        </blockquote>
      )}

      {/* ------------------------------------------------------------------ */}
      {s.estado === 'pendiente_profesor' && (
        <section className="mt-8">
          <p className="text-sm text-carbon">
            Si aceptas, la familia paga el contacto y te damos su teléfono para
            que le escribas tú. Si ahora no puedes, dilo sin más, que no pasa nada y
            nadie paga nada.
          </p>
          <p className="mt-2 text-sm text-gris-medio">
            Ella no tiene el tuyo y no se lo vamos a dar, porque nunca damos el teléfono
            de un profesor.
          </p>

          {/*
            Un botón, o uno por combinación.
            ------------------------------------------------------------------

            Cuando la familia ha dicho que le vale con que coja a alguno, el
            botón único deja de servir: obliga a decir que sí a todo o que no a
            todo, y quien sólo tiene hueco para uno acaba diciendo que no,
            dejando a esa familia sin nadie con media solución delante.

            Son formularios separados y no casillas con un botón al final a
            propósito. Un profesor abre esto en el móvil, entre clase y clase, y
            lo que tiene que hacer es leer tres frases y tocar una. Marcar
            casillas y luego buscar el botón es un paso más en el único momento
            en que esta plataforma cobra algo.

            El precio no cambia en ninguno de los casos, y lo dice cada botón,
            porque es la primera duda que le va a entrar.
          */}
          {s.valeConUno && s.alumnos.length > 1 ? (
            <div className="mt-5 space-y-3">
              <form action={aceptar}>
                <input type="hidden" name="token" value={token} />
                {s.alumnos.map((a) => (
                  <input key={a.id} type="hidden" name="alumno" value={a.id} />
                ))}
                <button className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro">
                  Puedo con los {s.alumnos.length}
                </button>
              </form>

              {s.alumnos.map((a) => (
                <form key={a.id} action={aceptar}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="alumno" value={a.id} />
                  <button className="w-full rounded-lg border-2 border-verde-avanza px-6 py-3 font-semibold text-verde-avanza-oscuro transition hover:bg-verde-avanza-claro">
                    Sólo con {a.nivel ?? 'este alumno'}
                    {a.horasSemana && (
                      <span className="font-normal"> · {a.horasSemana}</span>
                    )}
                  </button>
                </form>
              ))}

              <p className="text-sm text-gris-medio">
                Cojas a uno o a todos, la familia paga lo mismo: lo que compra
                es poder hablar contigo.
              </p>
            </div>
          ) : (
            <form action={aceptar} className="mt-5">
              <input type="hidden" name="token" value={token} />
              <button className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro">
                {s.alumnos.length > 1 ? 'Sí, puedo con todos' : 'Sí, puedo cogerla'}
              </button>
            </form>
          )}

          <form
            action={rechazar}
            className="mt-6 border-t border-gris-borde pt-6"
          >
            <input type="hidden" name="token" value={token} />
            <label
              className="block text-sm font-medium text-carbon"
              htmlFor="motivo"
            >
              O dile por qué no{' '}
              <span className="font-normal text-gris-medio">(opcional)</span>
            </label>
            <input
              id="motivo"
              name="motivo"
              maxLength={200}
              placeholder="Ahora mismo no tengo hueco por las tardes"
              className="mt-1 w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon focus:border-verde-avanza focus:outline-none"
            />
            <button className="mt-3 w-full rounded-lg border border-gris-borde px-6 py-3 font-semibold text-carbon transition hover:bg-gris-claro">
              No puedo ahora
            </button>
          </form>
        </section>
      )}

      {s.estado === 'aceptada' && (
        <>
          <div className="mt-8 rounded-xl border border-verde-avanza bg-verde-avanza-claro p-5">
            <h2 className="font-bold text-verde-avanza-oscuro">Has aceptado</h2>
            <p className="mt-2 text-sm text-carbon">
              Le hemos dicho a la familia que sí. En cuanto pague el contacto te
              mandamos su teléfono para que le escribas tú.
            </p>
            <p className="mt-2 text-sm text-gris-medio">
              Ella no tiene el tuyo y no se lo vamos a dar, porque nunca damos el
              teléfono de un profesor. Así que el primer paso lo tienes que dar
              tú, o no va a pasar nada.
            </p>
          </div>

          {/* Segundo momento bueno para pedir el permiso: acaba de aceptar y
              está esperando algo. Si ya lo dio, el propio componente lo detecta
              y no vuelve a insistir. */}
          {!s.avisadoPorMovil && (
            <div className="mt-6">
              <ActivarAvisos token={token} />
            </div>
          )}
        </>
      )}

      {/* La pregunta del cupo vale para los dos estados.
          Cuando una familia usa un vale, el contacto cuesta 0 € y la solicitud
          salta de «aceptada» a «pagada» sin pasar por el Bizum. Si esto colgara
          sólo de «aceptada», a ese profesor no se le preguntaría nunca cuánto
          sitio le queda. */}
      {(s.estado === 'aceptada' || s.estado === 'pagada') && (
        <>
          {/* La pregunta, aquí y no en otro sitio.
            Es el único momento del año en que un profesor está pensando
            exactamente en cuánto sitio le queda: acaba de coger un alumno.
            Preguntárselo por correo dos semanas después es preguntárselo a
            alguien que ya no se acuerda, y así es como el directorio acaba
            lleno de gente que no puede coger a nadie. */}
        <section className="mt-6 rounded-xl border border-gris-borde bg-white p-5">
          <h2 className="font-bold text-azul-confianza">
            ¿Puedes coger más alumnos?
          </h2>
          <p className="mt-2 text-sm text-carbon">
            Es para no mandarte gente si vas lleno. Si te queda poco hueco,
            sigues en el directorio pero avisamos a las familias de que ya
            tienes alumnos. Y si no te cabe nadie más, tu ficha se sigue viendo
            pero nadie puede escribirte.
          </p>
          <p className="mt-2 text-sm text-gris-medio">{CUPO_SE_CAMBIA}</p>

          {/* Cada botón dice si es el que está puesto ahora mismo.
              Sin esto, pulsar no cambiaba nada a la vista y parecía que no
              había funcionado, con lo que la gente lo pulsa tres veces y
              acaba sin saber en qué estado se ha quedado. */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {(
              [
                {
                  valor: 'busca',
                  etiqueta: 'Sí, sigo buscando',
                  activo: !s.pausado && s.cupo === 'busca',
                },
                {
                  valor: 'justo',
                  etiqueta: 'Me queda poco hueco',
                  activo: !s.pausado && s.cupo === 'justo',
                },
                {
                  valor: 'completo',
                  etiqueta: 'No tengo más hueco',
                  activo: !s.pausado && s.cupo === 'completo',
                },
                {
                  valor: 'ninguno',
                  etiqueta: 'No, pausa mi ficha',
                  activo: s.pausado,
                },
              ] as const
            ).map((o) => (
              <form key={o.valor} action={apuntarCupo} className="flex-1">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="cupo" value={o.valor} />
                <button
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold ${
                    o.activo
                      ? 'border-2 border-verde-avanza bg-verde-avanza-claro text-verde-avanza-oscuro'
                      : 'border border-gris-borde text-carbon hover:bg-gris-claro'
                  }`}
                >
                  {o.activo ? '✓ ' : ''}
                  {o.etiqueta}
                </button>
              </form>
            ))}
          </div>

          <p className="mt-3 text-sm font-medium text-carbon">
            {s.pausado
              ? 'Tu ficha está pausada: no aparece en el directorio y no te llegarán más solicitudes.'
              : s.cupo === 'completo'
                ? 'Apuntado: tu ficha se sigue viendo, pero nadie puede escribirte hasta que digas lo contrario.'
                : s.cupo === 'justo'
                  ? 'Apuntado: apareces avisando de que ya tienes alumnos y vas justo de tiempo.'
                  : 'Apuntado: apareces como que buscas alumnos.'}
          </p>
        </section>
        </>
      )}

      {s.estado === 'pagada' && (
        <div className="mt-8 rounded-xl border-2 border-verde-avanza bg-white p-5">
          <h2 className="font-bold text-verde-avanza-oscuro">
            Ya podéis hablar
          </h2>
          <p className="mt-3 text-sm text-gris-medio">
            Teléfono de {s.nombreFamilia}
          </p>
          <a
            href={`tel:${s.telefonoFamilia?.replace(/\s/g, '')}`}
            className="mt-1 block text-2xl font-bold text-verde-avanza-oscuro underline underline-offset-4"
          >
            {s.telefonoFamilia}
          </a>
          <p className="mt-3 text-sm text-carbon">
            El precio de las clases y los horarios los acordáis vosotros.
          </p>
        </div>
      )}

      {s.estado === 'rechazada' && (
        <div className="mt-8 rounded-xl border border-gris-borde bg-gris-claro p-5">
          <p className="text-sm text-carbon">
            Dijiste que ahora no podías. La familia ya lo sabe y no ha pagado
            nada.
          </p>
        </div>
      )}

      {/* Los tres finales que antes no se pintaban. Un profesor que abre un
          enlace viejo veía media página sin ninguna explicación, y lo lógico
          era pensar que algo se había roto. */}
      {(s.estado === 'caducada' || s.estado === 'cancelada') && (
        <div className="mt-8 rounded-xl border border-gris-borde bg-gris-claro p-5">
          <p className="text-sm text-carbon">
            {s.estado === 'cancelada'
              ? 'Esta familia nos dijo que al final no le hacía falta.'
              : 'Esta solicitud se cerró porque nadie siguió adelante.'}{' '}
            No tienes que hacer nada y no te afecta en nada, porque tu ficha sigue como
            estaba.
          </p>
        </div>
      )}

      {s.estado === 'devuelta' && (
        <div className="mt-8 rounded-xl border border-gris-borde bg-gris-claro p-5">
          <p className="text-sm text-carbon">
            Esta familia pidió que le devolviéramos el contacto. Sigues teniendo
            su teléfono por si queréis retomarlo, pero no tienes que hacer nada.
            Ella no tiene el tuyo.
          </p>
        </div>
      )}
    </main>
  );
}
