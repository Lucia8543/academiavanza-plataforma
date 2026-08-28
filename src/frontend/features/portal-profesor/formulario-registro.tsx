'use client';

import { useActionState, useState } from 'react';
import { enviarRegistro, type EstadoFormulario } from '@/app/registro/acciones';
import type { Catalogos } from '@/backend/repositories/catalogos';
import { CamposTrampa } from '@/frontend/components/shared/campos-trampa';
import { SelectorColegio } from '@/frontend/components/shared/selector-colegio';
import { ActivarAvisos } from '@/frontend/features/portal-profesor/activar-avisos';
import { DIAS, FRANJAS } from '@/shared/schemas/profesor';

/**
 * Formulario de alta de profesor.
 *
 * Todo lo que se escribe vive en un único objeto en memoria, y cada campo lee
 * y escribe de ahí. Es más código que dejar que el navegador lo gestione, pero
 * es la única forma de garantizar que **nada se pierde** cuando la validación
 * falla: React vacía el formulario al terminar de procesarlo, y con listas y
 * desplegables no hay manera fiable de repintarlos desde fuera.
 *
 * Rellenar esto lleva cinco minutos. Perderlo por un correo mal escrito es
 * motivo suficiente para cerrar la pestaña y no volver.
 */

const ESTADO_INICIAL: EstadoFormulario = { ok: false };

type Valores = {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  colegioId: string;
  colegioOtro: string;
  titulacion: string;
  universidad: string;
  cursoActual: string;
  anosExperiencia: string;
  desplazamientoFlexible: boolean;
  titulacionFinalizada: boolean;
  asignaturas: string[];
  niveles: string[];
  certificaciones: string[];
  modalidad: string;
  zona: string;
  disponibilidad: string[];
  puntosFuertes: string;
  aceptaPublicacion: boolean;
};

const VACIO: Valores = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  colegioId: '',
  colegioOtro: '',
  titulacion: '',
  universidad: '',
  cursoActual: '',
  anosExperiencia: '',
  desplazamientoFlexible: false,
  titulacionFinalizada: false,
  asignaturas: [],
  niveles: [],
  certificaciones: [],
  modalidad: 'online',
  zona: '',
  disponibilidad: [],
  puntosFuertes: '',
  aceptaPublicacion: false,
};

/**
 * Reconstruye los valores del formulario a partir de lo que devolvió el
 * servidor. Si no devolvió nada —primera visita— sale el formulario vacío.
 */
function desdeRespuesta(
  respuesta: EstadoFormulario['valores'],
): Valores {
  if (!respuesta) return VACIO;

  const t = (k: string) =>
    typeof respuesta[k] === 'string' ? (respuesta[k] as string) : '';
  const l = (k: string) =>
    Array.isArray(respuesta[k]) ? (respuesta[k] as string[]) : [];

  return {
    nombre: t('nombre'),
    apellidos: t('apellidos'),
    email: t('email'),
    telefono: t('telefono'),
    colegioId: t('colegioId'),
    colegioOtro: t('colegioOtro'),
    titulacion: t('titulacion'),
    universidad: t('universidad'),
    cursoActual: t('cursoActual'),
    anosExperiencia: t('anosExperiencia'),
    desplazamientoFlexible: t('desplazamientoFlexible') === 'on',
    titulacionFinalizada: t('titulacionFinalizada') === 'on',
    asignaturas: l('asignaturas'),
    niveles: l('niveles'),
    certificaciones: l('certificaciones'),
    modalidad: t('modalidad') || 'online',
    zona: t('zona'),
    disponibilidad: l('disponibilidad'),
    puntosFuertes: t('puntosFuertes'),
    aceptaPublicacion: t('aceptaPublicacion') === 'on',
  };
}

function Seccion({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gris-borde pt-8">
      <h2 className="text-xl font-bold text-azul-confianza">{titulo}</h2>
      {ayuda && <p className="mt-1 text-sm text-gris-medio">{ayuda}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Aviso({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="mt-1 text-sm text-error">{mensaje}</p>;
}

const claseCampo =
  'w-full rounded-lg border border-gris-borde px-3 py-2 text-carbon ' +
  'focus:border-verde-avanza focus:outline-none focus:ring-1 focus:ring-verde-avanza';

const claseEtiqueta = 'block text-sm font-medium text-carbon';
const claseCasilla = 'h-4 w-4 accent-[#2E7D5E]';

export function FormularioRegistro({ catalogos }: { catalogos: Catalogos }) {
  const [estado, accion, enviando] = useActionState(
    enviarRegistro,
    ESTADO_INICIAL,
  );
  // El estado nace ya con lo que devuelva el servidor.
  //
  // Mientras haya JavaScript, `useActionState` no desmonta el formulario y lo
  // escrito sigue en memoria por sí solo. Este arranque cubre el otro caso: si
  // el navegador envía el formulario a la antigua —sin JavaScript, o antes de
  // que la página termine de cargarse— la respuesta es una página nueva, el
  // componente se monta de cero y sin esto aparecería en blanco.
  //
  // Antes esto lo hacía un `useEffect`. Hacía lo mismo, pero pintaba el
  // formulario vacío y lo rellenaba en un segundo repintado. Empezar con el
  // valor correcto es más simple y no parpadea.
  const [v, setV] = useState<Valores>(() => desdeRespuesta(estado.valores));

  // Cuenta de intentos, para reconstruir el formulario tras cada respuesta.
  //
  // React vacía el formulario del navegador cuando termina una acción. Es lo
  // que se quiere en el caso normal —enviaste, se guardó, empiezas de nuevo—
  // pero aquí el envío puede volver con errores, y entonces vaciarlo tira cinco
  // minutos de trabajo a la basura.
  //
  // Con las casillas de texto no se nota, porque React las repinta desde el
  // estado. Con las marcadas sí: el navegador las desmarca y React, que no ve
  // ningún cambio en el estado, no tiene motivo para volver a tocarlas.
  //
  // Cambiar la `key` del formulario lo desmonta y lo vuelve a montar entero.
  // Los campos se crean otra vez leyendo `v`, que vive aquí fuera y nadie ha
  // tocado. Es el patrón de React para reiniciar un trozo de interfaz.
  //
  // El ajuste se hace durante el pintado y no en un `useEffect` a propósito:
  // así no hay un pintado intermedio con las casillas vacías.
  const [respuestaVista, setRespuestaVista] = useState(estado);
  const [intento, setIntento] = useState(0);

  if (respuestaVista !== estado) {
    setRespuestaVista(estado);
    setIntento((n) => n + 1);
  }

  const errores = estado.errores ?? {};

  // Nombres legibles de los campos, para el resumen de arriba. En un formulario
  // de siete secciones, decir «revisa los campos marcados» y dejar el aviso
  // tres pantallas más abajo es lo mismo que no decir nada.
  const NOMBRES: Record<string, string> = {
    nombre: 'Nombre',
    apellidos: 'Apellidos',
    email: 'Correo electrónico',
    telefono: 'Teléfono',
    colegioId: 'Colegio',
    colegioOtro: 'Colegio',
    titulacion: 'Carrera',
    universidad: 'Universidad',
    anosExperiencia: 'Años dando clase',
    asignaturas: 'Asignaturas',
    niveles: 'Cursos',
    zona: 'Zona',
    puntosFuertes: 'Algo que te distinga',
    aceptaPublicacion: 'Autorización para publicar',
  };
  const listaErrores = Object.entries(errores);

  const cambiar = <K extends keyof Valores>(campo: K, valor: Valores[K]) =>
    setV((actual) => ({ ...actual, [campo]: valor }));

  const alternar = (campo: 'asignaturas' | 'niveles' | 'certificaciones' | 'disponibilidad', valor: string) =>
    setV((actual) => ({
      ...actual,
      [campo]: actual[campo].includes(valor)
        ? actual[campo].filter((x) => x !== valor)
        : [...actual[campo], valor],
    }));

  if (estado.ok) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-verde-avanza bg-verde-avanza-claro p-8 text-center">
          <h1 className="text-2xl font-bold text-verde-avanza-oscuro">
            Ficha recibida
          </h1>
          <p className="mx-auto mt-3 max-w-md text-carbon">
            La revisamos y te avisamos por correo en cuanto esté publicada.
            Suele ser cuestión de un día o dos.
          </p>
          {/*
            El resguardo lleva su enlace permanente, así que si lo da por
            perdido a los treinta segundos se queda sin llave y sin saberlo.
            Decir de antemano que tarda evita que lo busque, no lo vea, y
            concluya que escribió mal su correo.
          */}
          <p className="mx-auto mt-3 max-w-md text-sm text-verde-avanza-oscuro">
            Ahora mismo te llega un correo confirmando que la hemos recibido, y
            dentro va tu enlace para editarla. Puede tardar unos minutos; si
            pasado un rato no lo ves, mira en la carpeta de spam.
          </p>
        </div>

        {/* Lo primero que va a pasarle de verdad, dicho antes de que pase. Un
            mensaje de un número desconocido con un enlace dentro se ignora; el
            mismo mensaje, esperado, se abre. */}
        <div className="rounded-xl border border-gris-borde bg-gris-claro p-5 text-sm text-carbon">
          <p className="font-medium">
            Cómo te avisaremos cuando una familia te quiera
          </p>
          <p className="mt-2">
            Por hasta tres vías, para que no se te escape ninguna:
          </p>
          <ol className="mt-3 space-y-2">
            <li>
              <strong>Un aviso al móvil</strong>, al momento, si activas los
              avisos aquí abajo. Es la vía rápida: lo tocas y contestas desde
              ahí.
            </li>
            <li>
              <strong>Un correo, siempre</strong>, hayas activado los avisos o
              no. Así que{' '}
              <span className="font-medium">
                estate pendiente de tu correo
              </span>
              : es la vía que no falla nunca. Mira también la carpeta de spam
              las primeras veces.
            </li>
            <li>
              <strong>Un WhatsApp</strong>, solo si las dos anteriores no han
              llegado. Te lo mandaremos desde el número de AcademiAvanza.
            </li>
          </ol>
          <p className="mt-3">
            En el aviso verás el curso y lo que la familia cuenta, y un enlace
            para decir si puedes cogerla o no.{' '}
            <strong>No damos tu teléfono a nadie</strong> hasta que tú aceptas y
            la familia paga el contacto.
          </p>
        </div>

        {estado.tokenAvisos && <ActivarAvisos token={estado.tokenAvisos} />}
      </div>
    );
  }

  return (
    <form
      key={intento}
      action={accion}
      className="relative space-y-8"
      noValidate
    >
      <CamposTrampa />

      {/* El encabezado vive dentro del formulario para que desaparezca cuando
          la ficha ya se ha enviado. Un texto que invita a rellenar algo que ya
          has rellenado sobra, y encima de un «Ficha recibida» despista. */}
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza sm:text-4xl">
          Da clases con Academi<span className="text-verde-avanza">Avanza</span>
        </h1>
        <p className="mt-4 text-lg text-carbon">
          Rellena tu ficha una vez. Las familias te encontrarán por colegio,
          asignatura y curso, y te escribirán directamente.
        </p>
        <p className="mt-4 text-sm text-gris-medio">
          Tarda unos cinco minutos. No pedimos foto, ni notas, ni justificantes.
        </p>
        {/* Quién paga y quién no, dicho en la primera pantalla y sin rodeos.
            Que un profesor descubra a mitad del recorrido que hay dinero de por
            medio es la forma más rápida de que se vaya. */}
        <p className="mt-2 text-sm text-gris-medio">
          <span className="font-medium text-carbon">
            A ti no te cobramos nada
          </span>{' '}
          por aparecer ni por dar clase. Es la familia quien paga 10 € por el
          contacto, y solo después de que tú hayas dicho que sí. Lo que cobres
          por las clases lo acuerdas con ella y no lo tocamos.
        </p>
      </header>
      {estado.mensaje && (
        <div className="rounded-lg border border-error bg-red-50 px-4 py-3 text-sm text-error">
          <p className="font-medium">{estado.mensaje}</p>
          {listaErrores.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1">
              {listaErrores.map(([campo, mensaje]) => (
                <li key={campo}>
                  <span className="font-medium">
                    {NOMBRES[campo] ?? campo}:
                  </span>{' '}
                  {mensaje}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* --- Identidad -------------------------------------------------- */}
      <Seccion
        titulo="Quién eres"
        ayuda="En el directorio sólo aparecerá tu nombre y la inicial de tu primer apellido."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={claseEtiqueta} htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              className={claseCampo}
              value={v.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
            />
            <Aviso mensaje={errores.nombre} />
          </div>
          <div>
            <label className={claseEtiqueta} htmlFor="apellidos">
              Apellidos
            </label>
            <input
              id="apellidos"
              name="apellidos"
              className={claseCampo}
              value={v.apellidos}
              onChange={(e) => cambiar('apellidos', e.target.value)}
            />
            <Aviso mensaje={errores.apellidos} />
          </div>
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={claseCampo}
            value={v.email}
            onChange={(e) => cambiar('email', e.target.value)}
          />
          <p className="mt-1 text-sm text-gris-medio">
            No se publica. Es por donde te avisaremos cuando una familia te
            escriba, y por donde entrarás a cambiar tu ficha.
          </p>
          <Aviso mensaje={errores.email} />
        </div>

        <div className="sm:w-1/2">
          <label className={claseEtiqueta} htmlFor="telefono">
            Teléfono
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
            <span className="font-medium text-carbon">
              No aparece en tu ficha ni lo ve nadie que entre en la web.
            </span>{' '}
            Lo usamos para escribirte por WhatsApp cuando una familia te quiera,
            y sólo se lo damos a esa familia cuando tú has aceptado y ha pagado
            el contacto.
          </p>
          <Aviso mensaje={errores.telefono} />
        </div>
      </Seccion>

      {/* --- Colegio ---------------------------------------------------- */}
      <Seccion
        titulo="De qué colegio vienes"
        ayuda="Es lo que más miran las familias. Lo declaras tú; nosotros no lo comprobamos con el centro."
      >
        <SelectorColegio
          colegios={catalogos.colegios}
          colegioId={v.colegioId}
          colegioOtro={v.colegioOtro}
          onElegir={(id) =>
            setV((actual) => ({ ...actual, colegioId: id, colegioOtro: '' }))
          }
          onEscribir={(texto) =>
            setV((actual) => ({ ...actual, colegioId: '', colegioOtro: texto }))
          }
        />
        {/* El formulario se envía como HTML normal, así que los dos valores
            viajan en campos ocultos. */}
        <input type="hidden" name="colegioId" value={v.colegioId} />
        <input type="hidden" name="colegioOtro" value={v.colegioOtro} />
        <Aviso mensaje={errores.colegioId} />
        {/* El colegio escrito a mano también pasa por el filtro de datos
            sensibles, y su aviso tiene que salir junto al campo y no sólo en el
            resumen de arriba. */}
        <Aviso mensaje={errores.colegioOtro} />

      </Seccion>

      {/* --- Estudios --------------------------------------------------- */}
      <Seccion titulo="Qué estudias">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={claseEtiqueta} htmlFor="titulacion">
              Carrera
            </label>
            <input
              id="titulacion"
              name="titulacion"
              className={claseCampo}
              placeholder="Medicina"
              value={v.titulacion}
              onChange={(e) => cambiar('titulacion', e.target.value)}
            />
            <Aviso mensaje={errores.titulacion} />
          </div>
          <div>
            <label className={claseEtiqueta} htmlFor="universidad">
              Universidad
            </label>
            <input
              id="universidad"
              name="universidad"
              className={claseCampo}
              placeholder="Universidad Autónoma de Madrid"
              value={v.universidad}
              onChange={(e) => cambiar('universidad', e.target.value)}
            />
            <Aviso mensaje={errores.universidad} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-carbon">
          <input
            type="checkbox"
            name="titulacionFinalizada"
            className={claseCasilla}
            checked={v.titulacionFinalizada}
            onChange={(e) => cambiar('titulacionFinalizada', e.target.checked)}
          />
          Ya la he terminado
        </label>

        <div className="sm:w-56">
          <label className={claseEtiqueta} htmlFor="anosExperiencia">
            Años dando clases particulares{' '}
            <span className="font-normal text-gris-medio">(opcional)</span>
          </label>
          <input
            id="anosExperiencia"
            name="anosExperiencia"
            inputMode="numeric"
            placeholder="2"
            className={claseCampo}
            value={v.anosExperiencia}
            onChange={(e) => cambiar('anosExperiencia', e.target.value)}
          />
          <p className="mt-1 text-sm text-gris-medio">
            Aparece en tu ficha. Si empiezas ahora, déjalo en blanco: no resta.
          </p>
          <Aviso mensaje={errores.anosExperiencia} />
        </div>

        {!v.titulacionFinalizada && (
          <div className="sm:w-40">
            <label className={claseEtiqueta} htmlFor="cursoActual">
              Curso actual
            </label>
            <select
              id="cursoActual"
              name="cursoActual"
              className={claseCampo}
              value={v.cursoActual}
              onChange={(e) => cambiar('cursoActual', e.target.value)}
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}.º
                </option>
              ))}
            </select>
          </div>
        )}
      </Seccion>

      {/* --- Oferta ----------------------------------------------------- */}
      <Seccion
        titulo="Qué puedes dar"
        ayuda="Marca todo lo que te veas capaz de dar. Las familias filtran por esto."
      >
        <fieldset>
          <legend className={claseEtiqueta}>Asignaturas</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {catalogos.asignaturas.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-2 text-sm text-carbon"
              >
                <input
                  type="checkbox"
                  name="asignaturas"
                  value={a.id}
                  className={claseCasilla}
                  checked={v.asignaturas.includes(a.id)}
                  onChange={() => alternar('asignaturas', a.id)}
                />
                {a.nombre}
              </label>
            ))}
          </div>
          <Aviso mensaje={errores.asignaturas} />
        </fieldset>

        <fieldset>
          <legend className={claseEtiqueta}>Cursos</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {catalogos.niveles.map((n) => (
              <label
                key={n.id}
                className="flex items-center gap-2 text-sm text-carbon"
              >
                <input
                  type="checkbox"
                  name="niveles"
                  value={n.id}
                  className={claseCasilla}
                  checked={v.niveles.includes(n.id)}
                  onChange={() => alternar('niveles', n.id)}
                />
                {n.nombre}
              </label>
            ))}
          </div>
          <Aviso mensaje={errores.niveles} />
        </fieldset>
      </Seccion>

      {/* --- Modalidad -------------------------------------------------- */}
      <Seccion titulo="Cómo y dónde">
        <fieldset>
          <legend className={claseEtiqueta}>Modalidad</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {[
              { valor: 'online', etiqueta: 'Sólo online' },
              { valor: 'presencial', etiqueta: 'Sólo a domicilio del alumno' },
              { valor: 'ambas', etiqueta: 'Las dos' },
            ].map((o) => (
              <label
                key={o.valor}
                className="flex items-center gap-2 text-sm text-carbon"
              >
                <input
                  type="radio"
                  name="modalidad"
                  value={o.valor}
                  className={claseCasilla}
                  checked={v.modalidad === o.valor}
                  onChange={(e) => cambiar('modalidad', e.target.value)}
                />
                {o.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        {v.modalidad !== 'online' && (
          <div>
            <label className={claseEtiqueta} htmlFor="zona">
              Zonas a las que te desplazas
            </label>
            <input
              id="zona"
              name="zona"
              className={claseCampo}
              placeholder="Chamartín, Las Rozas…"
              value={v.zona}
              onChange={(e) => cambiar('zona', e.target.value)}
            />
            <p className="mt-1 text-sm text-gris-medio">
              El barrio o el municipio. No pongas tu dirección.
            </p>
<Aviso mensaje={errores.zona} />
            <label className="mt-3 flex items-start gap-2 text-sm text-carbon">
              <input
                type="checkbox"
                name="desplazamientoFlexible"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2E7D5E]"
                checked={v.desplazamientoFlexible}
                onChange={(e) =>
                  cambiar('desplazamientoFlexible', e.target.checked)
                }
              />
              <span>
                Puedo ir a otras zonas si el horario o la duración compensan.{' '}
                <span className="text-gris-medio">
                  Márcalo si te lo plantearías: hay familias de fuera de tu zona
                  que, si no, ni te escriben.
                </span>
              </span>
            </label>
          </div>
        )}
      </Seccion>

      {/* --- Disponibilidad --------------------------------------------- */}
      <Seccion
        titulo="Cuándo puedes"
        ayuda="Orientativo. Te preguntaremos cada tres meses si ha cambiado."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr>
                <th className="w-24 py-2 text-left font-medium text-gris-medio">
                  Día
                </th>
                {Object.entries(FRANJAS).map(([clave, f]) => (
                  <th
                    key={clave}
                    className="py-2 text-center font-medium text-gris-medio"
                  >
                    {f.etiqueta}
                    <span className="block text-xs font-normal">
                      {f.inicio}–{f.fin}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS.map((d) => (
                <tr key={d.numero} className="border-t border-gris-borde">
                  <td className="py-2 text-carbon">{d.etiqueta}</td>
                  {Object.keys(FRANJAS).map((franja) => {
                    const clave = `${d.numero}-${franja}`;
                    return (
                      <td key={franja} className="py-2 text-center">
                        <input
                          type="checkbox"
                          name="disponibilidad"
                          value={clave}
                          aria-label={`${d.etiqueta}, ${franja}`}
                          className="h-5 w-5 accent-[#2E7D5E]"
                          checked={v.disponibilidad.includes(clave)}
                          onChange={() => alternar('disponibilidad', clave)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      {/* --- Idiomas ---------------------------------------------------- */}
      <Seccion
        titulo="Idiomas"
        ayuda="Sólo si tienes algún certificado. No hace falta que lo envíes."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {catalogos.certificaciones.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 text-sm text-carbon"
            >
              <input
                type="checkbox"
                name="certificaciones"
                value={c.id}
                className={claseCasilla}
                checked={v.certificaciones.includes(c.id)}
                onChange={() => alternar('certificaciones', c.id)}
              />
              {c.idioma} · {c.nombre}
            </label>
          ))}
        </div>
      </Seccion>

      {/* --- Puntos fuertes --------------------------------------------- */}
      <Seccion titulo="Algo que te distinga al dar clase">
        <div>
          <textarea
            id="puntosFuertes"
            name="puntosFuertes"
            rows={4}
            maxLength={300}
            className={claseCampo}
            placeholder="Por ejemplo: que tienes mucha paciencia, que se te da bien explicar, que te manejas bien con adolescentes, que sabes preparar un examen concreto."
            value={v.puntosFuertes}
            onChange={(e) => cambiar('puntosFuertes', e.target.value)}
          />
          <div className="mt-1 flex justify-between text-sm text-gris-medio">
            <span>Es lo único que te diferencia del resto de fichas.</span>
            <span>{v.puntosFuertes.length}/300</span>
          </div>
          <Aviso mensaje={errores.puntosFuertes} />
        </div>
      </Seccion>

      {/* --- Consentimiento --------------------------------------------- */}
      <section className="border-t border-gris-borde pt-8">
        <label className="flex items-start gap-3 text-sm text-carbon">
          <input
            type="checkbox"
            name="aceptaPublicacion"
            className="mt-1 h-4 w-4 shrink-0 accent-[#2E7D5E]"
            checked={v.aceptaPublicacion}
            onChange={(e) => cambiar('aceptaPublicacion', e.target.checked)}
          />
          <span>
            Autorizo a AcademiAvanza a publicar esta ficha en su directorio y a
            usar mi correo y mi teléfono para avisarme de los contactos que
            reciba, según la{' '}
            <a
              href="/legal/privacidad"
              target="_blank"
              className="underline underline-offset-2"
            >
              política de privacidad
            </a>
            . Puedo retirarla cuando quiera.
          </span>
        </label>
        <Aviso mensaje={errores.aceptaPublicacion} />

        <button
          type="submit"
          disabled={enviando}
          className="mt-6 w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro disabled:opacity-60 sm:w-auto"
        >
          {enviando ? 'Enviando…' : 'Enviar mi ficha'}
        </button>

        <p className="mt-3 text-sm text-gris-medio">
          Revisaremos la ficha antes de publicarla. Te avisamos por correo.
        </p>
      </section>
    </form>
  );
}
