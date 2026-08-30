import {
  CabeceraGuia,
  Consejo,
  EnTreintaSegundos,
  Frases,
  Ojo,
  PieDeGuia,
} from '@/frontend/features/guia/piezas';

/**
 * La guía del alumno que se despista, para clases en su casa.
 *
 * Es distinta de la de atención de propósito. Aquí no se habla de nadie con
 * ninguna dificultad: se habla de un crío de doce años en su cuarto, con su
 * cama al lado, su móvil en la mesa y su hermano pasando por el pasillo. Casi
 * todo se arregla moviendo cosas de sitio, y eso lo puede hacer el profesor el
 * primer día sin que nadie le cuente nada de nadie.
 */

export const metadata = {
  title: 'Evitar distracciones en clases a domicilio · AcademiAvanza',
  description:
    'Cómo preparar el espacio de trabajo y organizar la sesión en bloques para sostener la atención durante toda la clase.',
};

export default function GuiaSeDespista() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <CabeceraGuia
        titulo="Evitar distracciones en clases a domicilio"
        entradilla="Das clase en su casa, en su cuarto, con la cama a un metro y el móvil sobre la mesa. Antes de concluir que no quiere trabajar, revisa dónde le has sentado, porque buena parte de las distracciones vienen del entorno y no del alumno."
        minutos={3}
      />

      <EnTreintaSegundos
        puntos={[
          'Mesa vacía: sólo lo del ejercicio que estáis haciendo ahora.',
          'El móvil, boca abajo y lejos. Pídelo tú el primer día y ya no hay discusión.',
          'Bloques de veinte minutos con un descanso corto en medio.',
          'Cronómetro: «¿lo sacas antes que yo?». Se convierte en juego y funciona.',
          'Cuando lo veas irse, cámbiale la tarea antes de llamarle la atención.',
        ]}
      />

      <Consejo titulo="1. Lo primero es la mesa">
        <p>
          Sobre la mesa, sólo lo que hace falta para el ejercicio de ahora. El
          cuaderno, el boli y poco más. El estuche entero, los otros libros y el
          cargador son tres cosas con las que jugar.
        </p>
        <p>
          <strong className="text-carbon">El móvil, boca abajo y fuera de la
          mesa.</strong>{' '}
          Pídelo el primer día como algo normal, no como un castigo. «Lo dejamos
          ahí y lo coges al acabar». Si lo pides el tercer día, después de una
          clase mala, parece una bronca.
        </p>
        <p>
          Y si podéis sentaros en el salón o la cocina en vez de en su cuarto,
          mejor. La cama a un metro pesa.
        </p>
      </Consejo>

      <Consejo titulo="2. Bloques cortos, con final a la vista">
        <p>
          Una hora seguida no la sostiene. Dos bloques de veinte minutos con
          tres o cuatro de descanso en medio rinden más que sesenta corridos, y
          además él sabe cuándo acaba cada trozo.
        </p>
        <p>
          Dilo en alto al empezar. «Ahora veinte minutos con esto, luego paramos
          un momento». Saber que hay un final cercano es lo que le permite
          aguantar hasta él.
        </p>
      </Consejo>

      <Consejo titulo="3. El cronómetro, de tu lado">
        <p>
          Convertir el ejercicio en carrera cambia la clase entera:{' '}
          <strong className="text-carbon">
            «¿lo sacas tú antes que yo?»
          </strong>
          . Lo haces tú también, en tu hoja, y comparáis.
        </p>
        <p>
          Déjale ganar de vez en cuando. No es engañarle, es que si pierde
          siempre, deja de jugar, y con el juego se va lo único que le tenía
          sentado.
        </p>
        <p>
          Y si acaba antes de tiempo, el tiempo que sobra es suyo. Treinta
          segundos para levantarse, saltar o contarte algo. Es poquísimo y tira
          muchísimo.
        </p>
      </Consejo>

      <Consejo titulo="4. Cámbiale la tarea antes de reñirle">
        <p>
          Cuando lo veas empezar a irse, lo que casi nunca funciona es decirle
          que se centre. Lo que sí funciona es cambiar lo que está haciendo:
        </p>
        <Frases
          frases={[
            'Este déjalo, hacemos el siguiente y luego volvemos.',
            'Explícamelo tú a mí, que a ver si me lío.',
            'Sal a la pizarra, o al papel, y lo escribes tú.',
          ]}
        />
        <p>
          Que cambie de postura, de tarea o de quién lleva el boli suele
          devolverle diez minutos.
        </p>
      </Consejo>

      <Consejo titulo="5. Señala lo que hace bien, en voz alta">
        <p>
          Quien se despista mucho está acostumbrado a que sólo le hablen cuando
          hace algo mal. Un «este paso lo has hecho perfecto» dicho en serio vale
          más que tres avisos.
        </p>
      </Consejo>

      <Ojo>
        Si esto se repite clase tras clase y nada de lo de arriba mueve la aguja,
        coméntaselo a la familia, que es información que les sirve. Pero{' '}
        <strong>no le pongas nombre a lo que le pasa</strong> ni sugieras ningún
        diagnóstico. Eso no te toca a ti y equivocarse ahí hace daño de verdad.
      </Ojo>

      <PieDeGuia />
    </main>
  );
}
