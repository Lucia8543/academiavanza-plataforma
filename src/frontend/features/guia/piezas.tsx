/**
 * Las piezas con las que se dibujan las guías.
 *
 * **No son capturas de pantalla, y es deliberado.** Una captura se queda vieja
 * en cuanto alguien mueve un botón, y nadie se acuerda de rehacerla: al mes la
 * guía enseña una web que ya no existe, que es peor que no tener guía. Esto son
 * dibujos esquemáticos hechos con los mismos colores del sitio, así que envejecen
 * despacio y se corrigen escribiendo.
 *
 * También pesan mucho menos, que importa cuando quien lee es un chaval de veinte
 * años abriendo un enlace de WhatsApp con dos rayas de cobertura.
 *
 * Todo es decorativo: lo que hay que entender está escrito al lado en palabras.
 * Por eso los dibujos van con `aria-hidden`, para que quien navegue con lector
 * de pantalla no se coma una ristra de cajas vacías.
 */

import type { ReactNode } from 'react';

/** Un paso de la guía, con su número y su dibujo. */
export function Paso({
  numero,
  titulo,
  children,
  dibujo,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
  dibujo?: ReactNode;
}) {
  return (
    <li className="relative border-l-2 border-gris-borde pb-10 pl-8 last:border-transparent last:pb-0">
      <span className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-verde-avanza text-sm font-bold text-white">
        {numero}
      </span>

      <h2 className="pt-1 text-lg font-bold text-carbon">{titulo}</h2>

      <div className="mt-2 space-y-2 text-sm leading-relaxed text-gris-medio">
        {children}
      </div>

      {dibujo && <div className="mt-4">{dibujo}</div>}
    </li>
  );
}

/** El marco de una pantalla, con su barra de arriba. */
export function Pantalla({
  donde,
  children,
}: {
  donde: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className="max-w-sm overflow-hidden rounded-xl border border-gris-borde bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-gris-borde bg-gris-claro px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-gris-borde" />
        <span className="h-2 w-2 rounded-full bg-gris-borde" />
        <span className="truncate text-[11px] text-gris-medio">{donde}</span>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

/** Una raya gris: texto que hay pero que no hace falta leer en el dibujo. */
export function Raya({ ancho = 'w-full' }: { ancho?: string }) {
  return <span className={`block h-2 rounded bg-gris-claro ${ancho}`} />;
}

/** Un campo del formulario, con su etiqueta encima. */
export function Campo({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  return (
    <span className="block">
      <span className="block text-[11px] font-medium text-gris-medio">
        {etiqueta}
      </span>
      <span className="mt-1 block rounded-md border border-gris-borde px-2 py-1.5 text-[11px] text-carbon">
        {valor ?? ' '}
      </span>
    </span>
  );
}

/** Un botón. `tono` decide si es el importante de la pantalla o uno más. */
export function Boton({
  children,
  tono = 'principal',
}: {
  children: ReactNode;
  tono?: 'principal' | 'secundario' | 'peligro';
}) {
  const estilos = {
    principal: 'bg-verde-avanza text-white',
    secundario: 'border border-gris-borde text-carbon',
    peligro: 'border border-error text-error',
  } as const;

  return (
    <span
      className={`inline-block rounded-lg px-3 py-1.5 text-[11px] font-semibold ${estilos[tono]}`}
    >
      {children}
    </span>
  );
}

/** Una tarjeta de profesor tal como sale en el directorio. */
export function FichaMini({
  nombre,
  detalle,
}: {
  nombre: string;
  detalle: string;
}) {
  return (
    <span className="block rounded-lg border border-gris-borde p-3">
      <span className="block text-[12px] font-bold text-azul-confianza">
        {nombre}
      </span>
      <span className="mt-0.5 block text-[11px] text-gris-medio">{detalle}</span>
      <span className="mt-2 block">
        <Boton tono="secundario">Ver ficha y escribirle</Boton>
      </span>
    </span>
  );
}

/**
 * Un aviso al margen del paso.
 *
 * Se usa poco a propósito: si todo lleva recuadro, ninguno se lee. Aquí está
 * reservado a lo que le puede costar algo a quien lo ignore.
 */
export function Ojo({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-lg border-l-4 border-aviso bg-gris-claro px-4 py-3 text-sm leading-relaxed text-carbon">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Las guías de cómo dar clase                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Lo que hay que hacer, resumido antes de contarlo.
 *
 * Va arriba del todo y a propósito: quien abre esto es un chaval de veinte años
 * con una clase dentro de media hora. Si lo único que lee son estas cuatro
 * líneas, la guía ya ha servido para algo. Lo de abajo es para quien quiera el
 * porqué.
 */
export function EnTreintaSegundos({ puntos }: { puntos: string[] }) {
  return (
    <div className="mt-8 rounded-xl border-2 border-verde-avanza bg-verde-avanza-claro p-5">
      <p className="text-sm font-bold text-verde-avanza-oscuro">
        Si sólo lees esto
      </p>
      <ul className="mt-3 space-y-2">
        {puntos.map((p) => (
          <li key={p} className="flex gap-3 text-sm leading-relaxed text-carbon">
            <span aria-hidden="true" className="text-verde-avanza">
              ·
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Un consejo con su título y su explicación. */
export function Consejo({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-carbon">{titulo}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-gris-medio">
        {children}
      </div>
    </section>
  );
}

/**
 * Frases para decir tal cual.
 *
 * La diferencia entre «hazle preguntas» y saber qué preguntar es toda la guía.
 * Lo primero se lee y se olvida; lo segundo se copia y se usa el martes.
 */
export function Frases({ frases }: { frases: string[] }) {
  return (
    <ul className="mt-3 space-y-2 border-l-2 border-gris-borde pl-4">
      {frases.map((f) => (
        <li key={f} className="text-sm italic leading-relaxed text-carbon">
          «{f}»
        </li>
      ))}
    </ul>
  );
}

/** La cabecera común de las guías de clase. */
export function CabeceraGuia({
  titulo,
  entradilla,
  minutos,
}: {
  titulo: string;
  entradilla: string;
  minutos: number;
}) {
  return (
    <>
      <p className="text-sm font-semibold text-verde-avanza-oscuro">
        <a href="/como-dar-clase" className="underline underline-offset-4">
          Guías para dar clase
        </a>
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-azul-confianza">
        {titulo}
      </h1>
      <p className="mt-4 leading-relaxed text-carbon">{entradilla}</p>
      <p className="mt-2 text-sm text-gris-medio">{minutos} minutos de lectura.</p>
    </>
  );
}

/** El cierre de todas las guías: dónde están las demás y cómo avisar de fallos. */
export function PieDeGuia() {
  return (
    <p className="mt-12 border-t border-gris-borde pt-6 text-sm text-gris-medio">
      Esto no es una norma ni te lo va a revisar nadie. Son cosas que funcionan,
      escritas para que no tengas que descubrirlas tú.{' '}
      <a href="/como-dar-clase" className="underline underline-offset-4">
        Aquí están las demás guías
      </a>
      . Y si se te ocurre algo que debería estar aquí,{' '}
      <a href="/buzon" className="underline underline-offset-4">
        cuéntanoslo
      </a>
      .
    </p>
  );
}
