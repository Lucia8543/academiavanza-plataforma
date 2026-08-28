import {
  colegioDestacado,
  contarPublicadas,
  cuantosColegios,
} from '@/backend/repositories/directorio';
import { precioVigente } from '@/backend/repositories/tarifas';
import { HISTORICO, NOTA_HISTORICO } from '@/shared/datos/historico';

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
          . Cinco minutos, sin registro y sin coste.
        </p>
      </div>

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
            titulo="Os pasamos el teléfono"
            texto="El precio de las clases y los horarios los acordáis vosotros. Ahí nosotros ya no pintamos nada."
          />
        </ol>

        <p className="mt-6 rounded-lg bg-gris-claro px-4 py-3 text-sm text-carbon">
          {/* Se dice aquí, en la portada, y no sólo en la ficha: es una de esas
              cosas que la gente da por supuesta al revés y descubre tarde. */}
          <span className="font-medium">Las clases son online o a domicilio.</span>{' '}
          Cuando son presenciales, es el profesor quien se desplaza a casa del
          alumno, no al revés.
        </p>
      </section>

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

        {/*
          Esta cita decía antes que AcademiAvanza ofrece «un servicio educativo
          de alta calidad» y que su fin es «formar mentes críticas». Venía de la
          web anterior y contradecía al aviso legal, que tres clics más allá
          dice lo contrario con todas las letras: «No damos clases» y «No somos
          un centro educativo ni una academia, y no estamos autorizados como
          tal».

          Las dos cosas no pueden ser verdad, y la que lee una familia antes de
          pagar es ésta. Es el mismo motivo por el que ya se quitaron de este
          bloque la «asignación personalizada» y las «necesidades especiales
          del alumno»: prometer lo que el aviso legal niega no es una cuestión
          de redacción.

          Y va firmada con un nombre, no con «el equipo». AcademiAvanza es una
          persona, su nombre ya consta en el aviso legal porque la ley lo exige,
          y en una web cuyo argumento es que sabes con quién estás hablando, un
          plural inventado desentona.
        */}
        <blockquote className="mt-8 border-l-4 border-verde-avanza bg-gris-claro px-5 py-4">
          <p className="leading-relaxed text-carbon">
            Esto empezó porque encontrar profesor para un hijo se hacía
            preguntando en la puerta del colegio, y no siempre había a quién
            preguntar. Nosotros no damos las clases: te enseñamos quién es cada
            profesor y de dónde viene, y eliges tú.
          </p>
          <footer className="mt-3 text-sm font-medium text-verde-avanza-oscuro">
            Lucía, AcademiAvanza
          </footer>
        </blockquote>
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

          <p className="mt-5 border-t border-verde-avanza pt-4 text-sm text-carbon">
            <span className="font-medium">¿De otro colegio? También.</span> En
            el directorio hay profesores de {colegios} colegios de Madrid, y el
            buscador te deja filtrar por el tuyo o dejarlo en «me es
            indiferente».
          </p>
        </section>
      )}

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
