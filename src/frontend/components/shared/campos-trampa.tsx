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
export function CamposTrampa() {
  // El momento en que se montó el formulario. Se fija una sola vez: si se
  // recalculara en cada pintado, el reloj se reiniciaría al escribir y el
  // formulario parecería siempre recién abierto.
  const [inicio] = useState(() => Date.now());

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
