import type { Metadata } from 'next';
import './journey.css';

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (productionHost ? `https://${productionHost}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Made For You — tiny websites, big feelings',
  description: 'Choose a personal digital-gift template and turn your memories into one unforgettable little website.',
  openGraph: { title: 'Made For You', description: 'tiny websites, big feelings', images: ['/og.jpg'] },
  twitter: { card: 'summary_large_image', title: 'Made For You', description: 'tiny websites, big feelings', images: ['/og.jpg'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
