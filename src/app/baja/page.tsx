import Link from 'next/link';

/**
 * Lo que ve un profesor justo después de borrarse.
 *
 * Existe porque su enlace ha dejado de funcionar un segundo antes: devolverle
 * al panel daría un 404 y parecería que algo ha ido mal, cuando ha ido bien.
 *
 * No hay ningún «¿seguro?» ni ningún botón para deshacerlo. No se puede
 * deshacer, y fingir lo contrario sería mentir en la única pantalla donde ya no
 * queda nada que vender.
 */

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ficha borrada · AcademiAvanza',
  robots: { index: false, follow: false },
};

export default async function PaginaBaja({
  searchParams,
}: {
  searchParams: Promise<{ cerradas?: string }>;
}) {
  const { cerradas } = await searchParams;
  const numero = Number(cerradas ?? '0');
  const cerradasValidas = Number.isInteger(numero) && numero > 0 ? numero : 0;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-azul-confianza">
        Tu ficha está borrada
      </h1>

      <p className="mt-4 leading-relaxed text-carbon">
        Ya no apareces en el directorio y hemos borrado tu nombre, tu correo, tu
        teléfono y todo lo que habías escrito. El enlace de tu panel ha dejado de
        funcionar.
      </p>

      {cerradasValidas > 0 && (
        <p className="mt-3 leading-relaxed text-carbon">
          {cerradasValidas === 1
            ? 'Tenías una solicitud sin contestar. La hemos cerrado y hemos avisado a esa familia.'
            : `Tenías ${cerradasValidas} solicitudes sin contestar. Las hemos cerrado y hemos avisado a esas familias.`}
        </p>
      )}

      <p className="mt-3 leading-relaxed text-carbon">
        Si alguna familia llegó a pagar por tu contacto, se conserva la fecha y
        el importe sin tu nombre. Es lo que acredita que ese dinero entró.
      </p>

      <p className="mt-6 text-sm leading-relaxed text-gris-medio">
        Si algún día quieres volver, puedes darte de alta otra vez desde cero, que no
        guardamos nada tuyo para reconocerte. Y si crees que esto ha sido un
        error, escríbenos a{' '}
        <a
          className="underline underline-offset-4"
          href="mailto:info@academiavanza.es"
        >
          info@academiavanza.es
        </a>
        .
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg border border-gris-borde px-5 py-2.5 text-sm font-semibold text-carbon hover:bg-gris-claro"
        >
          Ir al inicio
        </Link>
        <Link
          href="/registro"
          className="rounded-lg bg-verde-avanza px-5 py-2.5 text-sm font-semibold text-white hover:bg-verde-avanza-oscuro"
        >
          Darme de alta otra vez
        </Link>
      </div>
    </main>
  );
}
