// app/grazie/page.tsx
import Link from 'next/link';
import { CheckCircle2, Calendar, Mail, ArrowRight } from 'lucide-react';

export default function GraziePage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/5 via-background to-background -z-10" />

      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Icona */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Titolo */}
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Richiesta inviata!
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            La tua Sessione Strategica Gratuita è stata prenotata con successo.
          </p>
        </div>

        {/* Prossimi passi */}
        <div className="bg-card border border-border rounded-3xl p-8 text-left space-y-6">
          <h2 className="text-lg font-black uppercase tracking-widest text-muted-foreground text-center mb-2">
            Cosa succede adesso
          </h2>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-bold">Email di conferma</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Riceverai a breve una email con il riepilogo della tua analisi e i dettagli della sessione.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-bold">Contatto entro 48 ore</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Un professionista verificato ti contatterà nell'orario che hai indicato per fissare la sessione.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-bold">Sessione gratuita (valore €150)</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                60 minuti con un consulente finanziario o career coach dedicati esclusivamente alla tua situazione.
              </p>
            </div>
          </div>
        </div>

        {/* CTA secondaria */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all hover:-translate-y-0.5"
          >
            Torna alla Home <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/redditi"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border bg-card font-bold rounded-2xl hover:bg-secondary transition-all"
          >
            Esplora i dati MEF
          </Link>
        </div>

      </div>
    </main>
  );
}