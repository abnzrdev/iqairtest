import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Breez - Air Quality Monitor',
  description: 'Real-time air quality monitoring and visualization',
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale =
    headersList.get('x-next-intl-locale') || routing.defaultLocale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
