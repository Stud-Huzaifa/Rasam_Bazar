import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RasmBazaar',
  description: 'Desi wedding services marketplace and planner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--rb-burgundy)] focus:px-4 focus:py-2 focus:text-sm focus:font-black focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
