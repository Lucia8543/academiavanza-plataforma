export default function Portada() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="mb-4 inline-block rounded-full bg-verde-avanza-claro px-4 py-1 text-sm font-medium text-verde-avanza-oscuro">
          En construcción
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight text-azul-confianza sm:text-5xl">
          Academi<span className="text-verde-avanza">Avanza</span>
        </h1>

        <p className="mt-6 text-lg text-carbon">
          Encuentra profesor para tu hijo.
          <br />
          <span className="font-semibold">Sabiendo de dónde viene.</span>
        </p>

        <p className="mt-8 text-base text-gris-medio">
          Busca por colegio, asignatura y curso, y escribe directamente a quien
          encaje contigo. Sin intermediarios y sin coste.
        </p>

        <a
          href="/profesores"
          className="mt-8 inline-block rounded-lg bg-verde-avanza px-6 py-3 font-semibold text-white transition hover:bg-verde-avanza-oscuro"
        >
          Ver profesores
        </a>

        <div className="mt-10 border-t border-gris-borde pt-8">
          <p className="text-sm text-gris-medio">
            ¿Eres profesor y quieres aparecer en el directorio?
          </p>
          <a
            href="/registro"
            className="mt-3 inline-block rounded-lg border border-verde-avanza px-6 py-3 font-semibold text-verde-avanza-oscuro transition hover:bg-verde-avanza-claro"
          >
            Publicar mi ficha
          </a>
        </div>
      </div>
    </main>
  );
}
