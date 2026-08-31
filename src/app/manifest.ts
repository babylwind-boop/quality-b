import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brandLine,
    short_name: site.name,
    description:
      'Quality Build & Management — Hausbau, Fassadenarbeiten, Renovierung und Restaurierung in Deutschland.',
    start_url: '/',
    display: 'standalone',
    background_color: '#181716',
    theme_color: '#181716',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  };
}
