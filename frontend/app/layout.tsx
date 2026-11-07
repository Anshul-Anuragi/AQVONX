import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/footer';
import ThemeProvider from '@/components/ThemeProvider';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'AQVONX Studio — Next-Gen AI Browser Extensions',
  description: 'Parent ecosystem for NotesGPT, PortalSnap, and EditorialLens.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 relative selection:bg-[#7305FA]/30 selection:text-[#c29dfc]"
      >
        <SessionProvider>
          <ThemeProvider>
            {/* Subtle Dark Grid & Radial Glow Texture */}
            <div className="fixed inset-0 pointer-events-none z-0 dark-grid-bg opacity-70" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#7305FA]/20 via-indigo-500/10 to-transparent blur-3xl pointer-events-none z-0" />
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
