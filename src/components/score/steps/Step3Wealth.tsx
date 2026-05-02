'use client';

import { useFormContext } from 'react-hook-form';
import type { HealthScoreInput } from '@/lib/schemas/health-score';
import { TrendingUp, CreditCard, Home } from 'lucide-react';

export default function Step3Wealth() {
  const { register, formState: { errors } } = useFormContext<HealthScoreInput>();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-foreground mb-3">Patrimonio e Casa</h2>
        <p className="text-muted-foreground text-lg">
          Ultimo step. Ci serve per valutare la tua reale solidità patrimoniale a lungo termine e l'esposizione ai debiti.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Investimenti Finanziari */}
        <div className="relative">
          <label htmlFor="investments" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Investimenti Finanziari (€)
          </label>
          <input
            id="investments"
            type="number"
            inputMode="numeric"
            placeholder="es. 15000"
            {...register('investments', { valueAsNumber: true })}
            className={`w-full p-4 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.investments ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Azioni, ETF, Crypto, Obbligazioni. <strong className="text-foreground">Escludi</strong> il valore degli immobili e la liquidità che hai già inserito.
          </p>
          {errors.investments && (
            <p className="mt-2 text-sm font-bold text-red-500">{errors.investments.message}</p>
          )}
        </div>

        {/* Debiti al Consumo */}
        <div className="relative">
          <label htmlFor="consumerDebt" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Debiti al consumo (€)
          </label>
          <input
            id="consumerDebt"
            type="number"
            inputMode="numeric"
            placeholder="es. 3500"
            {...register('consumerDebt', { valueAsNumber: true })}
            className={`w-full p-4 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.consumerDebt ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            <strong className="text-foreground">Escludi il mutuo della casa.</strong> Inserisci solo finanziamenti auto, prestiti personali o carte revolving.
          </p>
          {errors.consumerDebt && (
            <p className="mt-2 text-sm font-bold text-red-500">{errors.consumerDebt.message}</p>
          )}
        </div>

        {/* Situazione Abitativa */}
        <div className="relative">
          <label htmlFor="housingStatus" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Home className="w-4 h-4 text-emerald-500" /> Situazione Abitativa
          </label>
          <select
            id="housingStatus"
            {...register('housingStatus')}
            className={`w-full p-4 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.housingStatus ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona...</option>
            <option value="Affitto">In Affitto</option>
            <option value="Proprietà (con Mutuo in corso)">Proprietà (con Mutuo in corso)</option>
            <option value="Proprietà (senza Mutuo)">Proprietà (senza Mutuo)</option>
            <option value="Vivo con i genitori / in famiglia">Vivo con i genitori / in famiglia</option>
          </select>
          {errors.housingStatus && (
            <p className="mt-2 text-sm font-bold text-red-500">{errors.housingStatus.message}</p>
          )}
        </div>

      </div>
    </div>
  );
}