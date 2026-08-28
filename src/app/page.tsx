import {
  colegioDestacado,
  contarPublicadas,
  cuantosColegios,
} from '@/backend/repositories/directorio';
import { precioVigente } from '@/backend/repositories/tarifas';
import { GUIAS_DE_CLASE } from '@/shared/datos/guias-de-clase';
import { HISTORICO, NOTA_HISTORICO } from '@/shared/datos/historico';
import { DIAS_PARA_RECLAMAR } from '@/backend/services/solicitud';

export const dynamic = 'force-dynamic';

const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n,
  );

const miles = (n: number) => new Intl.NumberFormat('es-ES').format(n);

function Cifra({ numero, texto }: { numero: string; texto: string }) {
  return (
    <div>
      <dt className="text-3xl font-extrabold text-verde-avanza sm:text-4xl">
        {numero}
      </dt>
      <dd className="mt-1 text-sm leading-tight text-gris-medio">{texto}</dd>
    </div>
  );
}

function Paso({
  numero,
  titulo,
  texto,
}: {
  numero: number;
  titulo: string;
  texto: string;
}) {
  return (
    <li className="flex gap-4 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-verde-avanza-claro text-sm font-bold text-verde-avanza-oscuro">
        {numero}
      </span>
      <div>
        <h3 className="font-semibold text-carbon">{titulo}</h3>
        <p className="mt-1 text-sm text-gris-medio">{texto}</p>
      </div>
    </li>
  );
}

export default async function Portada() {
  const [profesores, precio, destacado, colegios] = await Promise.all([
    contarPublicadas(),
    precioVigente(),
    colegioDestacado(),
    cuantosColegios(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        {/* El logo va en SVG y no en PNG: es el mismo fichero para el móvil y
            para una pantalla de retina, pesa trece kilobytes y no se pixela
            nunca. Lleva alt vacío a propósito —el nombre está justo debajo, en
            el h1— para que un lector de pantalla no lo lea dos veces. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          width={96}
          height={96}
          className="mx-auto h-24 w-24"
        />

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-azul-confianza sm:text-5xl">
          Academi<span className="text-verde-avanza">Avanza</span>
        </h1>

        {/* «Sabiendo de dónde viene» se cambió por «en qué colegio estudió».
            El original era ambiguo de una forma fea: leído por alguien que no
            conoce la plataforma, «de dónde viene» una persona no suena a
            colegio, suena a origen. Lo que aquí se comprueba es el centro donde
            estudió, y decirlo con esas palabras no cuesta nada. */}
        <p className="mt-6 text-lg text-carbon">
          Encuentra profesor para tu hijo.
          <br />
          <span className="font-semibold">
            Sabiendo en qué colegio estudió.
          </span>
        </p>

        {/* Se quitó «que nos han dicho en qué colegio estudiaron»: sonaba a
            rumor y además repetía lo que ya dice la línea de arriba. Corto, que
            es lo que se lee. */}
        <p className="mt-6 text-base text-gris-medio">
          Profesores particulares en Madrid. Filtra por colegio, asignatura y
          curso, y escribe a quien te encaje.{' '}
          <span className="font-medium text-carbon">
            Más de {miles(HISTORICO.clases)} clases dadas en el último curso.
          </span>
        </p>

        <a
          href="/profesores"
          className="mt-8 inline-block rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          Ver profesores
        </a>

        {/* La cifra sólo se enseña cuando dice algo. «3 profesores» espanta más
            de lo que atrae, y no ponerla no engaña a nadie. */}
        {profesores >= 15 && (
          <p className="mt-3 text-sm text-gris-medio">
            {profesores} profesores publicados
          </p>
        )}

        {/* Sin registro, y dicho pronto. Es de las pocas cosas en las que esto
            gana claramente a las plataformas grandes: quien viene de una de
            ellas espera un formulario de alta antes de poder mirar nada. */}
        <p className="mt-4 text-sm text-gris-medio">
          Sin registrarte y sin crear ninguna cuenta.
        </p>

        {/*
          La bifurcación, arriba y sin scroll.
          Media portada está escrita para familias, y un profesor que llegue
          aquí —casi siempre porque alguien le pasó el enlace— no va a leerla
          entera para averiguar si esto va con él. Esta línea le saca del
          recorrido equivocado en el primer vistazo.
        */}
        <p className="mt-6 border-t border-gris-borde pt-6 text-sm text-gris-medio">
          ¿Eres profesor?{' '}
          <a
            href="/registro"
            className="font-semibold text-verde-avanza-oscuro underline underline-offset-4"
          >
            Publica tu ficha gratis
          </a>
          {/* Antes decía «y a ti no te cobramos nada nunca», y eso invitaba a
              la familia a preguntarse por qué a ella sí. Dice lo mismo sin
              señalar a nadie. */}
          . Cinco minutos, sin registro y sin coste, y{' '}
          <a
            href="/guia/profesor"
            className="underline underline-offset-4"
          >
            aquí está explicado paso a paso
          </a>
          .
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*
        Qué es esto, antes de las cifras.

        Va aquí arriba porque es lo único que contesta a «¿y por qué tú y no
        cualquier tablón de anuncios?», y esa pregunta se la hace una familia en
        los primeros diez segundos, no en el minuto tres.

        Son dos ideas y ninguna es un adorno. La primera es de dónde salen los
        profesores: no de una bolsa de gente suelta, sino de un colegio por el
        que ellos ya pasaron. La segunda es lo que se hace después de
        presentarlos, que es lo que de verdad distingue esto de un tablón.

        **Cuidado con cómo se dice la segunda.** Lo que se promete es lo que
        hacemos nosotros —escribir las guías y mandárselas a todos—, no lo que
        hace el profesor en su clase. AcademiAvanza no le emplea, no le
        supervisa y no puede responder de cómo da la clase; el aviso legal lo
        dice con todas las letras y ya hubo que quitar una cita de esta misma
        portada por prometer justo eso.

        Y no se menciona aquí ninguna dificultad concreta del alumno, aunque una
        de las guías vaya de eso. El formulario de las familias rechaza a
        propósito los mensajes que mencionan un diagnóstico, así que anunciarlo
        en portada sería invitar a escribir exactamente lo que luego se bloquea.
        Es el mismo motivo por el que se quitaron de aquí las «necesidades
        especiales del alumno».
      */}
      <section className="mt-16 border-t border-gris-borde pt-10">
        <h2 className="text-xl font-bold text-azul-confianza">
          Qué es AcademiAvanza
        </h2>

        <p className="mt-4 leading-relaxed text-carbon">
          Una red que conecta a antiguos alumnos de un colegio con los que
          todavía están en él. Los profesores que ves aquí se sentaron en las
          mismas aulas, con los mismos profesores y los mismos exámenes, hace
          tres o cuatro años. Saben lo que se le pide a tu hijo porque se lo
          pidieron a ellos.
        </p>

        <p className="mt-3 leading-relaxed text-carbon">
          Nació de una idea sencilla: en los colegios ya se recomiendan
          exalumnos brillantes para dar clases, pero se hace de boca en boca, y
          eso significa que sólo funciona si conoces a la persona adecuada.
          Aquí están todos a la vista, con su colegio y sus estudios, y eliges
          tú.
        </p>

        <div className="mt-6 rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-6">
          <h3 className="font-bold text-verde-avanza-oscuro">
            No nos quedamos en presentaros
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-carbon">
            Dar bien una clase particular no es lo mismo que saberse la
            asignatura, y casi nadie lo aprende solo.{' '}
            <strong>
              A todos los profesores que publican ficha les damos nuestras guías
            </strong>
            , sacadas de más de {miles(HISTORICO.clases)} clases. Son éstas, y
            son públicas: puedes leer exactamente lo mismo que lee él.
          </p>

          {/* Las cuatro con nombre y apellidos, no resumidas en una frase.
              Una madre no elige entre plataformas por un «formamos a nuestros
              profesores»: elige cuando lee un título y reconoce a su hijo en
              él. El texto que sale aquí es el de `paraLaFamilia`, escrito para
              eso; el profesor ve otro más operativo en la misma lista. */}
          <ul className="mt-4 space-y-3">
            {GUIAS_DE_CLASE.map((g) => (
              <li key={g.href} className="border-l-2 border-verde-avanza pl-3">
                <a
                  href={g.href}
                  className="text-sm font-semibold text-verde-avanza-oscuro underline underline-offset-4"
                >
                  {g.titulo}
                </a>
                <p className="mt-0.5 text-sm leading-relaxed text-carbon">
                  {g.paraLaFamilia}
                </p>
              </li>
            ))}
          </ul>

          <a
            href="/como-dar-clase"
            className="mt-5 inline-block rounded-lg border border-verde-avanza bg-white px-5 py-2.5 text-sm font-semibold text-verde-avanza-oscuro transition hover:bg-verde-avanza-claro"
          >
            Leerlas enteras
          </a>
          {/* La frase que impide que esto se lea como una garantía. Sin ella,
              «les damos guías» se convierte en la cabeza de quien lee en
              «responden de cómo dan la clase», y eso no es verdad ni podría
              serlo: no los empleamos. */}
          <p className="mt-4 text-xs leading-relaxed text-gris-medio">
            Cada profesor da su clase como considera: no trabajan para nosotros
            y no intervenimos en cómo enseñan. Lo que sí hacemos es que ninguno
            empiece de cero.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Las cifras del curso anterior.
          Es lo único que una plataforma recién abierta no puede fabricar, y por
          eso mismo hay que enseñarlas con su procedencia al lado. La nota de
          abajo no es letra pequeña opcional: sin ella parecería que estas mil
          novecientas clases se han dado aquí. */}
      <section className="mt-16 border-t border-gris-borde pt-10">
        {/* «Nuestra experiencia» y no «Esto no empieza de cero»: el original
            negaba algo malo, y para entenderlo había que pensar primero que
            esto podía estar empezando de cero. Afirmar sale más barato. */}
        <h2 className="text-xl font-bold text-azul-confianza">
          Nuestra experiencia
        </h2>
        <p className="mt-2 text-sm text-gris-medio">
          AcademiAvanza lleva funcionando desde hace dos años. Sólo en el curso{' '}
          {HISTORICO.curso}:
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-4 text-center">
          {/* 1.904 contadas, publicadas como «más de 1.900». No se redondea a
              dos mil: es el único número de toda la web que alguien de la etapa
              anterior podría sentarse a comprobar. */}
          <Cifra
            numero={`+${miles(HISTORICO.clases)}`}
            texto="clases dadas"
          />
          {/* Las horas suben aquí y las 60 familias salen de la fila.
              No es maquillaje: 60 era la cifra más baja y, puesta en medio,
              empequeñecía a las otras dos. Las horas son el segundo número más
              alto y dicen lo mismo por otra vía. */}
          <Cifra
            numero={`+${miles(HISTORICO.horas)}`}
            texto="horas de clase"
          />
          {/* «Que funcionaron» no es un adjetivo puesto por quedar bien: lo
              sostienen las dos cifras de la línea de abajo, y por eso van
              juntas. Sin ellas sería una opinión; con ellas es un dato que
              alguien podría comprobar.

              Y se habla de emparejamientos y no de personas a propósito: son
              104 parejas, y una misma familia aparece en varias —dos hermanos,
              dos asignaturas, un relevo a mitad de curso—. */}
          <Cifra
            numero={`+${HISTORICO.emparejamientos}`}
            texto="emparejamientos que funcionaron"
          />
        </dl>

        <p className="mt-6 text-sm leading-relaxed text-carbon">
          <strong>
            {HISTORICO.siguieronTrasLaPrimera} de cada 10 siguieron más allá de
            la primera clase.
          </strong>
        </p>

        <p className="mt-3 text-xs leading-relaxed text-gris-medio">
          De septiembre a julio, en un curso completo. {NOTA_HISTORICO}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section className="mt-16 border-t border-gris-borde pt-10">
        <h2 className="text-xl font-bold text-azul-confianza">Cómo funciona</h2>

        <ol className="mt-6 space-y-6">
          <Paso
            numero={1}
            titulo="Escribes al profesor que te encaje"
            texto="Le contamos el curso, lo que necesitas y para cuándo lo necesitas, sin darle todavía ningún dato tuyo. Si corre prisa, le damos cinco días para contestar."
          />
          <Paso
            numero={2}
            titulo="Él dice si puede cogerte"
            texto="Si no puede, ahí acaba y no has pagado nada. Nunca pagas por un contacto que no existe."
          />
          <Paso
            numero={3}
            titulo={`Si acepta, pagas ${euros(precio)} por el contacto`}
            texto="Una sola vez, por Bizum. Y si en las dos primeras clases no funciona, te damos otro contacto sin pagar de nuevo."
          />
          <Paso
            numero={4}
            titulo="Él te escribe"
            texto={`Le damos tu teléfono y te escribe o te llama él: por protección de datos no facilitamos el teléfono de nuestros profesores. Si en ${DIAS_PARA_RECLAMAR} días no te ha escrito, te damos otro contacto sin volver a pagar.`}
          />
        </ol>

        <p className="mt-6 rounded-lg bg-gris-claro px-4 py-3 text-sm text-carbon">
          {/* Se dice aquí, en la portada, y no sólo en la ficha: es una de esas
              cosas que la gente da por supuesta al revés y descubre tarde. */}
          <span className="font-medium">Las clases son online o a domicilio.</span>{' '}
          Cuando son presenciales, es el profesor quien se desplaza a casa del
          alumno, no al revés.
        </p>
        <p className="mt-3 text-sm text-gris-medio">
          <a
            href="/guia/familia"
            className="underline underline-offset-4"
          >
            Verlo explicado paso a paso, con las pantallas
          </a>
          .
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* El colegio de casi la mitad del directorio.
          El apartado existe porque esas familias ya conocen a Lucía y son las
          que más fácil vuelven, así que merecen que la web les hable a ellas.
          Y termina abriendo la puerta al resto en la misma frase: un apartado
          que hiciera sentir a los demás que se han equivocado de sitio costaría
          más de lo que gana. */}
      {destacado && (
        <section className="mt-16 rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-6">
          <h2 className="text-xl font-bold text-verde-avanza-oscuro">
            ¿Sois del {destacado.nombre}?
          </h2>
          <p className="mt-3 text-carbon">
            Entonces esto empezó por vosotros. AcademiAvanza nació dando clases
            a familias del {destacado.nombre}, con antiguos alumnos del propio
            colegio: gente que se sentó en las mismas aulas, con los mismos
            profesores y los mismos exámenes.
          </p>
          <p className="mt-3 text-carbon">
            Ahora mismo hay{' '}
            <strong>
              {destacado.profesores}{' '}
              {destacado.profesores === 1 ? 'profesor' : 'profesores'} del{' '}
              {destacado.nombre}
            </strong>{' '}
            en el directorio.
          </p>

          <a
            href={`/profesores?colegio=${destacado.id}`}
            className="mt-5 inline-block rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
          >
            Ver los del {destacado.nombre}
          </a>

          {/*
            Sólo si hay más de un colegio, y no es una cuestión de plurales.

            Con uno solo, la frase se contradice a sí misma: dice «¿de otro
            colegio? también» y a continuación reconoce que todos los profesores
            vienen del mismo. A una familia de otro colegio le está diciendo,
            sin querer, que ahí no hay nadie para ella.

            El caso se dio de verdad el día del lanzamiento, con el directorio
            recién vaciado de fichas de prueba, y salió publicado como «hay
            profesores de 1 colegios de Madrid».
          */}
          {colegios > 1 && (
            <p className="mt-5 border-t border-verde-avanza pt-4 text-sm text-carbon">
              <span className="font-medium">¿De otro colegio? También.</span> En
              el directorio hay profesores de {colegios} colegios de Madrid, y
              el buscador te deja filtrar por el tuyo o dejarlo en «me es
              indiferente».
            </p>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Lo que AcademiAvanza dice de sí misma.
          Viene de la web anterior, pero no copiado tal cual: aquel texto
          prometía «asignación personalizada», y eso era Lucía emparejando a
          mano. La plataforma no asigna a nadie, así que prometerlo dejaría a las
          familias esperando a que alguien les asignara algo que no va a llegar.
          Aquí dice lo que sí hace: enseñar quién es cada uno y dejar elegir.

          Se quedaron fuera dos cosas del original, y por motivos distintos. La
          comunidad de alumnos y exalumnos, porque no existe. Y las «necesidades
          especiales del alumno», porque el formulario rechaza a propósito
          cualquier mensaje que mencione un diagnóstico: anunciarlas sería
          invitar a escribir justo lo que luego se bloquea. */}
      <section className="mt-16 border-t border-gris-borde pt-10">
        <h2 className="text-xl font-bold text-azul-confianza">
          Cómo entendemos las clases particulares
        </h2>

        <div className="mt-6 space-y-6">
          {/* La urgencia va la primera de las cuatro, y con el número dentro.
              «Nos adaptamos a tus tiempos» no significa nada; «cinco días» sí,
              y es además un compromiso que la plataforma cumple sola: pasado el
              plazo se cierra la solicitud y se le escribe a la familia. */}
          <div>
            <h3 className="font-semibold text-carbon">
              Nos adaptamos a tu urgencia
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gris-medio">
              Tú dices para cuándo lo necesitas, y ese plazo manda. Si es para
              ya, el profesor tiene cinco días para contestar; si buscas para el
              mes que viene, treinta. Pasado el plazo cerramos la solicitud y te
              avisamos, para que no te quedes esperando sin saber nada.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-carbon">Eliges tú, y rápido</h3>
            <p className="mt-1 text-sm leading-relaxed text-gris-medio">
              Filtras por asignatura, curso, modalidad, colegio e idioma, y
              escribes directamente a quien te encaje. Sin formularios que se
              pierden y sin esperar a que nadie te asigne a nadie.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-carbon">
              Tus preferencias mandan
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gris-medio">
              Cada alumno necesita una cosa. Puedes buscar por horario, por si
              prefieres las clases online o en casa, y por el colegio del que
              viene el profesor. Y si lo que buscas es preparar un examen
              concreto, se lo cuentas a él en la primera llamada.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-carbon">
              Clases adaptadas al ritmo de cada alumno
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gris-medio">
              Las dan profesores particulares que han pasado por el mismo
              colegio y por los mismos exámenes. No es una academia con un
              temario cerrado: es alguien que se sienta con tu hijo donde él se
              haya quedado.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-carbon">
              Paciencia y comprensión
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gris-medio">
              Es nuestro pilar fundamental, y lo que de verdad distingue a un
              buen profesor particular. Si algo no va bien, escríbenos:
              contestamos siempre.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section className="mt-16 border-t border-gris-borde pt-10">
        <h2 className="text-lg font-bold text-carbon">
          ¿Eres profesor y quieres aparecer?
        </h2>
        {/* «Es gratuito» y no «a ti no te cobramos nada»: lo segundo obliga a
            la familia, que viene leyendo desde arriba, a preguntarse por qué a
            ella sí. Dice lo mismo sin abrir esa comparación. */}
        <p className="mt-2 text-sm text-gris-medio">
          Publicar tu ficha es gratuito. Rellenarla lleva cinco minutos.
        </p>
        <a
          href="/registro"
          className="mt-4 inline-block rounded-lg border border-verde-avanza px-6 py-3 font-semibold text-verde-avanza-oscuro transition hover:bg-verde-avanza-claro"
        >
          Publicar mi ficha
        </a>
      </section>
    </main>
  );
}
