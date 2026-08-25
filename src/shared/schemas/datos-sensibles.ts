/**
 * Detección de datos de categoría especial en texto libre.
 *
 * POR QUÉ EXISTE ESTO
 *
 * El artículo 9 del RGPD prohíbe, como regla general, tratar datos de salud,
 * origen étnico, religión, opiniones políticas, afiliación sindical, vida
 * sexual y datos genéticos o biométricos. Las excepciones son estrechas y
 * ninguna nos ampara: no somos un centro sanitario ni educativo reglado, y no
 * tenemos ni las medidas ni la base jurídica que exigiría tratarlos.
 *
 * Y aquí se juntan tres agravantes. El dato sería de un menor. Lo aportaría un
 * tercero, no el interesado. Y se lo reenviaríamos por correo a otra persona,
 * un particular sin ninguna obligación de custodiarlo.
 *
 * Una madre que escribe «mi hijo tiene TDAH y le cuesta concentrarse» lo hace
 * de buena fe: cree que ayuda al profesor. La solución no es reñirle, sino
 * avisarle antes y, si aun así lo escribe, no dejar que salga de su navegador.
 *
 * QUÉ ES ESTO Y QUÉ NO ES
 *
 * Es una lista de palabras. Detecta lo evidente —un diagnóstico escrito con su
 * nombre— y no detecta lo que se cuenta con rodeos. No convierte el formulario
 * en algo legalmente impecable: reduce mucho la probabilidad de acabar
 * guardando algo que no debemos, que es distinto y es lo máximo que puede
 * hacer un filtro de texto.
 *
 * La protección de verdad son las otras dos decisiones ya tomadas: no pedir
 * ningún dato del alumno, y borrar los mensajes a los noventa días.
 */

/**
 * Quita tildes y pasa a minúsculas, para que «dislexía» y «DISLEXIA» valgan
 * igual. El rango ̀-ͯ son los signos diacríticos que `normalize`
 * separa de su letra; se escribe con el código y no con el carácter para que
 * no dependa de cómo guarde este fichero cada editor.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

type Categoria = 'salud' | 'creencias' | 'origen';

/**
 * Términos que bloquean el envío.
 *
 * Están sin tildes a propósito: se comparan contra el texto ya normalizado.
 * Se buscan como palabra entera, así que «tea» no salta con «teatro» ni «tda»
 * con «tdah» duplicado.
 */
const TERMINOS: { categoria: Categoria; palabras: string[] }[] = [
  {
    categoria: 'salud',
    palabras: [
      // Diagnósticos y siglas de uso corriente
      'tdah', 'tda', 'tea', 'tel', 'dea',
      'dislexia', 'dislexico', 'dislexica',
      'discalculia', 'disgrafia', 'disortografia', 'dislalia',
      'autismo', 'autista', 'asperger',
      'sindrome', 'trastorno', 'diagnostico', 'diagnosticado', 'diagnosticada',
      'discapacidad', 'minusvalia', 'necesidades especiales',
      'hiperactivo', 'hiperactiva', 'hiperactividad',
      'deficit de atencion',
      'altas capacidades', 'superdotado', 'superdotada',
      // Salud mental
      'ansiedad', 'depresion', 'depresivo', 'depresiva',
      'psicologo', 'psicologa', 'psiquiatra', 'psicopedagogo', 'psicopedagoga',
      'terapia', 'terapeuta', 'logopeda', 'logopedia',
      // Salud física y tratamientos
      'medicacion', 'medicamento', 'medicado', 'medicada',
      'tratamiento medico', 'pastillas',
      'concerta', 'rubifen', 'medikinet', 'strattera', 'elvanse',
      'epilepsia', 'diabetes', 'asma', 'alergia', 'alergico', 'alergica',
      'celiaco', 'celiaca', 'intolerancia',
      'operacion', 'hospital', 'enfermedad', 'enfermo', 'enferma',
      'informe medico', 'informe psicopedagogico',
    ],
  },
  {
    categoria: 'creencias',
    palabras: [
      'musulman', 'musulmana', 'catolico', 'catolica', 'judio', 'judia',
      'evangelico', 'evangelica', 'testigo de jehova', 'ateo', 'atea',
    ],
  },
  {
    categoria: 'origen',
    palabras: ['gitano', 'gitana', 'inmigrante', 'sin papeles', 'racializado'],
  },
];

/**
 * Convierte un término de la lista en el trozo de expresión que lo reconoce.
 *
 * Cada palabra admite plural, y los términos de varias palabras lo admiten en
 * todas: «informe medico» tiene que reconocer también «informes médicos», que
 * es como lo escribe cualquiera. Sin esto el filtro dependía de que la gente
 * escribiera en singular, que es una suposición sin ningún fundamento.
 *
 * No se usa \b como límite de palabra porque se lleva mal con los acentos,
 * aunque aquí el texto llegue ya normalizado.
 */
function expresion(termino: string): string {
  return termino
    .split(' ')
    .map((palabra) => `${palabra}(es|s)?`)
    .join('\\s+');
}

export type Deteccion = {
  categoria: Categoria;
  /** El término encontrado, para poder decir cuál es sin adivinanzas. */
  termino: string;
};

/**
 * Devuelve la primera coincidencia, o null si el texto está limpio.
 *
 * Se devuelve solo la primera y no todas: enumerarle a alguien las seis cosas
 * que ha escrito mal es una regañina. Con una basta para que entienda y
 * reescriba.
 */
export function detectarDatosSensibles(texto: string): Deteccion | null {
  if (!texto.trim()) return null;

  const limpio = normalizar(texto);

  for (const grupo of TERMINOS) {
    for (const palabra of grupo.palabras) {
      const patron = new RegExp(
        `(^|[^a-z0-9])${expresion(palabra)}([^a-z0-9]|$)`,
      );
      if (patron.test(limpio)) {
        return { categoria: grupo.categoria, termino: palabra };
      }
    }
  }

  return null;
}

/** El aviso que se le enseña a quien escribe. En segunda persona y sin regañar. */
export function mensajeDeAviso(deteccion: Deteccion): string {
  const porQue: Record<Categoria, string> = {
    salud:
      'Parece que estás contando algo sobre la salud de tu hijo. No podemos guardar ese tipo de información ni pasársela a nadie.',
    creencias:
      'Parece que estás mencionando creencias religiosas. No podemos guardar ese tipo de información.',
    origen:
      'Parece que estás mencionando el origen de tu familia. No podemos guardar ese tipo de información.',
  };

  return `${porQue[deteccion.categoria]} Cuéntaselo al profesor por teléfono si crees que le ayuda: eso es una conversación entre vosotros y nosotros no pintamos nada.`;
}
