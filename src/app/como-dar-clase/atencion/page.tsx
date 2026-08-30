import {
  CabeceraGuia,
  Consejo,
  EnTreintaSegundos,
  Ojo,
  PieDeGuia,
} from '@/frontend/features/guia/piezas';

/**
 * La guía para alumnos a los que les cuesta concentrarse.
 *
 * Ésta es la más delicada de las cuatro y se ha escrito con dos cuidados.
 *
 * **No dice «TDAH» en el título ni pide que nadie lo diga.** La plataforma
 * rechaza a propósito los mensajes de las familias que mencionan un
 * diagnóstico, porque es un dato de salud de un menor y no hace ninguna falta
 * para poner en contacto a dos personas. Una guía que empezara por «si el
 * alumno tiene TDAH» estaría empujando a que ese dato se escriba justo donde no
 * debe.
 *
 * **Y avisa de lo que no le toca al profesor.** Quien lee esto tiene veinte
 * años, no es clínico, y la tentación de ponerle nombre a lo que ve es enorme.
 * Un profesor particular sugiriendo un diagnóstico a una familia hace un daño
 * que no se arregla.
 *
 * Lo que queda en medio —refuerzo positivo, tareas cortas, flexibilidad— es
 * bueno para cualquier alumno, así que no hace falta saber nada de nadie para
 * aplicarlo.
 */

export const metadata = {
  title: 'Adaptaciones para dificultades de atención · AcademiAvanza',
  description:
    'Refuerzo positivo, objetivos a corto plazo y flexibilidad en el método. Y dónde termina el papel de un profesor particular.',
};

export default function GuiaAtencion() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <CabeceraGuia
        titulo="Adaptaciones para dificultades de atención"
        entradilla="Hay alumnos con capacidad de sobra para quienes sostener la atención supone un esfuerzo añadido. No necesitas saber a qué se debe, ni te corresponde averiguarlo, para preparar una clase que les funcione."
        minutos={4}
      />

      <EnTreintaSegundos
        puntos={[
          'Divide en trozos pequeños con un final visible en cada uno.',
          'Recompensa lo que consigue, y que la recompensa llegue pronto.',
          'Flexibiliza el tiempo antes que bajar la exigencia.',
          'Un ejercicio a la vista cada vez, no la hoja entera.',
          'Ni diagnostiques ni preguntes por informes. No es tu papel.',
        ]}
      />

      <Consejo titulo="1. Un sistema de puntos que se vea">
        <p>
          Funciona sorprendentemente bien, incluso con alumnos mayores de lo que
          uno esperaría. Cada ejercicio bien resuelto, una estrella en la
          esquina de la hoja. Al llegar a cinco, los últimos minutos de clase
          son suyos: para hablar de lo que quiera o para un juego.
        </p>
        <p>
          La clave no es el premio, es que{' '}
          <strong className="text-carbon">lo vea acumularse</strong>. Un objetivo
          a cinco ejercicios vista se persigue; «si trabajas bien este trimestre»
          no significa nada.
        </p>
      </Consejo>

      <Consejo titulo="2. El cronómetro como juego, no como presión">
        <p>
          «¿Lo sacas antes que yo?» convierte un ejercicio en una carrera y una
          carrera se aguanta mucho mejor que un ejercicio. Hazlo tú también y
          déjale ganar de vez en cuando, porque si pierde siempre deja de jugar.
        </p>
        <p>
          Y cuando lo notes especialmente inquieto, dale más tiempo del que
          necesita y dile que lo que sobre es suyo. Treinta segundos para
          levantarse o saltar. Parece nada y sostiene los diez minutos
          siguientes.
        </p>
      </Consejo>

      <Consejo titulo="3. Un ejercicio a la vista, no la hoja entera">
        <p>
          Una hoja con doce ejercicios es doce veces la sensación de que esto no
          se acaba nunca. Tapa el resto, o dáselos de uno en uno.
        </p>
        <p>
          Lo mismo con las instrucciones, una cosa cada vez. «Lee el enunciado y
          subraya los datos» y, cuando lo haya hecho, la siguiente.
        </p>
      </Consejo>

      <Consejo titulo="4. Flexibiliza el cómo, no el cuánto">
        <p>
          Se puede cambiar casi todo sin bajar el listón. El tiempo, el orden de
          los ejercicios, que responda hablando en vez de escribiendo, que se
          levante entre bloques.
        </p>
        <p>
          Lo que no hay que hacer es pedirle menos. Un alumno al que se le exige
          menos aprende que se espera menos de él, y eso pesa mucho más tiempo
          que un examen.
        </p>
      </Consejo>

      <Consejo titulo="5. Dile lo que hace bien, concreto y en el momento">
        <p>
          No «muy bien», que no dice nada. «Has visto tú solo que había que
          derivar dos veces, eso es lo difícil del ejercicio». Concreto y en
          caliente.
        </p>
        <p>
          Quien lleva años oyendo que se despista, que no se centra y que podría
          si quisiera, no está esperando un premio. Está esperando que alguien
          se dé cuenta de algo que ha hecho bien.
        </p>
      </Consejo>

      <Ojo>
        <strong>Dónde está tu límite.</strong> No preguntes si tiene un
        diagnóstico, no pidas informes y no sugieras ninguno. No eres clínico y
        equivocarte ahí hace daño de verdad. Si la familia decide contártelo, lo
        usas para dar mejor la clase y no lo escribes en ningún sitio, ni en tu
        ficha, ni en el formulario, ni se lo cuentas a nadie. AcademiAvanza no
        guarda datos de salud de ningún alumno, y por eso el formulario de las
        familias rechaza los mensajes que los mencionan.
      </Ojo>

      <p className="mt-6 text-sm leading-relaxed text-gris-medio">
        Y si lo que ves te preocupa más allá de la asignatura, díselo a la
        familia tal cual lo has visto, «le cuesta arrancar» o «se bloquea con los
        exámenes». Y que decidan ellos. Describir es tu trabajo; interpretar, no.
      </p>

      <PieDeGuia />
    </main>
  );
}
