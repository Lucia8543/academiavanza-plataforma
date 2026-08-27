import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Pie } from '@/frontend/components/shared/pie';
import '@/frontend/styles/globals.css';

const texto = Inter({
  subsets: ['latin'],
  variable: '--font-texto',
  display: 'swap',
});

const titulo = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-titulo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AcademiAvanza',
  description:
    'Encuentra profesor particular para tu hijo en Madrid, sabiendo en qué colegio estudió.',
  // El manifiesto y el icono de Apple no son adorno: son lo que permite añadir
  // la web a la pantalla de inicio de un iPhone, y en iPhone eso es requisito
  // para que los avisos al móvil funcionen. Sin esto, la mitad de los
  // profesores no puede recibir ninguno.
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'AcademiAvanza',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icono-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icono-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A365D',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${texto.variable} ${titulo.variable} flex min-h-screen flex-col antialiased`}
      >
        <div className="flex-1">{children}</div>
        <Pie />
      </body>
    </html>
  );
}
