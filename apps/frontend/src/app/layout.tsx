import { ReactNode } from 'react';

export const metadata = {
  title: 'MangaTracker',
  description: 'Next.js + Express + Turborepo starter',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
