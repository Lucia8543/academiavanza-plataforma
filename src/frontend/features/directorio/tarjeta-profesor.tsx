import { DIAS, FRANJAS } from '@/shared/schemas/profesor';
import { ETIQUETA_CUPO } from '@/shared/reglas/cupo';
import { comoDaClase } from '@/shared/textos/modalidad';
import type { ProfesorPublico } from '@/shared/types/directorio';

/**
 * Una ficha vista por una familia.
 *
 * El colegio va arriba y destacado porque es la razón por la que alguien elige
 * esta plataforma en vez de cualquier tablón de anuncios: saber en qué colegio
 * estudió quien va a dar clase a su hijo.
 *
 * Se dice «en qué colegio estudió» y no «de dónde viene», que era la redacción
 * original. Fuera de contexto, «de dónde viene» una persona no suena a colegio;
 * suena a origen, y no es en absoluto lo que se comprueba aquí.
 *
 * Y va sin adjetivos. Ni «verificado», ni «de confianza», ni «avalado». La
 * plataforma no ha examinado a nadie: ha comprobado de qué colegio viene, que es
 * mucho menos y hay que decirlo con esas palabras.
 */

const DIA_CORTO = Object.fromEntries(DIAS.map((d) => [d.numero, d.corta]));


function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gris-claro px-2.5 py-1 text-xs font-medium text-carbon">
      {children}
    </span>
  );
}

export function TarjetaProfesor({ f }: { f: ProfesorPublico }) {
  const estudios = f.titulacionFinalizada
    ? `${f.titulacion}, terminada`
    : f.cursoActual
      ? `${f.titulacion}, ${f.cursoActual}.º curso`
      : f.titulacion;

  // «A domicilio», no «presencial»: es el profesor quien se desplaza a casa del
  // alumno, y darlo por supuesto al revés es de las cosas que acaban en una
  // devolución.
  const donde = comoDaClase(f.modalidad, f.zona, f.desplazamientoFlexible);

  const completo = f.cupo === 'completo';

  return (
    /*
      Quien no tiene hueco sale igual, pero apagado.

      Fondo gris en vez de blanco y el texto algo más tenue. No se difumina ni
      se tapa: una ficha borrosa se lee como un muro de pago —«te lo enseño si
      pagas»— y aquí el mensaje es el contrario, que esta persona existe y está
      dando clase. Lo que se quita es el brillo, no la información.
    */
    <article
      className={`flex h-full flex-col rounded-xl border p-5 ${
        completo
          ? 'border-gris-borde bg-gris-claro text-gris-medio'
          : 'border-gris-borde bg-white'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className={`text-lg font-bold ${
            completo ? 'text-gris-medio' : 'text-azul-confianza'
          }`}
        >
          {f.nombrePublico}
        </h3>

        {/* Se dice, no se esconde. La familia decide a quién escribe primero. */}
        {ETIQUETA_CUPO[f.cupo] && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              completo
                ? 'bg-gris-borde text-carbon'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {ETIQUETA_CUPO[f.cupo]}
          </span>
        )}
      </div>

      {f.colegio && (
        <p className="mt-1 text-sm font-medium text-verde-avanza-oscuro">
          Estudió en {f.colegio}
        </p>
      )}

      {estudios && (
        <p className="mt-2 text-sm text-gris-medio">
          {estudios}
          {f.universidad ? ` · ${f.universidad}` : ''}
        </p>
      )}

      {/* Sólo si tiene alguno. Poner «0 años» sería una etiqueta de novato
          puesta por la propia plataforma, la misma razón por la que el
          contador de clases del histórico no se enseña por debajo de 20. */}
      {f.anosExperiencia !== null && f.anosExperiencia > 0 && (
        <p className="mt-1 text-sm font-medium text-carbon">
          {f.anosExperiencia === 1
            ? 'Un año dando clases'
            : `${f.anosExperiencia} años dando clases`}
        </p>
      )}

      {f.puntosFuertes && (
        <blockquote className="mt-4 border-l-2 border-verde-avanza pl-3 text-sm italic text-carbon">
          «{f.puntosFuertes}»
        </blockquote>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="inline font-medium text-carbon">Da: </dt>
          <dd className="inline text-carbon">{f.asignaturas.join(', ')}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-carbon">A: </dt>
          <dd className="inline text-carbon">{f.niveles.join(', ')}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-carbon">Dónde: </dt>
          <dd className="inline text-carbon">{donde}</dd>
        </div>
      </dl>

      {/*
        El botón dice lo que va a pasar, y con el cupo lleno no va a pasar lo
        mismo: quien entra no se va a poder poner en contacto. Prometerlo en la
        etiqueta y encontrarse el formulario cerrado dentro es el tipo de
        pequeña mentira que gasta la confianza de una web entera.

        Lo que no se hace es deshabilitarlo. La ficha sigue mereciendo la pena
        —dice quién es, de qué colegio viene y qué da—, y un botón muerto
        contradice la razón por la que estas fichas se enseñan apagadas en vez
        de esconderse.
      */}
      <div className="mt-5">
        <a
          href={`/profesor/${f.slug}`}
          className="inline-block rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          {completo ? 'Ver ficha' : 'Ver ficha y escribirle'}
        </a>
      </div>

      {(f.idiomas.length > 0 || f.disponibilidad.length > 0) && (
        <div className="mt-4 space-y-3 border-t border-gris-borde pt-4">
          {f.idiomas.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gris-medio">
                Idiomas
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {f.idiomas.map((i) => (
                  <Etiqueta key={i}>{i}</Etiqueta>
                ))}
              </div>
              {/* Lo declara quien se da de alta. No se pide el título, y por eso
                  no se puede decir que esté comprobado. */}
              <p className="mt-1.5 text-xs text-gris-medio">
                Según lo indicado por el profesor
              </p>
            </div>
          )}

          {f.disponibilidad.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gris-medio">
                Suele poder
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {f.disponibilidad.map((d) => (
                  <Etiqueta key={`${d.dia}-${d.franja}`}>
                    {DIA_CORTO[d.dia]} {FRANJAS[d.franja].etiqueta.toLowerCase()}
                  </Etiqueta>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
