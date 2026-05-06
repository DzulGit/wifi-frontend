import { Inter, Space_Grotesk } from 'next/font/google';
import '../globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#F4F4F5] text-[#1A1A1A] antialiased`}>
        {children}
      </body>
    </html>
  );
}