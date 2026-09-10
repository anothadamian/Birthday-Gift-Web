import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'A little birthday surprise ✦', description: 'A personal birthday mini-site, made with love.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
