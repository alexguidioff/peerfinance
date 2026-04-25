'use client';

import { useFormContext } from 'react-hook-form';
import type { LeadFormInput } from '@/lib/schemas/lead-schema';
import { Briefcase, Calendar, CircleDollarSign, Target, Frown, Meh, Smile } from 'lucide-react';

export default function Step2Career({ estimatedGrossAnnual }: { estimatedGrossAnnual: number }) {

  const { register, watch, formState: { errors } } = useFormContext<LeadFormInput>();
  // Osserviamo il valore dello slider per mostrarlo a schermo in tempo reale
  const satisfactionValue = watch('jobSatisfaction') || 5;

  // Logica per l'icona e il colore dinamici
  const getSatisfactionUI = (val: number) => {
    if (val <= 3) return { Icon: Frown, color: 'text-red-500' };
    if (val <= 7) return { Icon: Meh, color: 'text-amber-500' };
    return { Icon: Smile, color: 'text-emerald-500' };
  };

  const { Icon: SatisfactionIcon, color: satisfactionColor } = getSatisfactionUI(satisfactionValue);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-500" /> Qualifica / Ruolo
          </label>
          <input
            type="text"
            placeholder="es. Impiegato, Sviluppatore, Manager..."
            {...register('jobTitle')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.jobTitle ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.jobTitle && <p className="mt-2 text-sm font-bold text-red-500">{errors.jobTitle.message}</p>}
        </div>

        {/* RAL */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-emerald-500" /> RAL Lorda Annua (€)
          </label>
          <input
            type="number"
            min="0"
            placeholder="es. 35000"
            {...register('grossAnnualIncome', { valueAsNumber: true })}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.grossAnnualIncome ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.grossAnnualIncome && <p className="mt-2 text-sm font-bold text-red-500">{errors.grossAnnualIncome.message}</p>}
        </div>
      </div>

      <hr className="border-border my-6" />

      {/* Soddisfazione Lavorativa (Slider Dinamico) */}
      <div>
        <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          {/* L'icona ora è più grande (w-6 h-6) e cambia dinamicamente */}
          <SatisfactionIcon className={`w-6 h-6 transition-colors duration-300 ${satisfactionColor}`} /> 
          Soddisfazione Lavorativa ({satisfactionValue}/10)
        </label>
        <div className="px-2">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            {...register('jobSatisfaction', { valueAsNumber: true })}
            className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs font-bold text-muted-foreground mt-2 px-1">
            <span>Pessima (1)</span>
            <span>Ottima (10)</span>
          </div>
        </div>
        {errors.jobSatisfaction && <p className="mt-2 text-sm font-bold text-red-500">{errors.jobSatisfaction.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Anzianità */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" /> Anzianità nel ruolo
          </label>
          <select
            {...register('jobTenure')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.jobTenure ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona...</option>
            <option value="Meno di 1 anno">Meno di 1 anno</option>
            <option value="1-3 anni">1 - 3 anni</option>
            <option value="3-5 anni">3 - 5 anni</option>
            <option value="Oltre 5 anni">Oltre 5 anni</option>
          </select>
          {errors.jobTenure && <p className="mt-2 text-sm font-bold text-red-500">{errors.jobTenure.message}</p>}
        </div>

        {/* Obiettivo di Carriera */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" /> Obiettivo Primario
          </label>
          <select
            {...register('careerGoal')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.careerGoal ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona...</option>
            <option value="Aumento di stipendio">Aumento di stipendio</option>
            <option value="Cambio azienda / ruolo">Cambio azienda / ruolo</option>
            <option value="Cambio radicale carriera">Cambio radicale carriera (Reskilling)</option>
            <option value="Miglioramento Work-Life balance">Miglioramento Work-Life balance</option>
            <option value="Sto bene così">Sto bene così</option>
          </select>
          {errors.careerGoal && <p className="mt-2 text-sm font-bold text-red-500">{errors.careerGoal.message}</p>}
        </div>
      </div>

    </div>
  );
}