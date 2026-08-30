import { FormularioBuzon } from '@/frontend/features/buzon/formulario-buzon';

/**
 * «Algo no funciona.»
 *
 * Abierto a cualquiera, incluido quien todavía no ha escrito a ningún profesor.
 * Es a propósito y es lo importante de esta página: de quien llega al final y se
 * queja acabas enterándote de una forma u otra, pero de quien se atasca en el
 * segundo paso y cierra la pestaña no se entera nadie nunca, y ése es el fallo
 * que más cuesta.
 */

export const metadata = {
  title: 'Algo no funciona · AcademiAvanza',
  description: 'Cuéntanos qué ha fallado para que podamos arreglarlo.',
};

export default function PaginaBuzon() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza">
        ¿Algo no funciona?
      </h1>

      <p className="mt-4 leading-relaxed text-carbon">
        Cuéntanoslo. Da igual si es un botón que no responde, un texto que no se
        entiende o algo que esperabas encontrar y no está.
      </p>

      <p className="mt-3 leading-relaxed text-gris-medio">
        Esto no es atención al cliente ni un formulario de contacto, sino el sitio
        donde apuntamos lo que hay que arreglar. Si lo que necesitas es que
        alguien te conteste sobre una solicitud concreta, escríbenos a{' '}
        <a
          className="underline underline-offset-4"
          href="mailto:info@academiavanza.es"
        >
          info@academiavanza.es
        </a>
        .
      </p>

      <div className="mt-8">
        <FormularioBuzon />
      </div>

      {/* Qué se hace con lo que se escribe, dicho aquí y no sólo en la política.
          Este formulario lo puede usar cualquiera que entre en la web, incluida
          gente que no tiene ni ficha ni solicitud y que no va a ir a leerse una
          página legal. */}
      <p className="mt-6 border-t border-gris-borde pt-6 text-sm leading-relaxed text-gris-medio">
        Guardamos lo que escribas y la página desde la que nos escribes, para
        poder arreglarlo. El correo es opcional y sólo lo usamos para
        contestarte. Se borra todo al año de resolverlo, y está contado entero
        en la{' '}
        <a className="underline underline-offset-4" href="/legal/privacidad">
          política de privacidad
        </a>
        .
      </p>
    </main>
  );
}
