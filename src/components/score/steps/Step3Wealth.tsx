// components/score/steps/Step3Wealth.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import type { HealthScoreInput } from '@/lib/schemas/health-score';

export default function Step3Wealth() {
  const { register, formState: { errors } } = useFormContext<HealthScoreInput>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Patrimonio</h2>
        <p className="text-slate-500">Ultimo step. Ci serve per calcolare quanti mesi di autonomia finanziaria hai (Runway).</p>
      </div>

      <div className="space-y-5">
        {/* Risparmi */}
        <div>
          <label htmlFor="totalSavings" className="block text-sm font-medium text-slate-700 mb-1">
            Risparmi e Investimenti liquidi (€)
          </label>
          <input
            id="totalSavings"
            type="number"
            inputMode="numeric"
            placeholder="es. 15000"
            {...register('totalSavings')}
            className={`w-full p-3 pl-4 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors ${
              errors.totalSavings ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          />
          <p className="mt-1 text-xs text-slate-500">Conti correnti, conti deposito, azioni, ETF, crypto. Escludi il valore della casa.</p>
          {errors.totalSavings && (
            <p className="mt-1 text-sm text-red-600">{errors.totalSavings.message}</p>
          )}
        </div>

        {/* Debiti */}
        <div>
          <label htmlFor="consumerDebt" className="block text-sm font-medium text-slate-700 mb-1">
            Debiti al consumo (€)
          </label>
          <input
            id="consumerDebt"
            type="number"
            inputMode="numeric"
            placeholder="es. 3500"
            {...register('consumerDebt')}
            className={`w-full p-3 pl-4 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors ${
              errors.consumerDebt ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          />
          <p className="mt-1 text-xs text-slate-500 font-medium text-blue-600">Escludi il mutuo della casa. <span className="text-slate-500 font-normal">Inserisci solo finanziamenti auto, prestiti personali o carte revolving.</span></p>
          {errors.consumerDebt && (
            <p className="mt-1 text-sm text-red-600">{errors.consumerDebt.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}