import { ultimoMantenimiento } from '@/backend/repositories/solicitudes';

/**
 * ¿Sigue vivo el proceso que corre solo?
 *
 * Todos los días, una tarea automática caduca solicitudes muertas, manda
 * recordatorios, pausa fichas sin confirmar y —lo importante— borra los datos de
 * las familias pasados noventa días, que es una promesa escrita en la política
 * de privacidad.
 *
 * El problema de que eso se rompa es que no se nota. La web sigue cargando, las
 * páginas funcionan, nadie escribe para quejarse. Simplemente deja de pasar todo
 * lo que tenía que pasar solo, y puede estar meses así.
 *
 * Por eso este aviso está arriba del todo y en rojo: no se busca, se encuentra.
 * Y por eso cuenta el tiempo en horas y no dice «hace poco»: la pregunta que hay
 * que poder contestar de un vistazo es cuántos días lleva la cosa parada.
 */

/** Horas sin ejecutarse antes de dar la voz de alarma. */
const HORAS_PARA_ALARMA = 36;

export async function SaludDelProceso() {
  const ultima = await ultimoMantenimiento();

  /*
   * Sin ninguna ejecución apuntada no se dice nada.
   *
   * Es lo que pasa el primer día y también justo después de poner esto en
   * marcha. Enseñar una alarma roja a alguien que acaba de desplegar sería
   * enseñarle un fallo que no existe, y las alarmas que mienten una vez ya no se
   * miran nunca más.
   */
  if (!ultima) return null;

  const parado = ultima.horasDesde >= HORAS_PARA_ALARMA;
  const fallos = ultima.errores.length > 0;

  if (!parado && !fallos) return null;

  const dias = Math.floor(ultima.horasDesde / 24);

  return (
    <div className="mt-6 rounded-xl border-2 border-error bg-red-50 p-4">
      <h2 className="font-bold text-error">
        {parado
          ? 'El proceso automático no se está ejecutando'
          : 'La última ejecución automática falló'}
      </h2>

      {parado && (
        <p className="mt-1 text-sm text-carbon">
          La última vez que corrió fue hace{' '}
          <strong>
            {dias >= 1
              ? `${dias} día${dias === 1 ? '' : 's'}`
              : `${ultima.horasDesde} horas`}
          </strong>
          . Mientras siga así no se borran los datos de las familias pasados los
          noventa días, no salen los recordatorios de pago y no se cierra ninguna
          solicitud vieja.
        </p>
      )}

      {fallos && (
        <p className="mt-1 text-sm text-carbon">
          Fallaron estas tareas: <strong>{ultima.errores.join(', ')}</strong>. El
          resto sí se ejecutó.
        </p>
      )}

      <p className="mt-3 text-xs text-gris-medio">
        Se comprueba en Render, en el cron{' '}
        <strong>mantenimiento-diario</strong>. Lo más habitual es que la variable{' '}
        <code>CRON_SECRET</code> de la tarea no coincida con la del servicio web:
        entonces la llamada devuelve un 401 y no se ejecuta nada.
      </p>
    </div>
  );
}
