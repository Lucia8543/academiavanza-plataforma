'use client';

import { useState } from 'react';
import { CAMPO_INICIO, CAMPO_TRAMPA } from '@/shared/schemas/trampa-bots';

/**
 * Los dos campos que detectan guiones automáticos.
 *
 * El primero es un señuelo: invisible, fuera del recorrido del tabulador y
 * escondido de los lectores de pantalla. Una persona no lo ve ni lo alcanza; un
 * guion que rellena todos los campos que encuentra, sí.
 *
 * El segundo apunta cuándo se pintó el formulario. Si se envía en menos de tres
 * segundos, no lo ha rellenado una persona.
 *
 * Se esconde con posición absoluta y no con `display:none` ni `hidden`: algunos
 * guiones saltan explícitamente los campos ocultos de la forma evidente.
 *
 * **Y lleva `autoComplete="new-password"`, que no es un descuido.** El señuelo
 * se llamaba antes `apellido2`, y el autorrelleno del navegador lo reconocía
 * como «segundo apellido» y lo completaba solo. A esas personas se les
 * descartaba el alta enseñándoles «Ficha recibida», sin fila y sin correo.
 * `off` a secas lo ignoran casi todos los navegadores; `new-password` es el
 * único valor que respetan de verdad para no ofrecer nada guardado.
 */
export function CamposTrampa({ inicio: dado }: { inicio?: number } = {}) {
  /*
   * El momento en que se abrió el formulario.
   *
   * Se fija una sola vez: si se recalculara en cada pintado, el reloj se
   * reiniciaría al escribir y el formulario parecería siempre recién abierto.
   *
   * **Y por eso admite que se lo den desde fuera.** Los formularios largos se
   * vuelven a montar enteros tras cada respuesta del servidor —cambian su
   * `key` para no perder las casillas marcadas—, y al montarse otra vez este
   * componente volvía a poner el reloj a cero. El resultado era que quien
   * enviaba, recibía un aviso de que le faltaba un campo, lo corregía y volvía
   * a enviar en dos segundos, salía marcado como envío automático. Una persona
   * que llevaba diez minutos rellenando.
   *
   * Y durante un tiempo eso no era una etiqueta, era la papelera: al detector
   * le bastaba para descartar el alta enseñando «Ficha recibida». En los
   * registros del servidor hay once altas y tres solicitudes de familias que se
   * fueron así.
   *
   * Quien tenga ese remontaje pasa el instante desde fuera, donde vive lo que
   * no se desmonta. Quien no lo tenga, no pasa nada y funciona como siempre.
   */
  const [propio] = useState(() => Date.now());
  const inicio = dado ?? propio;

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden"
      >
        <label htmlFor={CAMPO_TRAMPA}>
          No rellenes esto
          <input
            id={CAMPO_TRAMPA}
            name={CAMPO_TRAMPA}
            type="text"
            tabIndex={-1}
            autoComplete="new-password"
            defaultValue=""
          />
        </label>
      </div>

      <input type="hidden" name={CAMPO_INICIO} defaultValue={inicio} />
    </>
  );
}
