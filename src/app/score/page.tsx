// app/score/page.tsx
import ScoreForm from '@/components/score/ScoreForm';

export const metadata = {
  title: 'Calcola il tuo Financial Health Score | PeerFinance',
  description: 'Scopri il tuo stato di salute finanziaria e confrontalo con la media italiana in meno di 5 minuti.',
};

export default function ScorePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Il tuo Financial Health Score
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Compila i dati in modo anonimo. I tuoi dati finanziari vengono processati solo sul tuo dispositivo.
          </p>
        </div>
        
        <ScoreForm />
      </div>
    </main>
  );
}