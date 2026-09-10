import type { Metadata } from 'next';
import './globals.css';
import './template-overrides.css';
import './generated-art.css';
import './interactive-polish.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://birthday-mini-love-2026.anothadamian.chatgpt.site'),
  title: 'Made For You — tiny websites, big feelings',
  description: 'Choose a personal digital-gift template and turn your memories into one unforgettable little website.',
  openGraph: { title: 'Made For You', description: 'tiny websites, big feelings', images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: 'Made For You', description: 'tiny websites, big feelings', images: ['/og.png'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
