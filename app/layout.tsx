import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chicago Community Map',
  description: 'Interactive map of Chicago community areas, boundaries, and landmarks built with Next.js 15, React Leaflet, and Neon DB',
  keywords: ['Chicago', 'community areas', 'map', 'neighborhoods', 'PostGIS', 'geospatial'],
  authors: [{ name: 'Chicago Community Map Team' }],
  openGraph: {
    title: 'Chicago Community Map',
    description: 'Explore Chicago\'s 77 community areas with interactive mapping',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}