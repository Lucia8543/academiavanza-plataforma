import { Apartado, PaginaLegal } from '@/frontend/components/shared/pagina-legal';

export const metadata = {
  title: 'Cookies · AcademiAvanza',
  description: 'Esta web usa una sola cookie, y es para el panel interno.',
};

/**
 * Política de cookies.
 *
 * Es corta porque la web es corta de cookies: sólo hay una, la de la sesión del
 * panel de administración, y es técnica.
 *
 * Por eso **no hay banner**. El banner es obligatorio cuando se instalan
 * cookies que no son estrictamente necesarias —analítica, publicidad,
 * seguimiento— y aquí no hay ninguna. Poner un banner sin necesidad sería
 * molestar a todo el mundo para aparentar cumplimiento.
 *
 * Si algún día se añade analítica, hay que volver aquí Y poner el banner. Las
 * dos cosas.
 */
export default function PaginaCookies() {
  return (
    <PaginaLegal titulo="Cookies" actualizado="agosto de 2026">
      <Apartado titulo="No verás ningún banner, y hay un motivo">
        <p>
          Esta web <strong>no usa analítica, ni publicidad, ni ningún sistema de
          seguimiento</strong>. No sabemos cuánta gente entra, ni de dónde viene,
          ni qué mira. No hay botones de redes sociales ni nada de terceros
          cargándose por detrás.
        </p>
        <p>
          El aviso de cookies es obligatorio cuando se instalan cookies que no
          son estrictamente necesarias. Como aquí no hay ninguna, no hay banner.
          Ponerlo por si acaso sería molestarte para aparentar que cumplimos algo
          que ya cumplimos.
        </p>
      </Apartado>

      <Apartado titulo="La única cookie que existe">
        <p>
          Se llama <code className="rounded bg-gris-claro px-1">sesion_admin</code>{' '}
          y sirve para mantener abierta la sesión de quien administra la web
          desde el panel interno. Dura treinta días y se borra al salir.
        </p>
        <p>
          <strong>Si eres profesor o familia, nunca la vas a tener.</strong> Solo
          se crea al entrar en el panel de administración, que no es público.
        </p>
        <p>
          Es una cookie técnica, y sin ella el panel no puede funcionar, así que por eso
          no requiere consentimiento.
        </p>
      </Apartado>

      <Apartado titulo="Qué guarda tu navegador por su cuenta">
        <p>
          Si eres profesor y aceptas recibir avisos en el móvil, tu navegador
          guarda por su cuenta el permiso que le has dado. Eso no es una cookie
          nuestra: es una función del propio navegador y la controlas desde sus
          ajustes, donde puedes retirarla cuando quieras.
        </p>
      </Apartado>

      <Apartado titulo="Cómo borrar las cookies">
        <p>
          Desde los ajustes de tu navegador, en el apartado de privacidad. Cada
          navegador lo llama de una forma, pero todos lo tienen.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
