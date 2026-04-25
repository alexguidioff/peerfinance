import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from '@/components/CookieBanner';

// IMPORTA LA NAVBAR
import Navbar from "@/components/Navbar"; 

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peerfinance | Confronta il tuo stipendio e i tuoi risparmi",
  description: "Scopri se il tuo stipendio è in linea con la media della tua città. Dati ufficiali MEF e ISTAT per calcolare il tuo Health Score finanziario.",
  verification: {
    google: '<meta name="google-site-verification" content="wq0Ik4Pg2WNX-2XySe2iWkTTexfY8FPjMOsHdnOGwQQ" />',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {/* INSERISCI LA NAVBAR QUI */}
        <Navbar />
        
        {/* Il main conterrà il resto della pagina e si espanderà per riempire lo spazio */}
        <div className="flex-1">
          {children}
          
        </div>
        <CookieBanner /> 
      </body>
    </html>
  );
}
