// components/score/steps/Step2Cashflow.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import type { HealthScoreInput } from '@/lib/schemas/health-score';

export default function Step2Cashflow() {
  const { register, formState: { errors } } = useFormContext<HealthScoreInput>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Entrate e Uscite</h2>
        <p className="text-slate-500">Analizziamo il tuo flusso di cassa mensile per calcolare il tuo tasso di risparmio.</p>
      </div>

      <div className="space-y-5">
        {/* Reddito Netto */}
        <div>
          <label htmlFor="monthlyNetIncome" className="block text-sm font-medium text-slate-700 mb-1">
            Reddito netto mensile (€)
          </label>
          <div className="relative">
            <input
              id="monthlyNetIncome"
              type="number"
              inputMode="numeric"
              placeholder="es. 1800"
              {...register('monthlyNetIncome')}
              className={`w-full p-3 pl-4 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors ${
                errors.monthlyNetIncome ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Considera lo stipendio netto o la media mensile se sei partita IVA.</p>
          {errors.monthlyNetIncome && (
            <p className="mt-1 text-sm text-red-600">{errors.monthlyNetIncome.message}</p>
          )}
        </div>

        {/* Spese Fisse */}
        <div>
          <label htmlFor="monthlyFixedExpenses" className="block text-sm font-medium text-slate-700 mb-1">
            Spese fisse mensili (€)
          </label>
          <input
            id="monthlyFixedExpenses"
            type="number"
            inputMode="numeric"
            placeholder="es. 850"
            {...register('monthlyFixedExpenses')}
            className={`w-full p-3 pl-4 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors ${
              errors.monthlyFixedExpenses ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          />
          <p className="mt-1 text-xs text-slate-500">Includi affitto/mutuo, bollette, spesa alimentare base, abbonamenti e rate.</p>
          {errors.monthlyFixedExpenses && (
            <p className="mt-1 text-sm text-red-600">{errors.monthlyFixedExpenses.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}