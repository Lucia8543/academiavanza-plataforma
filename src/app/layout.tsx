import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
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
    'Encuentra profesor particular para tu hijo. Sabiendo de dónde viene.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${texto.variable} ${titulo.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
