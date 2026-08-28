import type { Metadata } from 'next';
import { GUIAS_DE_CLASE } from '@/shared/datos/guias-de-clase';

/**
 * Las guías de cómo dar clase.
 *
 * Es lo único que AcademiAvanza aporta y que no aporta un tablón de anuncios.
 * Conectar a una familia con un profesor lo hace cualquiera; lo que aquí se
 * añade es que ese profesor, que muchas veces tiene diecinueve años y da su
 * primera clase, no empiece de cero.
 *
 * **Cuidado con lo que se promete y a quién.** Estas guías son formación al
 * profesor, no un servicio a la familia. La plataforma no emplea a nadie, no
 * supervisa ninguna clase y no puede garantizar que un profesor concreto las
 * aplique. Lo que sí puede decir, y es verdad y es comprobable, es que todos
 * las reciben. Ésa es la promesa y no hay que estirarla ni una palabra más: el
 * aviso legal dice «no damos clases» y «no somos un centro educativo», y
 * prometer aquí lo que allí se niega ya pasó una vez con la cita de la portada.
 *
 * **Son públicas a propósito.** Podrían estar detrás del panel del profesor,
 * pero entonces una familia no podría comprobar que existen, y la mitad del
 * valor de esto es que se pueda comprobar. Además así se enlazan desde un
 * correo sin depender de ninguna llave.
 */

export const metadata: Metadata = {
  title: 'Guías para dar clase · AcademiAvanza',
  description:
    'Lo que recibe cada profesor al publicar su ficha: autonomía y hábito de estudio, metodología para clases online, distracciones en clases a domicilio y adaptaciones para dificultades de atención.',
};


export default function IndiceGuiasDeClase() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm font-semibold text-verde-avanza-oscuro">
        Para profesores
      </p>

      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-azul-confianza">
        Guías para dar clase
      </h1>

      <p className="mt-4 leading-relaxed text-carbon">
        Dar bien una clase particular no es lo mismo que dominar la asignatura.
        Casi toda la dificultad está fuera del temario: el alumno que se queda
        mirando el enunciado sin saber por dónde empezar, el que llega sin haber
        practicado nada, o el que pierde la atención a los diez minutos.
      </p>

      <p className="mt-3 leading-relaxed text-carbon">
        Esto es lo que hemos ido aprendiendo en más de mil novecientas clases.
        Está escrito breve y para poder aplicarlo el mismo día.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* La idea que sostiene las cuatro. Va aquí y no repetida en cada una:
          si estuviera en todas, no se leería en ninguna. */}
      <section className="mt-10 rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-6">
        <h2 className="text-lg font-bold text-verde-avanza-oscuro">
          Lo que hay detrás de las cuatro
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-carbon">
          <strong>Enseñar a pensar no es dar respuestas, es enseñar a hacerse
          preguntas.</strong>{' '}
          Cuando alguien falla, lo fácil es corregirle en el acto. Pero un
          alumno al que se le corrige rápido aprende a esperar la corrección, no
          a razonar.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-carbon">
          Nadie aprende a andar porque le expliquen cómo se anda. Se cae, se
          levanta y lo vuelve a intentar. Un ejercicio funciona igual: si le das
          el paso siguiente, le has resuelto el ejercicio; si le preguntas cuál
          cree que es, le has enseñado a buscarlo la próxima vez.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-carbon">
          Y cuando algo no entra en abstracto, se baja al suelo. Las fracciones
          se entienden con porciones de pizza o con piezas de Lego mucho antes
          que con un denominador común.
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      <div className="mt-10 space-y-4">
        {GUIAS_DE_CLASE.map((g) => (
          <a
            key={g.href}
            href={g.href}
            className="block rounded-xl border border-gris-borde p-5 transition hover:border-verde-avanza hover:bg-gris-claro"
          >
            <h2 className="font-bold text-azul-confianza">{g.titulo}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gris-medio">
              {g.paraElProfesor}
            </p>
            <p className="mt-2 text-xs text-gris-medio">{g.minutos} min</p>
          </a>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      <p className="mt-10 rounded-lg border-l-4 border-aviso bg-gris-claro px-4 py-3 text-sm leading-relaxed text-carbon">
        <strong>Nada de esto es obligatorio y nadie te lo va a revisar.</strong>{' '}
        No trabajas para AcademiAvanza: das clase por tu cuenta y acuerdas el
        precio y el horario con la familia. Esto son cosas que funcionan,
        escritas para que no tengas que descubrirlas tú a base de clases
        regulares.
      </p>

      <p className="mt-6 text-sm text-gris-medio">
        ¿Te falta una guía que te vendría bien?{' '}
        <a href="/buzon" className="underline underline-offset-4">
          Dinos cuál
        </a>{' '}
        y la escribimos. Y si lo que buscas es cómo funciona la plataforma,{' '}
        <a href="/guia/profesor" className="underline underline-offset-4">
          está explicado aquí
        </a>
        .
      </p>
    </main>
  );
}
