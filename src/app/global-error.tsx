'use client';

/**
 * El último recurso: cuando lo que se rompe es la propia plantilla de la web.
 *
 * `error.tsx` cubre los fallos de una página, pero vive dentro del `layout`.
 * Si el que falla es el `layout`, no hay dónde pintarlo, y por eso esta
 * pantalla trae su propio `<html>` y su propio `<body>`.
 *
 * Aquí no se usan ni las tipografías ni los colores del proyecto, porque los
 * carga el `layout` y el `layout` es justo lo que no está. Todo va en estilos
 * escritos a mano. Es fea a propósito: lo que importa es que diga algo en
 * castellano en vez de dejar una página en blanco.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: '80px 24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          color: '#1f2937',
        }}
      >
        <h1 style={{ fontSize: '24px', color: '#1a4a7a' }}>
          La web no ha podido cargarse
        </h1>

        <p style={{ maxWidth: '400px', margin: '16px auto', lineHeight: 1.6 }}>
          No es culpa tuya. Vuelve a intentarlo dentro de un momento, y si sigue
          igual escríbenos a info@academiavanza.es.
        </p>

        <button
          onClick={reset}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#FFFFFF',
            background: '#2e7d5e',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Volver a intentarlo
        </button>
      </body>
    </html>
  );
}
