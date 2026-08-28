import {
  CabeceraGuia,
  Consejo,
  EnTreintaSegundos,
  Frases,
  Ojo,
  PieDeGuia,
} from '@/frontend/features/guia/piezas';

/**
 * La guía del alumno desmotivado.
 *
 * Es el perfil más frecuente y el que más se confunde con otra cosa. La familia
 * escribe «se ha vuelto vago» o «está en plena adolescencia», y lo que hay
 * debajo casi nunca es eso: es alguien que entiende cuando se lo explican y se
 * queda en blanco cuando está solo.
 *
 * Lo que sigue no intenta motivar a nadie, porque no se puede motivar a nadie
 * desde fuera. Intenta darle una rutina, que es lo único que sí se puede dar.
 */

export const metadata = {
  title: 'Autonomía y hábito de estudio · AcademiAvanza',
  description:
    'Cómo trabajar con un alumno que comprende los contenidos acompañado, pero no consigue ponerse a trabajar por su cuenta.',
};

export default function GuiaNoArranca() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <CabeceraGuia
        titulo="Autonomía y hábito de estudio"
        entradilla="Es el perfil más frecuente y el que peor se interpreta desde fuera. No es un problema de comprensión: cuando alguien se sienta con él, lo entiende todo. El problema es empezar solo."
        minutos={4}
      />

      <EnTreintaSegundos
        puntos={[
          'Empieza preguntando qué ha hecho esta semana, no explicando.',
          'No le des el paso siguiente: pregúntale cuál cree que es.',
          'Los deberes se dejan por escrito: qué ejercicios, cuánto tiempo y qué hacer si se atasca.',
          'Veinte minutos cuatro días valen más que dos horas un domingo.',
          'Si se bloquea, que lo apunte y pase al siguiente. No que lo deje todo.',
        ]}
      />

      <section className="mt-10">
        <p className="text-sm leading-relaxed text-gris-medio">
          Antes de nada, cómo se reconoce. Suele hacer todo esto:
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gris-medio">
          <li>· Se queda mirando el enunciado sin saber por dónde empezar.</li>
          <li>· Necesita a alguien al lado para dar el primer paso.</li>
          <li>
            · Se sabe la teoría, pero no sabe qué aplicar en cada problema.
          </li>
          <li>· Arrastra días sin practicar porque no le ve el sentido.</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-gris-medio">
          Muchos de éstos sacaban buenas notas hace un año. No se ha roto nada de
          repente: se ha ido cayendo la costumbre de ponerse.
        </p>
      </section>

      <Consejo titulo="1. Empieza preguntando, no explicando">
        <p>
          Los primeros cinco minutos deciden la clase. Si empiezas corrigiendo,
          él se sienta a recibir. Si empiezas preguntando, se sienta a
          participar.
        </p>
        <Frases
          frases={[
            '¿Qué has practicado esta semana?',
            '¿Qué ejercicio te ha costado más?',
            '¿Hubo algo de lo que te dejé que no entendieras?',
          ]}
        />
        <p>
          Aunque la respuesta sea «nada», te sirve: ya sabes que el problema no
          está en la asignatura, está en ponerse. Y te lo ha dicho él, que es
          distinto de decírselo tú.
        </p>
      </Consejo>

      <Consejo titulo="2. Guía, no resuelvas">
        <p>
          Cuando hagáis ejercicios juntos, no le digas lo que hay que hacer.
          Pregúntaselo.
        </p>
        <Frases
          frases={[
            '¿Qué te pide el problema?',
            '¿Por dónde crees que se empieza?',
            '¿Qué fórmula o qué idea puede servir aquí?',
          ]}
        />
        <p>
          Si se equivoca, mejor: ahí es donde se aprende. Lo corregís juntos, le
          dices qué parte sí estaba bien y qué cambiarías.{' '}
          <strong className="text-carbon">
            Celebra cada acierto, por pequeño que sea.
          </strong>{' '}
          A quien lleva meses fallando, que alguien le señale algo que ha hecho
          bien le cambia la sesión entera.
        </p>
      </Consejo>

      <Consejo titulo="3. Deja los deberes por escrito antes de despedirte">
        <p>
          La razón por la que no hace nada entre semana casi nunca es la pereza:
          es que no sabe exactamente qué tenía que hacer. Que no se acabe la
          clase sin esto apuntado:
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong className="text-carbon">Qué</strong> — página, número, tipo
            de ejercicio. Nada de «repasa el tema».
          </li>
          <li>
            <strong className="text-carbon">Cuánto</strong> — «esto son veinte
            minutos». No más. Una tarea con final a la vista se empieza; una
            abierta se aplaza.
          </li>
          <li>
            <strong className="text-carbon">Qué hacer si se atasca</strong> —
            intentarlo, apuntar la duda y seguir.
          </li>
        </ul>
      </Consejo>

      <Consejo titulo="4. El truco del semáforo">
        <p>
          Es lo que evita que un ejercicio atascado se lleve por delante la tarde
          entera. Se lo explicas una vez y lo usa solo:
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong className="text-carbon">Rojo</strong> — no sale. Paro.
          </li>
          <li>
            <strong className="text-carbon">Amarillo</strong> — lo pienso dos
            minutos y lo apunto en una hoja.
          </li>
          <li>
            <strong className="text-carbon">Verde</strong> — sigo con el
            siguiente.
          </li>
        </ul>
        <p>
          El objetivo no es que lo resuelva: es que llegue a la próxima clase con
          preguntas concretas en vez de con «no he hecho ninguno porque no
          entendía nada».
        </p>
      </Consejo>

      <Consejo titulo="5. Enséñale a preguntarse solo">
        <p>
          Lo que quieres es que sepa arrancar cuando tú no estás. Estas cinco
          preguntas, dichas en voz alta mientras trabaja, hacen ese trabajo:
        </p>
        <Frases
          frases={[
            '¿Qué me está pidiendo esto?',
            '¿Qué datos tengo?',
            '¿Qué fórmula o método puedo usar?',
            '¿He hecho algo parecido antes?',
            '¿Tiene sentido lo que me está saliendo?',
          ]}
        />
        <p>
          Suena raro y funciona. Le organiza el pensamiento y le quita la
          dependencia de que alguien le diga el paso siguiente.
        </p>
        <p>
          Y con la rutina, lo mismo:{' '}
          <strong className="text-carbon">
            sesiones de veinte o treinta minutos, tres o cuatro veces por semana
          </strong>
          . Pedirle dos horas seguidas es garantizar que no se ponga ningún día.
          Cuando el hábito esté cogido, ya se alarga.
        </p>
      </Consejo>

      <Consejo titulo="6. Y que sepa que no está solo">
        <p>
          Es lo más importante y lo que menos cuesta. El curso es duro y es
          normal sentirse así. Las ganas van y vienen; tú estás para acompañar
          mientras vuelven.
        </p>
        <p>
          <strong className="text-carbon">
            No le pidas que lo haga perfecto. Pídele que no lo deje.
          </strong>
        </p>
      </Consejo>

      <Ojo>
        Ojo con una cosa: esto no es terapia y tú no eres su psicólogo. Si lo que
        ves va más allá de la asignatura —angustia, algo que te preocupa de
        verdad— tu trabajo es decírselo a la familia, no gestionarlo tú.
      </Ojo>

      <PieDeGuia />
    </main>
  );
}
