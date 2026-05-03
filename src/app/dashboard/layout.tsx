// app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { CartProvider } from '@/context/CartContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // FIX 1: Aggiunto 'await' perché in Next.js 15+ i cookie sono asincroni
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
      
  const { data: { user } } = await supabase.auth.getUser();

  // Se non c'è il cookie di sessione, fuori!
  if (!user) {
    redirect('/login');
  }

  // Cerca il profilo consulente
  const { data: consultant } = await supabase
    .from('consultants')
    .select('id, first_name, last_name, type, credits')
    .eq('user_id', user.id)
    .single();

  if (!consultant) {
    console.log("🔴 ATTENZIONE: Utente loggato, ma non esiste in 'consultants'!");
  }

  // FIX 2: Aggiunti 'id' e 'credits' per rispettare i tipi di TypeScript
  const safeConsultant = consultant || { 
    id: 'id-provvisorio-123',
    first_name: 'Test', 
    last_name: 'User', 
    type: 'CFA',
    credits: 0
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      <DashboardSidebar consultant={safeConsultant} />
      <main className="flex-1 ml-64 min-h-screen">
        <CartProvider>
          {children}
        </CartProvider>
      </main>
    </div>
  );
}