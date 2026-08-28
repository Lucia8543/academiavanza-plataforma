import { CADUCADAS_PARA_PAUSAR } from '@/shared/reglas/cobro';

/**
 * El contador de solicitudes que se le han caducado sin contestar.
 *
 * Existe para que la regla se sepa antes y no después. A las cinco, la ficha
 * sale del directorio automáticamente; enterarse de eso el día que pasa, por un
 * correo, es sentirse castigado por algo que nadie te dijo.
 *
 * Con cero no se enseña nada. Un contador a cero es una advertencia gratuita a
 * quien no ha hecho nada, y la mayoría de los profesores están ahí. Es la misma
 * razón por la que el número de clases dadas no se muestra por debajo de veinte.
 */
export function SinContestar({ caducadas }: { caducadas: number }) {
  if (caducadas === 0) return null;

  const quedan = CADUCADAS_PARA_PAUSAR - caducadas;
  const alBorde = quedan <= 1;

  return (
    <div
      className={`mt-6 rounded-xl border p-4 text-sm ${
        alBorde
          ? 'border-error bg-red-50 text-error'
          : 'border-amber-300 bg-amber-50 text-amber-900'
      }`}
    >
      <p className="font-medium">
        {caducadas === 1
          ? 'Se te ha pasado una solicitud sin contestar'
          : `Se te han pasado ${caducadas} solicitudes sin contestar`}
        {' · '}
        {caducadas} de {CADUCADAS_PARA_PAUSAR}
      </p>

      <p className="mt-1">
        {quedan <= 0
          ? 'Con estas, tu ficha sale del directorio hasta que vuelvas a activarla.'
          : quedan === 1
            ? `Si se te pasa una más, tu ficha sale del directorio. Volver es un clic, pero mientras tanto no te llega nadie.`
            : `Si llegas a ${CADUCADAS_PARA_PAUSAR}, tu ficha sale del directorio. Volver es un clic, pero mientras tanto no te llega nadie.`}
      </p>

      <p className="mt-1">
        Contestar que no también cuenta como contestar, y no pasa nada por
        hacerlo: la familia prefiere saberlo el primer día.
      </p>

      <p className="mt-2 text-xs">
        Sólo cuentan las de los últimos tres meses. Si activas los avisos al
        móvil te enteras al momento, sin depender del correo.
      </p>
    </div>
  );
}
