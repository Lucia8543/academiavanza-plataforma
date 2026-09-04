/**
 * Teléfonos, correos y usuarios escritos dentro de un texto libre.
 *
 * POR QUÉ EXISTE ESTO
 *
 * La plataforma cobra una sola cosa: enseñarle al profesor el teléfono de la
 * familia cuando él ha aceptado y ella ha pagado. Todo lo demás es gratis.
 *
 * Y hasta ahora había una puerta abierta al lado de la de pago. El mensaje que
 * escribe la familia **viaja al profesor dentro del correo de la propuesta**,
 * es decir, antes de que nadie pague nada. Quien escribiera ahí su número
 * conseguía exactamente lo que cuesta diez euros, sin pagarlos y sin saltarse
 * ninguna comprobación, porque no había ninguna.
 *
 * El filtro que ya existía, el de `datos-sensibles`, no sirve para esto y no
 * debe intentarlo. Aquél protege a un menor de que su diagnóstico acabe en un
 * correo, y de hecho está **relajado a propósito** para que «mi tel es 600 111
 * 222» se pueda enviar: hay un comentario suyo explicándolo. Son dos problemas
 * distintos con dos respuestas distintas, y mezclarlos habría terminado en un
 * filtro que hace mal las dos cosas.
 *
 * QUÉ SE MIRA Y QUÉ NO
 *
 * Números de teléfono españoles, direcciones de correo y usuarios con arroba.
 * Nada más. No se intenta reconocer «seis cero cero uno...» escrito en letra ni
 * un número partido en dos frases, porque quien llega a ese punto ya está
 * esquivando el filtro a conciencia y una lista de palabras no le va a parar.
 *
 * LO QUE DE VERDAD IMPORTA AQUÍ
 *
 * **Un falso positivo cuesta más que un falso negativo.** Quien se salta el
 * pago es uno de cada muchos; una madre a la que el formulario le dice que no
 * puede enviar su mensaje, sin que ella entienda por qué, cierra la pestaña y
 * no vuelve. Por eso todo lo que sigue está calibrado hacia dejar pasar antes
 * que hacia bloquear, y por eso las pruebas de este módulo son sobre todo de lo
 * que **no** debe saltar: cursos, horas, precios, fechas y notas.
 */

export type TipoDeContacto = 'telefono' | 'correo' | 'usuario';

export type ContactoEnTexto = {
  tipo: TipoDeContacto;
  /** Lo encontrado, para poder decir qué es sin que nadie adivine. */
  fragmento: string;
};

/**
 * Trozos del texto que podrían ser un número de teléfono.
 *
 * Se buscan cifras junto a los tres separadores con los que la gente escribe un
 * teléfono de verdad —espacio, punto y guión—, y **no con `\s`**, que incluiría
 * el salto de línea y pegaría el final de una frase con el principio de la
 * siguiente. Dos números de cuatro cifras en renglones seguidos no son un móvil.
 *
 * Las letras cortan el trozo, y eso es la mitad del trabajo: «de 5 a 7 y de 8 a
 * 9» son cuatro trozos de una cifra, no uno de cuatro.
 *
 * Los paréntesis y la barra **se dejaron fuera a propósito**, y no por
 * despiste. Metiéndolos, «llámame al 600 123 456 (2 timbres)» se leía como un
 * solo amasijo de diez cifras, que no son nueve, y el teléfono se colaba entero.
 * Un separador de más no hace el filtro más listo: hace que un número de verdad
 * deje de parecerlo en cuanto lleve algo pegado detrás.
 */
const POSIBLE_NUMERO = /[\d][\d .-]*[\d]/g;

/**
 * ¿Ese amasijo de cifras es un teléfono español?
 *
 * Se exige **exactamente nueve** cifras una vez quitado el prefijo, y que la
 * primera sea de 6 a 9, que es como son todos los números de España. Podría
 * haberse aceptado «nueve o más» para curarse en salud, y sería un error: los
 * números largos que escribe la gente en un mensaje son referencias de
 * matrícula, cuentas y códigos, ninguno es un teléfono, y bloquearlos sería
 * cobrarle el filtro a quien no está haciendo nada.
 *
 * De ahí también salen las fechas y las horas sin necesidad de tratarlas
 * aparte. «12/09/2026» son ocho cifras y «17:30» son cuatro, porque los dos
 * puntos ni siquiera son separador aquí.
 */
function esTelefonoEspanol(trozo: string): boolean {
  let cifras = trozo.replace(/\D/g, '');

  // Los prefijos internacionales, en las tres formas en que se escriben.
  if (cifras.startsWith('0034')) cifras = cifras.slice(4);
  else if (cifras.startsWith('34') && cifras.length === 11) cifras = cifras.slice(2);
  else if (cifras.startsWith('0') && cifras.length === 10) cifras = cifras.slice(1);

  return cifras.length === 9 && /^[6-9]/.test(cifras);
}

/** Una dirección de correo cualquiera. */
const CORREO = /[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}/;

/**
 * Un usuario con arroba, del tipo `@nombre`.
 *
 * Pide un espacio o el principio del texto por delante para no chocar con la
 * arroba de un correo, que ya se reconoce arriba y merece otro aviso. Y pide
 * tres caracteres como mínimo, porque una arroba suelta o de dos letras suele
 * ser un adorno y no la cuenta de nadie.
 */
const USUARIO = /(?:^|\s)(@[a-zA-Z0-9._]{3,})/;

/**
 * Devuelve lo primero que se encuentre, o null si el texto está limpio.
 *
 * Sólo lo primero, por lo mismo que el otro filtro: enumerarle a alguien las
 * cuatro cosas que ha escrito mal es una regañina, y con una basta para que
 * entienda y reescriba.
 */
export function detectarDatosDeContacto(texto: string): ContactoEnTexto | null {
  if (!texto.trim()) return null;

  const correo = texto.match(CORREO);
  if (correo) return { tipo: 'correo', fragmento: correo[0] };

  for (const trozo of texto.match(POSIBLE_NUMERO) ?? []) {
    if (esTelefonoEspanol(trozo)) {
      return { tipo: 'telefono', fragmento: trozo.trim() };
    }
  }

  const usuario = texto.match(USUARIO);
  if (usuario) return { tipo: 'usuario', fragmento: usuario[1] };

  return null;
}

/**
 * El aviso para la familia.
 *
 * No acusa, y la decisión es deliberada aunque el filtro exista por el que hace
 * trampas. La mayoría de quien escribe aquí su número lo hace por ser útil: ha
 * entendido que el profesor tiene que poder localizarla y se lo pone fácil.
 * Tratar a esa madre de tramposa para atrapar al que sí lo es sale carísimo.
 *
 * Y por eso el argumento que se le da es el suyo, no el nuestro. No decimos que
 * así se salta el pago, decimos que su teléfono acaba en manos de alguien que a
 * lo mejor no va a darle clase. Las dos cosas son verdad y sólo una le importa.
 */
export function mensajeDeAvisoContacto(deteccion: ContactoEnTexto): string {
  const porQue: Record<TipoDeContacto, string> = {
    telefono:
      'Parece que has escrito un teléfono aquí. No hace falta, porque ya nos has dado el tuyo.',
    correo:
      'Parece que has escrito una dirección de correo aquí. No hace falta, porque ya nos has dado la tuya.',
    usuario: 'Parece que has escrito aquí un usuario de una red social.',
  };

  /*
   * Sin decir «el mensaje», porque este mismo aviso se usa también para el
   * nombre. Un texto que nombra el campo donde salta parece más cuidado y es
   * exactamente lo que se queda desfasado en cuanto el filtro cubre un campo
   * más, que es lo que acaba de pasar.
   */
  return (
    `${porQue[deteccion.tipo]} Se lo damos nosotros al profesor en cuanto ` +
    'acepte, y así te aseguras de que sólo lo tiene quien de verdad va a darte ' +
    'clase. Quítalo y ya puedes enviar.'
  );
}

/**
 * El mismo aviso para el profesor, que no es el mismo caso.
 *
 * Lo que él escribe no va en un correo a una persona: **se publica en una
 * página web**. Su número quedaría a la vista de cualquiera que pase por el
 * directorio, y de todos los robots que lo recorren, que es una molestia que va
 * a durarle años y que no se arregla borrándolo luego.
 *
 * Ese es el argumento que se le da, y otra vez es el suyo. Que además se
 * saltaría el modo en que la plataforma se paga es verdad y va después, porque
 * a él le pesa mucho menos.
 */
export function mensajeDeAvisoContactoProfesor(
  deteccion: ContactoEnTexto,
): string {
  const porQue: Record<TipoDeContacto, string> = {
    telefono: 'Has escrito un teléfono',
    correo: 'Has escrito una dirección de correo',
    usuario: 'Has escrito un usuario de una red social',
  };

  return (
    `${porQue[deteccion.tipo]} en un texto que se publica en tu ficha, a la ` +
    'vista de cualquiera y de los robots que rastrean la web. Quítalo. Las ' +
    'familias que te escriban llegan a ti por la plataforma, y a ellas les ' +
    'damos tus datos cuando aceptas.'
  );
}
