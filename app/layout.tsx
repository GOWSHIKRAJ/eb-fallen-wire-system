import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'EB Fallen Wire System', description: 'Real-time electric line fault monitoring (simulation platform)' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
