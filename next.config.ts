import type { NextConfig } from 'next';

/**
 * Cabeceras de seguridad.
 *
 * No había ninguna. Son las instrucciones que el servidor le da al navegador
 * sobre lo que puede y no puede hacer con esta web, y sin ellas el navegador
 * aplica lo más permisivo que sabe.
 *
 * Van todas menos una, y esa una explicada más abajo.
 */
const CABECERAS = [
  /*
   * Sólo se manda la dirección de origen, y sólo al salir hacia otro sitio.
   *
   * Sin esto, cuando alguien pulsa un enlace externo desde su página privada de
   * seguimiento, el sitio de destino recibe la dirección completa, y esa
   * dirección **es la llave**: quien la tenga entra. Es el fallo más probable de
   * los seis, porque no hace falta que nadie ataque nada, basta con un clic.
   */
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  /*
   * El navegador respeta el tipo de fichero que decimos y no intenta adivinarlo.
   * Sin esto, algo subido como texto puede acabar ejecutándose como script.
   */
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  /*
   * Nadie puede meter esta web dentro de un marco en otra página. Es lo que
   * impide montar una copia con los botones tapados para que alguien pulse
   * «publicar» o «darme de baja» creyendo que pulsa otra cosa.
   */
  { key: 'X-Frame-Options', value: 'DENY' },

  /*
   * Ni cámara, ni micrófono, ni ubicación. Esta web no usa ninguna de las tres,
   * así que se apagan del todo: lo que no se puede pedir no se puede colar.
   */
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },

  /*
   * Un año exigiendo conexión cifrada, subdominios incluidos.
   *
   * A partir de la primera visita el navegador se niega a entrar sin cifrar,
   * aunque alguien escriba la dirección a mano. Sin `preload`, que es
   * irreversible durante meses y no toca decidirlo la semana del lanzamiento.
   */
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

/*
 * La sexta, la política de contenidos, va aparte y en modo aviso.
 *
 * Es la más útil de todas y también la única que puede tumbar la web entera si
 * se pone mal: Next inserta estilos y scripts en línea, y una política estricta
 * de golpe deja la página en blanco. En este modo el navegador **no bloquea
 * nada**, sólo anota en su consola lo que habría bloqueado.
 *
 * Sirve para mirarla unos días con la web funcionando y ver qué haría falta
 * permitir. Cuando esté limpia, se cambia la clave por `Content-Security-Policy`
 * y entonces sí empieza a bloquear. Ponerla directa sin ese paso previo es la
 * forma habitual de dejar un sitio roto un viernes.
 */
const POLITICA_DE_CONTENIDOS = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Todas las rutas, incluidas las de la API y los ficheros estáticos.
        source: '/:ruta*',
        headers: [
          ...CABECERAS,
          {
            key: 'Content-Security-Policy-Report-Only',
            value: POLITICA_DE_CONTENIDOS,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
