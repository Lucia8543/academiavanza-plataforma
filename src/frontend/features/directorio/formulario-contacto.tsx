'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { enviarContacto, type EstadoContacto } from '@/app/profesor/[slug]/acciones';
import { CamposTrampa } from '@/frontend/components/shared/campos-trampa';
import {
  PLAZOS,
  URGENCIA_POR_DEFECTO,
  type Urgencia,
} from '@/shared/reglas/cobro';
import { BARRIOS, GRUPOS_DE_ZONAS } from '@/shared/datos/zonas';
import { DIAS } from '@/shared/schemas/profesor';
import { HORAS_SEMANA } from '@/shared/textos/horario-familia';
import {
  CUANTOS_ALUMNOS,
  UN_CONTACTO_AUNQUE_SEAN_VARIOS,
} from '@/shared/textos/hermanos';
import { EXPLICACION_PRESENCIAL } from '@/shared/textos/modalidad';
import { euros, porHora, PRECIO_ES_ORIENTATIVO } from '@/shared/textos/precios';
import { sugerirCorreo } from '@/shared/schemas/correo-erratas';
import {
  detectarDatosSensibles,
  mensajeDeAviso,
} from '@/shared/schemas/datos-sensibles';
import {
  detectarDatosDeContacto,
  mensajeDeAvisoContacto,
} from '@/shared/schemas/datos-de-contacto';

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

/**
 * Un alumno de la solicitud: su curso y cuántas horas necesita.
 *
 * El primero se guarda suelto, en `nivelId` y `horasSemana`, porque así se
 * llaman los campos que existían antes de que hubiera hermanos y que sigue
 * usando media plataforma. Los demás van en `hermanos`. La asimetría se explica
 * entera en `shared/schemas/contacto.ts`.
 */
type Hermano = { nivelId: string; horasSemana: string };

type Valores = {
  nombreFamilia: string;
  telefono: string;
  email: string;
  nivelId: string;
  horasSemana: string;
  hermanos: Hermano[];
  valeConUno: boolean;
  zona: string;
  barrio: string;
  // Los días marcados, como cadenas, que es lo que devuelve un formulario.
  diasPreferidos: string[];
  urgencia: Urgencia;
  mensaje: string;
  vale: string;
};

const VACIO: Valores = {
  nombreFamilia: '',
  telefono: '',
  email: '',
  nivelId: '',
  horasSemana: '',
  hermanos: [],
  valeConUno: false,
  zona: '',
  barrio: '',
  diasPreferidos: [],
  urgencia: URGENCIA_POR_DEFECTO,
  mensaje: '',
  vale: '',
};

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

  /*
   * Lo mismo que en el alta del profesor: si el envío falla, la vista sube al
   * aviso.
   *
   * Aquí importa incluso más. Quien rellena esto es una madre buscando profesor
   * para su hijo, no alguien con motivos para insistir en una página que no le
   * contesta. Un envío que aparenta no hacer nada es una familia perdida, y
   * encima invisible: por nuestra parte no hay error ninguno que mirar.
   */
  const avisoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!estado.mensaje) return;
    avisoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [estado]);

  /*
   * Lo que se escribió en el intento anterior, si lo hubo.
   *
   * El spread a secas ya no basta. `valores` es una bolsa de cadenas y listas
   * de cadenas —es lo que sabe mandar y devolver un formulario— y aquí dentro
   * hay ya dos cosas que no lo son: los hermanos, que son objetos, y
   * `valeConUno`, que es un sí o un no. Volcarlas tal cual dejaría el estado con
   * la cadena «si» donde el resto del componente espera un booleano, y eso no
   * falla al compilar: falla al pintar, y raro.
   */
  const [v, setV] = useState<Valores>(() => {
    const previo = estado.valores ?? {};
    const cursos = Array.isArray(previo.alumnoNivel) ? previo.alumnoNivel : [];
    const horas = Array.isArray(previo.alumnoHoras) ? previo.alumnoHoras : [];

    return {
      ...VACIO,
      ...previo,
      // El primero suelto y los demás en la lista, igual que hace el servidor
      // al recibirlos. Es la misma separación en los dos sentidos.
      nivelId: cursos[0] ?? '',
      horasSemana: horas[0] ?? '',
      hermanos: cursos.slice(1).map((nivelId, i) => ({
        nivelId,
        horasSemana: horas[i + 1] ?? '',
      })),
      valeConUno: previo.valeConUno === 'si',
    } as Valores;
  });

  const [respuestaVista, setRespuestaVista] = useState(estado);
  const [intento, setIntento] = useState(0);

  /*
   * El instante en que esta familia abrió el formulario, fuera del `<form>`.
   *
   * Mismo motivo que en el alta del profesor: el formulario se vuelve a montar
   * con cada respuesta, y el reloj antibots que vive dentro volvía a cero. Una
   * madre a la que le faltaba un campo, lo corregía y reenviaba deprisa,
   * quedaba marcada como guion automático. En los registros hay tres
   * solicitudes de familias descartadas así, cuando eso todavía descartaba.
   */
  const [abiertoEn] = useState(() => Date.now());

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
  /*
   * Un teléfono o un correo dentro del texto, que es otra cosa y por eso es
   * otra variable.
   *
   * Se mira también el nombre porque el profesor lo ve antes de pagar nadie,
   * igual que el mensaje. Aquí sólo avisa mientras se escribe; la regla la pone
   * el servidor, en `esquemaContacto`.
   */
  const contactoEnMensaje = detectarDatosDeContacto(v.mensaje);
  const contactoEnNombre = detectarDatosDeContacto(v.nombreFamilia);
  const contactoALaVista = contactoEnMensaje ?? contactoEnNombre;
  const sugerencia = sugerirCorreo(v.email);

  /*
   * Los alumnos como una sola lista, para poder pintarlos con un bucle.
   *
   * Por dentro el primero vive suelto —en `nivelId` y `horasSemana`, que son
   * los nombres que ya existían y que sigue leyendo media plataforma— y los
   * demás en `hermanos`. Aquí se juntan sólo para pintar, porque tres bloques
   * idénticos escritos a mano se desincronizan a la tercera vez que se cambia
   * uno de ellos.
   */
  const alumnos: Hermano[] = [
    { nivelId: v.nivelId, horasSemana: v.horasSemana },
    ...v.hermanos,
  ];

  const cambiarAlumno = (i: number, campo: keyof Hermano, valor: string) => {
    if (i === 0) {
      cambiar(campo, valor);
      return;
    }
    setV((actual) => ({
      ...actual,
      hermanos: actual.hermanos.map((h, j) =>
        j === i - 1 ? { ...h, [campo]: valor } : h,
      ),
    }));
  };

  /*
   * Cambiar cuántos son **conserva lo ya escrito**.
   *
   * Quien pasa de dos hermanos a tres no quiere perder los dos que ya había
   * rellenado, y quien baja de tres a dos y vuelve a subir tampoco. Recortar y
   * rellenar en vez de reconstruir la lista es lo que evita ese castigo, que es
   * de los que hacen abandonar un formulario a medias.
   */
  const cambiarCuantos = (cuantos: number) => {
    setV((actual) => {
      const quiere = cuantos - 1;
      const hermanos = actual.hermanos.slice(0, quiere);
      while (hermanos.length < quiere) {
        hermanos.push({ nivelId: '', horasSemana: '' });
      }
      // Si se queda en un alumno, la pregunta de «me vale con uno» desaparece
      // de la pantalla y su respuesta tiene que desaparecer con ella. El
      // servidor lo apaga también, por si el envío no viene de aquí.
      return {
        ...actual,
        hermanos,
        valeConUno: hermanos.length > 0 ? actual.valeConUno : false,
      };
    });
  };

  const precioDe = (nivelId: string) => niveles.find((n) => n.id === nivelId);

  // Cuando sale bien no se pinta nada aquí: la acción lleva a la página de
  // seguimiento de la familia, que es donde está todo lo que necesita saber.

  return (
    <form
      key={intento}
      action={accion}
      className="relative rounded-xl border border-gris-borde bg-white p-6"
      noValidate
    >
      <CamposTrampa inicio={abiertoEn} />
      <input type="hidden" name="slug" value={slug} />

      <h3 className="text-lg font-bold text-azul-confianza">
        Escribir a {nombreProfesor}
      </h3>
      <p className="mt-1 text-sm text-gris-medio">
        Escribir es gratis. Le preguntamos si puede cogerte y te lo decimos.
        Solo si acepta pagarás {euros(precio)} por el contacto, y entonces os
        damos tu teléfono para que te escriba.
      </p>

      {/* Presencial significa que el profesor va a casa del alumno, y la gente lo da
          por supuesto en las dos direcciones. Enterarse en la primera llamada,
          después de haber pagado, es de las cosas que acaban en devolución. */}
      {daPresencial && (
        <p className="mt-2 rounded-lg bg-gris-claro px-3 py-2 text-sm text-carbon">
          {EXPLICACION_PRESENCIAL}
        </p>
      )}

      {estado.mensaje && (
        <div
          ref={avisoRef}
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
          {contactoEnNombre && (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {mensajeDeAvisoContacto(contactoEnNombre)}
            </p>
          )}
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
            Es para avisarte de lo que pasa, cuando el profesor conteste y
            cuando podáis hablar.{' '}
            <span className="font-medium text-carbon">
              Al profesor no se lo damos.
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
          <>
            {/*
              Para quién son las clases.
              ----------------------------------------------------------------

              Va antes que el curso porque cambia el sentido de todo lo que
              viene detrás: con dos hermanos hay dos cursos y dos cantidades de
              horas, y una sola respuesta a los días, la zona y la prisa, que
              son de la familia entera.

              Nació de un lío real. Una madre quería tres horas para su hija y
              dos para su hijo con la misma profesora, el formulario sólo
              admitía un curso, y como tuvo que apostar por uno de los dos
              acabó escribiendo a varios profesores por si acaso. Lo que no se
              puede decir se cuenta mal.
            */}
            <fieldset>
              <legend className={claseEtiqueta}>
                ¿Para quién son las clases?
              </legend>

              <div className="mt-3 flex flex-wrap gap-2">
                {CUANTOS_ALUMNOS.map((opcion) => {
                  const elegida = v.hermanos.length + 1 === opcion.valor;

                  return (
                    <label
                      key={opcion.valor}
                      className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium ${
                        elegida
                          ? 'border-verde-avanza bg-verde-avanza-claro text-verde-avanza-oscuro'
                          : 'border-gris-borde text-carbon hover:bg-gris-claro'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cuantosAlumnos"
                        value={opcion.valor}
                        checked={elegida}
                        onChange={() => cambiarCuantos(opcion.valor)}
                        className="sr-only"
                      />
                      {opcion.etiqueta}
                    </label>
                  );
                })}
              </div>

              {/* La frase que faltaba el día del lío. Sale en cuanto marca
                  hermanos, que es el momento en que está decidiendo a cuántos
                  profesores escribe. */}
              {v.hermanos.length > 0 && (
                <p className="mt-3 rounded-lg bg-verde-avanza-claro px-3 py-2 text-sm text-verde-avanza-oscuro">
                  {UN_CONTACTO_AUNQUE_SEAN_VARIOS}
                </p>
              )}
            </fieldset>

            {/*
              Un bloque por alumno: su curso y sus horas, juntos.

              Las horas estaban sueltas más abajo, y con hermanos eso ya no se
              sostiene: «cinco horas» no dice si son tres de una y dos del otro,
              que es justo lo que el profesor necesita para saber si puede coger
              a uno solo.
            */}
            {alumnos.map((alumno, i) => (
              <fieldset
                key={i}
                className={
                  v.hermanos.length > 0
                    ? 'rounded-lg border border-gris-borde p-4'
                    : undefined
                }
              >
                {v.hermanos.length > 0 && (
                  <legend className="px-2 text-sm font-semibold text-azul-confianza">
                    {i === 0 ? 'Primer hermano' : `Hermano ${i + 1}`}
                  </legend>
                )}

                {/*
                  Todos los alumnos se envían con el mismo nombre, incluido el
                  primero, y el servidor separa el primero de los demás.

                  Se probó a poner `name={i === 0 ? 'nivelId' : 'hermanoNivel'}`
                  y hay que no hacerlo: la prueba que vigila que no se pierda
                  ningún campo lee este fichero como texto y sólo reconoce el
                  atributo escrito literal, entre comillas. Con el nombre
                  calculado, esos
                  campos dejaban de estar vigilados sin que fallara nada, que es
                  exactamente el fallo silencioso que esa prueba existe para
                  cazar.
                */}
                <label className={claseEtiqueta} htmlFor={`alumnoNivel-${i}`}>
                  Curso
                </label>
                <select
                  id={`alumnoNivel-${i}`}
                  name="alumnoNivel"
                  className={claseCampo}
                  value={alumno.nivelId}
                  onChange={(e) => cambiarAlumno(i, 'nivelId', e.target.value)}
                >
                  {/* Sin opción de escaquearse: es lo primero que pregunta
                      cualquier profesor. La lista son sólo los cursos que da
                      éste, así que si el tuyo no está, no es tu profesor. */}
                  <option value="">Elige el curso</option>
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>

                {/* El precio aparece en cuanto elige el curso, no escondido en
                    otra pantalla. Es el momento en que decide si le encaja. */}
                {precioDe(alumno.nivelId) ? (
                  <p className="mt-1 text-sm text-carbon">
                    {precioDe(alumno.nivelId)?.precio === null ? (
                      <>Precio a convenir con el profesor.</>
                    ) : (
                      <>
                        Precio de referencia:{' '}
                        <span className="font-semibold">
                          {porHora(precioDe(alumno.nivelId)?.precio ?? 0)}
                        </span>
                        . {PRECIO_ES_ORIENTATIVO}
                      </>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-gris-medio">
                    Son los cursos a los que da clase. Al elegir verás el precio
                    de referencia de la hora.
                  </p>
                )}
                {i === 0 && <Aviso mensaje={errores.nivelId} />}

                <label
                  className={`${claseEtiqueta} mt-4`}
                  htmlFor={`alumnoHoras-${i}`}
                >
                  ¿Cuántas horas a la semana?{' '}
                  <span className="font-normal text-gris-medio">
                    (si ya lo sabes)
                  </span>
                </label>
                <select
                  id={`alumnoHoras-${i}`}
                  name="alumnoHoras"
                  className={`${claseCampo} mt-1`}
                  value={alumno.horasSemana}
                  onChange={(e) =>
                    cambiarAlumno(i, 'horasSemana', e.target.value)
                  }
                >
                  <option value="">Prefiero no decirlo ahora</option>
                  {HORAS_SEMANA.map((h) => (
                    <option key={h.valor} value={h.valor}>
                      {h.etiqueta}
                    </option>
                  ))}
                </select>
                {i === 0 && <Aviso mensaje={errores.horasSemana} />}
              </fieldset>
            ))}

            {/*
              Y la pregunta que hace que el profesor pueda elegir.

              Sin ella, quien sólo tiene hueco para uno de los dos tiene que
              decir que no a todo, y la familia se queda sin nadie teniendo
              media solución delante.
            */}
            {v.hermanos.length > 0 && (
              <fieldset>
                <legend className={claseEtiqueta}>
                  ¿Necesitas que los coja a todos?
                </legend>

                <div className="mt-3 space-y-2">
                  {[
                    {
                      valor: false,
                      titulo: 'Sí, busco a alguien para todos',
                      pie: 'Si no puede con todos, dirá que no.',
                    },
                    {
                      valor: true,
                      titulo: 'Me vale con que coja a uno',
                      pie: 'Elegirá él cuál le encaja mejor en el horario. Sigue siendo un solo contacto.',
                    },
                  ].map((o) => (
                    <label
                      key={String(o.valor)}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                        v.valeConUno === o.valor
                          ? 'border-verde-avanza bg-verde-avanza-claro'
                          : 'border-gris-borde hover:bg-gris-claro'
                      }`}
                    >
                      {/* Radio y no casilla, aunque por dentro sea un sí o un
                          no. Con dos casillas del mismo nombre, la de «los
                          quiero a todos» también se enviaría marcada y el
                          servidor leería lo contrario de lo elegido. */}
                      <input
                        type="radio"
                        name="valeConUno"
                        value={o.valor ? 'si' : 'no'}
                        checked={v.valeConUno === o.valor}
                        onChange={() => cambiar('valeConUno', o.valor)}
                        className="mt-1 h-4 w-4 accent-[#2E7D5E]"
                      />
                      <span>
                        <span className="block font-medium text-carbon">
                          {o.titulo}
                        </span>
                        <span className="block text-sm text-gris-medio">
                          {o.pie}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </>
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
              desplazarse. No pongas tu dirección, que con el barrio sobra.
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
          Las horas ya no están aquí, están dentro del bloque de cada alumno.

          Estuvieron sueltas en este sitio desde que las pidió una profesora que
          no podía saber si le cabía en el horario antes de aceptar. Con
          hermanos dejó de servir: «cinco horas» no dice si son tres de una y dos
          del otro, y ésa es justo la cuenta que necesita quien va a coger sólo
          a uno.
        */}

        {/*
          Los días, sin franja horaria.

          Las franjas ya las declara el profesor en su rejilla, y pedirle a una
          madre que rellene siete días por tres franjas en el móvil es perder
          solicitudes. Con los días basta para descartar lo imposible; la hora
          concreta la acuerdan ellos cuando hablen.
        */}
        <fieldset>
          <legend className={claseEtiqueta}>
            ¿Qué días te vendrían mejor?{' '}
            <span className="font-normal text-gris-medio">(los que quieras)</span>
          </legend>
          <p className="mt-1 text-sm text-gris-medio">
            Marca los que te encajen. Si te da igual, déjalo sin marcar.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {DIAS.map((dia) => {
              const valor = String(dia.numero);
              const marcado = v.diasPreferidos.includes(valor);

              return (
                <label
                  key={dia.numero}
                  className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium ${
                    marcado
                      ? 'border-verde-avanza bg-verde-avanza-claro text-verde-avanza-oscuro'
                      : 'border-gris-borde text-carbon hover:bg-gris-claro'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="diasPreferidos"
                    value={valor}
                    checked={marcado}
                    onChange={(e) =>
                      cambiar(
                        'diasPreferidos',
                        e.target.checked
                          ? [...v.diasPreferidos, valor]
                          : v.diasPreferidos.filter((d) => d !== valor),
                      )
                    }
                    className="sr-only"
                  />
                  {dia.etiqueta}
                </label>
              );
            })}
          </div>
          <Aviso mensaje={errores.diasPreferidos} />
        </fieldset>

        {/*
          El texto libre, y va aquí pegado a los días por un motivo.
          --------------------------------------------------------------------

          Estaba al final, después de la prisa, con el título «Algo que quieras
          contarle». Ahí se leía como el hueco de las cortesías y se rellenaba
          poco.

          Y resulta que es la pieza que sostiene todo lo de arriba. Las horas y
          los días son listas cerradas, y la realidad de una familia no lo es:
          hora y media en vez de una hora, un día dos horas y otro una, «me da
          igual el día pero prefiero los martes». Nada de eso cabe en un
          desplegable, y el sitio donde se cuenta es éste. Poniéndolo justo
          debajo se entiende que sirve para matizar lo que se acaba de marcar.

          **Y sigue habiendo una sola casilla.** La tentación era añadir otra
          para el horario, y el resultado habría sido gente escribiendo el
          horario en la de abajo y la asignatura en la de arriba, con el
          profesor leyendo dos cajas medio vacías.
        */}
        <div>
          <label className={claseEtiqueta} htmlFor="mensaje">
            Cuéntale lo que no cabe en las casillas de arriba{' '}
            <span className="font-normal text-gris-medio">(opcional)</span>
          </label>
          <p className="mt-1 mb-2 text-sm text-gris-medio">
            Por ejemplo, si prefieres hora y media en vez de una hora, si un día
            te viene mejor que otro, o qué asignatura es.{' '}
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
            placeholder="Los martes y jueves nos vendrían mejor, y si puede ser hora y media mejor que una hora. Va bien en todo menos en mates."
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

          {/* El otro aviso, el del teléfono metido en el texto. Va aparte y no
              con un `||` porque los dos pueden saltar a la vez y decir cosas
              distintas, y quien lee «quita eso» sin saber cuál de las dos cosas
              borra el mensaje entero y se va. */}
          {contactoEnMensaje && (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {mensajeDeAvisoContacto(contactoEnMensaje)}
            </p>
          )}

          <Aviso mensaje={errores.mensaje} />
        </div>

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
          disabled={enviando || Boolean(sospecha) || Boolean(contactoALaVista)}
          className="w-full rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro disabled:opacity-60 sm:w-auto"
        >
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>

        {(sospecha || contactoALaVista) && (
          <p className="text-sm text-gris-medio">
            Quita esa parte y podrás enviarlo. El resto de lo que has escrito se
            conserva.
          </p>
        )}
      </div>
    </form>
  );
}
