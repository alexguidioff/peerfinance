'use client';

import { useFormContext } from 'react-hook-form';
import type { LeadFormInput } from '@/lib/schemas/lead-schema';
import { Briefcase, Calendar, CircleDollarSign, Target, Frown, Meh, Smile, GraduationCap } from 'lucide-react';

interface Step2CareerProps {
  estimatedGrossAnnual: number;
  jobCategory: string; // Aggiungiamo la categoria per la logica condizionale
}

export default function Step2Career({ estimatedGrossAnnual, jobCategory }: Step2CareerProps) {
  const { register, watch, formState: { errors } } = useFormContext<LeadFormInput>();
  
  const isWorker = jobCategory === 'Dipendente' || jobCategory === 'Autonomo';
  const isStudent = jobCategory === 'Studente';
  const isUnemployed = jobCategory === 'Disoccupato';

  const satisfactionValue = watch('jobSatisfaction') || 5;

  const getSatisfactionUI = (val: number) => {
    if (val <= 3) return { Icon: Frown, color: 'text-red-500' };
    if (val <= 7) return { Icon: Meh, color: 'text-amber-500' };
    return { Icon: Smile, color: 'text-emerald-500' };
  };

  const { Icon: SatisfactionIcon, color: satisfactionColor } = getSatisfactionUI(satisfactionValue);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Qualifica / Corso di Studi */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            {isStudent ? <GraduationCap className="w-4 h-4 text-emerald-500" /> : <Briefcase className="w-4 h-4 text-emerald-500" />}
            {isStudent ? 'Percorso di Studi' : isUnemployed ? 'Ultima Qualifica' : 'Qualifica / Ruolo'}
          </label>
          <input
            type="text"
            placeholder={isStudent ? "es. Economia, Ingegneria..." : "es. Impiegato, Manager..."}
            {...register('jobTitle')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.jobTitle ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.jobTitle && <p className="mt-2 text-sm font-bold text-red-500">{errors.jobTitle.message}</p>}
        </div>

        {/* RAL (Solo per lavoratori, per gli altri può essere opzionale o 0) */}
        <div className={!isWorker ? 'opacity-50' : ''}>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-emerald-500" /> 
            {isStudent || isUnemployed ? 'Reddito Annuo Attuale (opzionale)' : 'RAL Lorda Annua (€)'}
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

      {/* Mostriamo Soddisfazione e Anzianità SOLO se è un lavoratore attivo */}
      {isWorker && (
        <>
          <hr className="border-border my-6" />
          
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
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
          </div>

          <div className="pt-4">
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
          </div>
        </>
      )}

      {/* Obiettivo di Carriera / Vita */}
      <div className="pt-4">
        <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-500" /> 
          {isStudent ? 'Obiettivo Post-Studi' : 'Obiettivo Primario'}
        </label>
        <select
          {...register('careerGoal')}
          className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
            errors.careerGoal ? 'border-red-500' : 'border-border focus:border-emerald-500'
          }`}
        >
          <option value="">Seleziona...</option>
          {isStudent ? (
            <>
              <option value="Trovare il primo impiego">Trovare il primo impiego</option>
              <option value="Master / Specializzazione">Master / Specializzazione</option>
              <option value="Lavorare all'estero">Lavorare all'estero</option>
              <option value="Avviare una startup">Avviare una startup</option>
            </>
          ) : (
            <>
              <option value="Aumento di stipendio">Aumento di stipendio</option>
              <option value="Cambio azienda / ruolo">Cambio azienda / ruolo</option>
              <option value="Cambio radicale carriera">Cambio radicale carriera (Reskilling)</option>
              <option value="Miglioramento Work-Life balance">Miglioramento Work-Life balance</option>
              <option value="Ricollocamento">Ricollocamento professionale</option>
              <option value="Sto bene così">Sto bene così</option>
            </>
          )}
        </select>
      </div>
    </div>
  );
}