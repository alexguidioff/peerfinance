// app/(public)/layout.tsx
import Navbar from "@/components/Navbar"; 
import CookieBanner from '@/components/CookieBanner';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* INSERISCI LA NAVBAR QUI */}
      <Navbar />
      
      {/* Il main conterrà il resto della pagina e si espanderà per riempire lo spazio */}
      <div className="flex-1">
        {children}
      </div>
      
      <CookieBanner /> 
    </>
  );
}