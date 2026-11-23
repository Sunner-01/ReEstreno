import type { Metadata } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './globals.css';
import { AuthProvider } from '../components/auth-provider';
import { Header, Footer } from '../components/shell';
export const metadata: Metadata = {
  title: { default: 'ReEstreno — Lo bueno merece otra vuelta', template: '%s · ReEstreno' },
  description:
    'Compra y vende objetos con historia. Encuentra tu próximo estreno, conecta con su vendedor y coordina por WhatsApp.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <a className="skip-link" href="#contenido">
            Ir al contenido
          </a>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
