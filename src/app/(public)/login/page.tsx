'use client';

import { useState } from 'react';

import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    // 1. Questa riga DEVE impedire il ricaricamento della pagina
    e.preventDefault(); 
    
    // 2. Stampiamo in console per essere sicuri che la funzione parta
    console.log("🟢 1. Pulsante cliccato, ricaricamento bloccato!"); 
    
    setIsLoading(true);
    setErrorMessage('');
    
    // 3. Peschiamo le variabili
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 4. Se mancano le chiavi, ti avviso sullo schermo invece di crashare
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("🔴 ERRORE: Variabili d'ambiente non trovate!");
        setErrorMessage("Errore di configurazione: Controlla il file .env.local");
        setIsLoading(false);
        return;
    }

    console.log("🟢 2. Chiavi trovate. Tento l'accesso a Supabase...");
    
    try {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        console.log("🟢 3. Risposta da Supabase:", { data, error });

        if (error) {
          setErrorMessage("Email o password non corretti.");
          setIsLoading(false);
          return;
        }

        console.log("🟢 4. Login perfetto! Vado alla dashboard...");
        // Invece di usare il router di Next.js che si incastra...
        // ...usiamo l'oggetto window per forzare un caricamento pulito della dashboard
        window.location.href = '/dashboard';
        
        
    } catch (err) {
        console.error("🔴 Errore imprevisto durante il login:", err);
        setErrorMessage("Si è verificato un errore di connessione.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-2">CashflowScore B2B</h1>
          <p className="text-muted-foreground">Accedi alla tua bacheca consulenti</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-background focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="consulente@studio.it"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-sm font-bold text-emerald-600 hover:text-emerald-500">
                  Dimenticata?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-background focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {isLoading ? 'Verifica credenziali...' : 'Entra nella Dashboard'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}