import Link from 'next/link';

/**
 * El envoltorio de las tres páginas legales.
 *
 * Existe para que las tres se lean igual y para no repetir el mismo bloque de
 * clases tres veces. Los textos legales suelen escribirse en un cuerpo de letra
 * diminuto y gris que nadie lee; aquí se leen como el resto de la web, porque
 * si se escriben para no ser leídos no cumplen su función.
 */

export function PaginaLegal({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  actualizado: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="text-sm text-gris-medio underline underline-offset-4"
      >
        ← Volver a AcademiAvanza
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-azul-confianza">
        {titulo}
      </h1>
      <p className="mt-2 text-sm text-gris-medio">
        Última actualización: {actualizado}
      </p>

      <div className="mt-10 space-y-8 text-carbon">{children}</div>

      <nav className="mt-16 border-t border-gris-borde pt-6 text-sm text-gris-medio">
        <Link href="/legal/aviso-legal" className="underline underline-offset-4">
          Aviso legal
        </Link>
        {' · '}
        <Link href="/legal/privacidad" className="underline underline-offset-4">
          Privacidad
        </Link>
        {' · '}
        <Link href="/legal/cookies" className="underline underline-offset-4">
          Cookies
        </Link>
      </nav>
    </main>
  );
}

export function Apartado({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-azul-confianza">{titulo}</h2>
      <div className="mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

/**
 * Marca lo que Lucía tiene que rellenar antes de publicar.
 *
 * Se ve en amarillo y canta a la legua, a propósito: un hueco discreto es un
 * hueco que se publica sin rellenar.
 */
export function Pendiente({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-200 px-1 font-medium text-amber-900">
      {children}
    </mark>
  );
}
