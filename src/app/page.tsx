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
          Estamos preparando el nuevo directorio de profesores. Muy pronto podrás
          buscar por colegio, asignatura y nivel, y escribir directamente a quien
          encaje contigo.
        </p>

        <div className="mt-10 border-t border-gris-borde pt-6 text-sm text-gris-medio">
          ¿Eres profesor y quieres aparecer en el directorio?
          <br />
          Escríbenos a{' '}
          <a
            className="font-medium text-verde-avanza underline underline-offset-4 hover:text-verde-avanza-oscuro"
            href="mailto:info@academiavanza.es"
          >
            info@academiavanza.es
          </a>
        </div>
      </div>
    </main>
  );
}
