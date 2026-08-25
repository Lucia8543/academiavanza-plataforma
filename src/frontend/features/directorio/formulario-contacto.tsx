'use client';

import { useActionState, useState } from 'react';
import { enviarContacto, type EstadoContacto } from '@/app/profesor/[slug]/acciones';
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
  nivelId: string;
  mensaje: string;
};

const VACIO: Valores = {
  nombreFamilia: '',
  telefono: '',
  nivelId: '',
  mensaje: '',
};

export function FormularioContacto({
  slug,
  nombreProfesor,
  niveles,
}: {
  slug: string;
  nombreProfesor: string;
  niveles: { id: string; nombre: string }[];
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
  const cambiar = (campo: keyof Valores, valor: string) =>
    setV((actual) => ({ ...actual, [campo]: valor }));

  // Se calcula al pintar, no se guarda en un estado aparte: es una función del
  // texto y nada más. Guardarlo sería tener dos versiones de la misma verdad.
  const sospecha = detectarDatosSensibles(v.mensaje);

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-verde-avanza bg-verde-avanza-claro p-6">
        <h3 className="text-lg font-bold text-verde-avanza-oscuro">
          Le hemos pasado tu teléfono
        </h3>
        <p className="mt-2 text-sm text-carbon">
          {nombreProfesor} te llamará o te escribirá. Si en un par de días no
          sabes nada, escribe a otro del directorio: no todo el mundo tiene hueco
          en todo momento, y no queremos que te quedes esperando.
        </p>
      </div>
    );
  }

  return (
    <form
      key={intento}
      action={accion}
      className="rounded-xl border border-gris-borde bg-white p-6"
      noValidate
    >
      <input type="hidden" name="slug" value={slug} />

      <h3 className="text-lg font-bold text-azul-confianza">
        Escribir a {nombreProfesor}
      </h3>
      <p className="mt-1 text-sm text-gris-medio">
        Le pasamos tu nombre y tu teléfono, y te llama. No cuesta nada y no hay
        ningún intermediario después.
      </p>

      {estado.mensaje && (
        <div className="mt-4 rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error">
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
            Solo lo ve este profesor. No se publica en ningún sitio.
          </p>
          <Aviso mensaje={errores.telefono} />
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
            <p className="mt-1 text-sm text-gris-medio">
              Son los cursos a los que da clase.
            </p>
            <Aviso mensaje={errores.nivelId} />
          </div>
        )}

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
            —diagnósticos, informes, medicación— ni sobre vuestra religión u
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
              Acepto que le paséis mi nombre y mi teléfono a este profesor
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
