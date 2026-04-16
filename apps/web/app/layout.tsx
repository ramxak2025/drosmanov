import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';
import { AppNav } from '@/components/ui/AppNav';
import { TopNav } from '@/components/ui/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dr. Osmanov — Стоматология',
  description: 'Стоматологическая клиника Dr. Osmanov — запись онлайн',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1A1A1A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <TopNav />
          <div className="page">{children}</div>
          <AppNav />
        </Providers>
      </body>
    </html>
  );
}
