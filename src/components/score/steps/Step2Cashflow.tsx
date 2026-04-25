'use client';

import { useFormContext } from 'react-hook-form';
import type { HealthScoreInput } from '@/lib/schemas/health-score';
import { Wallet, CreditCard } from 'lucide-react';

export default function Step2Cashflow() {
  const { register, formState: { errors } } = useFormContext<HealthScoreInput>();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-foreground mb-3">Flusso di Cassa</h2>
        <p className="text-muted-foreground text-lg">
          Analizziamo le tue entrate e uscite mensili per calcolare il tuo reale potenziale di risparmio.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Reddito Netto */}
        <div className="relative">
          <label htmlFor="monthlyNetIncome" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-500" /> Reddito netto mensile (€)
          </label>
          <input
            id="monthlyNetIncome"
            type="number"
            inputMode="numeric"
            placeholder="es. 1800"
            {...register('monthlyNetIncome')}
            className={`w-full p-4 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.monthlyNetIncome ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Considera lo stipendio netto o la media mensile se sei partita IVA.
          </p>
          {errors.monthlyNetIncome && (
            <p className="mt-2 text-sm font-bold text-red-500">{errors.monthlyNetIncome.message}</p>
          )}
        </div>

        {/* Spese Fisse */}
        <div className="relative">
          <label htmlFor="monthlyFixedExpenses" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Spese fisse mensili (€)
          </label>
          <input
            id="monthlyFixedExpenses"
            type="number"
            inputMode="numeric"
            placeholder="es. 850"
            {...register('monthlyFixedExpenses')}
            className={`w-full p-4 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.monthlyFixedExpenses ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Includi affitto/mutuo, bollette, spesa alimentare base, abbonamenti e rate.
          </p>
          {errors.monthlyFixedExpenses && (
            <p className="mt-2 text-sm font-bold text-red-500">{errors.monthlyFixedExpenses.message}</p>
          )}
        </div>

      </div>
    </div>
  );
}
