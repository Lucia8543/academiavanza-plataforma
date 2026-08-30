'use client';

import { useActionState, useState } from 'react';
import { enviarContacto, type EstadoContacto } from '@/app/profesor/[slug]/acciones';
import { CamposTrampa } from '@/frontend/components/shared/campos-trampa';
import {
  PLAZOS,
  URGENCIA_POR_DEFECTO,
  type Urgencia,
} from '@/shared/reglas/cobro';
import { BARRIOS, GRUPOS_DE_ZONAS } from '@/shared/datos/zonas';
import { EXPLICACION_PRESENCIAL } from '@/shared/textos/modalidad';
import { porHora, PRECIO_ES_ORIENTATIVO } from '@/shared/textos/precios';
import { sugerirCorreo } from '@/shared/schemas/correo-erratas';
import {
  detectarDatosSensibles,
  mensajeDeAviso,
} from '@/shared/schemas/datos-sensibles';

/**
 * El formulario con el que una familia escribe a un profesor.
 *
 * Es corto a propósito: nombre y teléfono, y como mucho dos cosas más. Cada
 * campo que se añade aquí es gente que se va sin escribir, y lo único que hace
 * falta para que dos personas hablen es un número al que llamar.
 *
 * Mismo apaño que en el alta de profesores: la `key` cambia con cada respuesta
 * del servidor para que el formulario se reconstruya desde el estado. React
 * vacía el formulario del navegador al terminar una acción, y sin esto se
 * perdería lo escrito cuando la validación falla.
 */

const INICIAL: EstadoContacto = { ok: false };

const claseCampo =
  'w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon ' +
  'focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza';

const claseEtiqueta = 'block text-sm font-medium text-carbon';

function Aviso({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="mt-1 text-sm text-error">{mensaje}</p>;
}

type Valores = {
  nombreFamilia: string;
  telefono: string;
  email: string;
  nivelId: string;
  zona: string;
  barrio: string;
  urgencia: Urgencia;
  mensaje: string;
  vale: string;
};

const VACIO: Valores = {
  nombreFamilia: '',
  telefono: '',
  email: '',
  nivelId: '',
  zona: '',
  barrio: '',
  urgencia: URGENCIA_POR_DEFECTO,
  mensaje: '',
  vale: '',
};

const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n,
  );

export function FormularioContacto({
  slug,
  nombreProfesor,
  niveles,
  precio,
  daPresencial,
}: {
  slug: string;
  nombreProfesor: string;
  niveles: { id: string; nombre: string; precio: number | null }[];
  precio: number;
  /** Da clase a domicilio, así que hay que aclarar en casa de quién. */
  daPresencial: boolean;
}) {
  const [estado, accion, enviando] = useActionState(enviarContacto, INICIAL);

  const [v, setV] = useState<Valores>(() => ({
    ...VACIO,
    ...(estado.valores ?? {}),
  }));

  const [respuestaVista, setRespuestaVista] = useState(estado);
  const [intento, setIntento] = useState(0);

  if (respuestaVista !== estado) {
    setRespuestaVista(estado);
    setIntento((n) => n + 1);
  }

  const errores = estado.errores ?? {};
  /*
   * Genérica y no `(campo: keyof Valores, valor: string)`.
   *
   * Con la firma anterior, `urgencia` —que es una unión de tres valores y no
   * una cadena cualquiera— se dejaba asignar cualquier texto sin que
   * TypeScript dijera nada, porque la clave computada del spread desactiva la
   * comprobación. Así, cada campo sólo acepta lo suyo.
   */
  const cambiar = <C extends keyof Valores>(campo: C, valor: Valores[C]) =>
    setV((actual) => ({ ...actual, [campo]: valor }));

  // Se calcula al pintar, no se guarda en un estado aparte: es una función del
  // texto y nada más. Guardarlo sería tener dos versiones de la misma verdad.
  const sospecha = detectarDatosSensibles(v.mensaje);
  const sugerencia = sugerirCorreo(v.email);
  const elegido = niveles.find((n) => n.id === v.nivelId);

  // Cuando sale bien no se pinta nada aquí: la acción lleva a la página de
  // seguimiento de la familia, que es donde está todo lo que necesita saber.

  return (
    <form
      key={intento}
      action={accion}
      className="relative rounded-xl border border-gris-borde bg-white p-6"
      noValidate
    >
      <CamposTrampa />
      <input type="hidden" name="slug" value={slug} />

      <h3 className="text-lg font-bold text-azul-confianza">
        Escribir a {nombreProfesor}
      </h3>
      <p className="mt-1 text-sm text-gris-medio">
        Escribir es gratis. Le preguntamos si puede cogerte y te lo decimos.
        Solo si acepta pagarás {euros(precio)} por el contacto, y entonces os
        damos tu teléfono para que te escriba él.
      </p>

      {/* Presencial significa que él va a casa del alumno, y la gente lo da
          por supuesto en las dos direcciones. Enterarse en la primera llamada,
          después de haber pagado, es de las cosas que acaban en devolución. */}
      {daPresencial && (
        <p className="mt-2 rounded-lg bg-gris-claro px-3 py-2 text-sm text-carbon">
          {EXPLICACION_PRESENCIAL}
        </p>
      )}

      {estado.mensaje && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error"
        >
          {estado.mensaje}
        </div>
      )}

      <div className="mt-5 space-y-5">
        <div>
          <label className={claseEtiqueta} htmlFor="nombreFamilia">
            Tu nombre
          </label>
          <input
            id="nombreFamilia"
            name="nombreFamilia"
            className={claseCampo}
            value={v.nombreFamilia}
            onChange={(e) => cambiar('nombreFamilia', e.target.value)}
          />
          <Aviso mensaje={errores.nombreFamilia} />
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="telefono">
            Tu teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="600 123 456"
            className={claseCampo}
            value={v.telefono}
            onChange={(e) => cambiar('telefono', e.target.value)}
          />
          <p className="mt-1 text-sm text-gris-medio">
            No se lo damos a nadie todavía. Solo lo verá este profesor, y solo
            si acepta y pagas el contacto.
          </p>
          <Aviso mensaje={errores.telefono} />
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="email">
            Tu correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={claseCampo}
            value={v.email}
            onChange={(e) => cambiar('email', e.target.value)}
          />
          <p className="mt-1 text-sm text-gris-medio">
            Es para avisarte de lo que pasa: cuando el profesor conteste y
            cuando podáis hablar.{' '}
            <span className="font-medium text-carbon">
              A él no se lo damos.
            </span>
          </p>

          {/* Un correo mal tecleado no da ningún error: la dirección existe
              como texto y el aviso se va a un buzón de nadie. La familia no se
              entera de que la han aceptado y no paga. Se sugiere, no se
              corrige: alguien puede tener de verdad una dirección rara. */}
          {sugerencia && (
            <button
              type="button"
              onClick={() => cambiar('email', sugerencia)}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm text-amber-900"
            >
              ¿Querías decir <strong>{sugerencia}</strong>? Toca para
              corregirlo.
            </button>
          )}

          <Aviso mensaje={errores.email} />
        </div>

        {niveles.length > 0 && (
          <div>
            <label className={claseEtiqueta} htmlFor="nivelId">
              Curso
            </label>
            <select
              id="nivelId"
              name="nivelId"
              className={claseCampo}
              value={v.nivelId}
              onChange={(e) => cambiar('nivelId', e.target.value)}
            >
              {/* Sin opción de escaquearse: es lo primero que pregunta
                  cualquier profesor. La lista son sólo los cursos que da éste,
                  así que si el tuyo no está, no es tu profesor. */}
              <option value="">Elige el curso</option>
              {niveles.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
            {/* El precio aparece en cuanto elige el curso, no escondido en
                otra pantalla. Es el momento en que decide si le encaja. */}
            {elegido ? (
              <p className="mt-1 text-sm text-carbon">
                {elegido.precio === null ? (
                  <>Precio a convenir con el profesor.</>
                ) : (
                  <>
                    Precio de referencia:{' '}
                    <span className="font-semibold">
                      {porHora(elegido.precio)}
                    </span>
                    . {PRECIO_ES_ORIENTATIVO}
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gris-medio">
                Son los cursos a los que da clase. Al elegir verás el precio de
                referencia de la hora.
              </p>
            )}
            <Aviso mensaje={errores.nivelId} />
          </div>
        )}

        {/*
          Dónde vive, y sólo si el profesor se desplaza.
          A quien da clase online la zona no le dice nada, y cada campo de más
          es gente que cierra la pestaña sin escribir.

          Es un desplegable y no un hueco libre a propósito: preguntada a pelo,
          la gente contesta con su dirección, y una calle con número al lado del
          curso de una menor es un dato que no queremos tener. Con el distrito
          el profesor decide igual de bien.
        */}
        {daPresencial && (
          <div>
            <label className={claseEtiqueta} htmlFor="zona">
              ¿En qué zona vivís?
            </label>
            <select
              id="zona"
              name="zona"
              required
              className={claseCampo}
              value={v.zona}
              onChange={(e) =>
                // El barrio se vacía al cambiar de distrito. Si no, quien se
                // equivoca de distrito y lo corrige se queda con un barrio de
                // otro sitio, y el servidor le rechaza el envío sin que se vea
                // por qué.
                setV((actual) => ({
                  ...actual,
                  zona: e.target.value,
                  barrio: '',
                }))
              }
            >
              <option value="">Elige la zona</option>
              {GRUPOS_DE_ZONAS.map((g) => (
                <optgroup key={g.titulo} label={g.titulo}>
                  {g.zonas.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-1 text-sm text-gris-medio">
              El profesor la ve antes de contestar, para saber si le viene bien
              desplazarse. No pongas tu dirección: con el barrio sobra.
            </p>
            <Aviso mensaje={errores.zona} />

            {/*
              El barrio, y sólo si el distrito elegido tiene desglose: los
              municipios de fuera no lo tienen.

              Es opcional de verdad, y lo dice la etiqueta. Mucha gente no sabe
              cómo se llama oficialmente su barrio, y quien no lo encuentre se
              queda en el distrito sin que pase nada. Obligar aquí sería cambiar
              precisión por formularios abandonados.
            */}
            {BARRIOS[v.zona] && (
              <div className="mt-3">
                <label className={claseEtiqueta} htmlFor="barrio">
                  ¿Y en qué barrio?{' '}
                  <span className="font-normal text-gris-medio">
                    (si lo sabes)
                  </span>
                </label>
                <select
                  id="barrio"
                  name="barrio"
                  className={claseCampo}
                  value={v.barrio}
                  onChange={(e) => cambiar('barrio', e.target.value)}
                >
                  <option value="">Prefiero no precisar</option>
                  {BARRIOS[v.zona].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <Aviso mensaje={errores.barrio} />
              </div>
            )}
          </div>
        )}

        {/*
          Para cuándo lo necesita.

          Decide cuánto tiempo tiene el profesor antes de que la solicitud se
          cierre sola, y por eso se le enseña el número de días debajo de cada
          opción: es un compromiso que adquiere la plataforma con ella, no una
          preferencia que apuntamos en una libreta.
        */}
        <fieldset>
          <legend className={claseEtiqueta}>¿Para cuándo lo necesitas?</legend>
          <p className="mt-1 text-sm text-gris-medio">
            Nos dice cuánta prisa hay y cuánto tiempo le damos al profesor para
            contestar.
          </p>

          <div className="mt-3 space-y-2">
            {(Object.keys(PLAZOS) as Urgencia[]).map((clave) => {
              const opcion = PLAZOS[clave];
              const elegida = v.urgencia === clave;

              return (
                <label
                  key={clave}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                    elegida
                      ? 'border-verde-avanza bg-verde-avanza-claro'
                      : 'border-gris-borde hover:bg-gris-claro'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgencia"
                    value={clave}
                    checked={elegida}
                    onChange={() => cambiar('urgencia', clave)}
                    className="mt-1 h-4 w-4 accent-[#2E7D5E]"
                  />
                  <span>
                    <span className="block font-medium text-carbon">
                      {opcion.etiqueta}
                    </span>
                    <span className="block text-sm text-gris-medio">
                      {opcion.explicacion} · le damos {opcion.dias} días para
                      contestar
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className={claseEtiqueta} htmlFor="mensaje">
            Algo que quieras contarle{' '}
            <span className="font-normal text-gris-medio">(opcional)</span>
          </label>
          <p className="mt-1 mb-2 text-sm text-gris-medio">
            Cuéntale lo práctico: qué asignatura, cuántos días a la semana, si
            hay examen pronto.{' '}
            <span className="font-medium text-carbon">
              No escribas aquí nada sobre la salud de tu hijo
            </span>{' '}
            (diagnósticos, informes, medicación) ni sobre vuestra religión u
            origen. No podemos guardar esa información. Si crees que el profesor
            debe saberlo, díselo por teléfono.
          </p>
          <textarea
            id="mensaje"
            name="mensaje"
            rows={3}
            maxLength={500}
            placeholder="Va a 3.º de la ESO y le cuesta seguir el ritmo en mates. Buscamos dos días a la semana por la tarde."
            className={claseCampo}
            value={v.mensaje}
            onChange={(e) => cambiar('mensaje', e.target.value)}
          />

          {/* Aviso en caliente: salta mientras se escribe, antes de enviar
              nada. Así el texto no llega a salir del navegador. La comprobación
              que manda es la del servidor; esta solo evita el susto. */}
          {sospecha && (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {mensajeDeAviso(sospecha)}
            </p>
          )}

          <Aviso mensaje={errores.mensaje} />
        </div>

        {/* --- Vale ------------------------------------------------------- */}
        {/* Detrás de un desplegable cerrado. Lo va a usar una familia de cada
            veinte, y un campo visible que la mayoría no entiende siembra la
            duda de si le falta algo por poner. Quien tiene un vale lo sabe y lo
            busca. */}
        <details className="rounded-lg border border-gris-borde px-3 py-2">
          <summary className="cursor-pointer text-sm text-gris-medio">
            Tengo un vale de un contacto anterior
          </summary>
          <div className="mt-3">
            <label className={claseEtiqueta} htmlFor="vale">
              Código del vale
            </label>
            <input
              id="vale"
              name="vale"
              placeholder="27XJS"
              autoCapitalize="characters"
              autoComplete="off"
              className={`${claseCampo} font-mono uppercase tracking-widest`}
              value={v.vale}
              onChange={(e) => cambiar('vale', e.target.value.toUpperCase())}
            />
            <p className="mt-1 text-sm text-gris-medio">
              Es el código del contacto que no funcionó. Si es válido, este no
              te costará nada.
            </p>
          </div>
        </details>

        {/* --- Consentimientos ------------------------------------------- */}
        <div className="space-y-3 border-t border-gris-borde pt-5">
          <label className="flex items-start gap-2.5 text-sm text-carbon">
            <input
              type="checkbox"
              name="esTutorLegal"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2E7D5E]"
            />
            <span>Soy la madre, el padre o el tutor legal del alumno</span>
          </label>
          <Aviso mensaje={errores.esTutorLegal} />

          <label className="flex items-start gap-2.5 text-sm text-carbon">
            <input
              type="checkbox"
              name="aceptaPrivacidad"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2E7D5E]"
            />
            <span>
              Acepto que le paséis mi nombre y mi teléfono a este profesor si
              acepta darme clase y pago el contacto, según la{' '}
              <a
                href="/legal/privacidad"
                target="_blank"
                className="underline underline-offset-2"
              >
                política de privacidad
              </a>
            </span>
          </label>
          <Aviso mensaje={errores.aceptaPrivacidad} />
        </div>

        <button
          disabled={enviando || Boolean(sospecha)}
          className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro disabled:opacity-60 sm:w-auto"
        >
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>

        {sospecha && (
          <p className="text-sm text-gris-medio">
            Quita esa parte del mensaje y podrás enviarlo. El resto de lo que
            has escrito se conserva.
          </p>
        )}
      </div>
    </form>
  );
}
