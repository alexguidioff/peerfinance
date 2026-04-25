'use client';

import { useFormContext } from 'react-hook-form';
import type { LeadFormInput } from '@/lib/schemas/lead-schema';
import { PiggyBank, ShieldAlert, TrendingUp, Flag, FileCheck } from 'lucide-react';

export default function Step3Strategy() {
  const { register, formState: { errors } } = useFormContext<LeadFormInput>();

  const insurancesList = ["Vita (TCM)", "Infortuni", "Salute / Sanitaria", "Nessuna"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gestione TFR */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-emerald-500" /> Gestione TFR
          </label>
          <select
            {...register('tfrManagement')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.tfrManagement ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona...</option>
            <option value="Lasciato in Azienda">Lasciato in Azienda</option>
            <option value="Fondo Pensione Negoziale">Fondo Pensione Negoziale (di categoria)</option>
            <option value="Fondo Pensione Aperto/PIP">Fondo Pensione Aperto / PIP</option>
            <option value="Non applicabile / Autonomo">Non applicabile / P.IVA</option>
            <option value="Non lo so">Non lo so</option>
          </select>
          {errors.tfrManagement && <p className="mt-2 text-sm font-bold text-red-500">{errors.tfrManagement.message}</p>}
        </div>

        {/* Obiettivo Finanziario */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Flag className="w-4 h-4 text-emerald-500" /> Obiettivo Finanziario Primario
          </label>
          <select
            {...register('primaryFinancialGoal')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.primaryFinancialGoal ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona...</option>
            <option value="Comprare casa">Comprare casa</option>
            <option value="Creare una rendita futura / Pensione">Creare una rendita futura / Pensione</option>
            <option value="Protezione dall'inflazione">Protezione dall'inflazione</option>
            <option value="Gestire liquidità in eccesso">Gestire liquidità in eccesso</option>
            <option value="Uscire dai debiti">Uscire dai debiti</option>
          </select>
          {errors.primaryFinancialGoal && <p className="mt-2 text-sm font-bold text-red-500">{errors.primaryFinancialGoal.message}</p>}
        </div>
      </div>

      <hr className="border-border my-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Assicurazioni Attive */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-500" /> Assicurazioni Attive
          </label>
          <div className="space-y-3">
            {insurancesList.map((ins) => (
              <label key={ins} className="flex items-center gap-3 p-3 border-2 border-border rounded-xl cursor-pointer hover:bg-secondary transition-colors">
                <input
                  type="checkbox"
                  value={ins}
                  {...register('activeInsurances')}
                  className="w-5 h-5 rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-foreground">{ins}</span>
              </label>
            ))}
          </div>
          {errors.activeInsurances && <p className="mt-2 text-sm font-bold text-red-500">{errors.activeInsurances.message}</p>}
        </div>

        {/* Propensione al Rischio */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Propensione al Rischio
          </label>
          <div className="space-y-3">
            {[
              "Bassa (Voglio proteggere il capitale)",
              "Media (Accetto oscillazioni moderate)",
              "Alta (Punto alla crescita, accetto cali anche del 20%)"
            ].map((risk) => (
              <label key={risk} className="block cursor-pointer">
                <input type="radio" value={risk} {...register('riskTolerance')} className="peer sr-only" />
                <div className="p-4 border-2 border-border rounded-xl font-medium text-sm text-muted-foreground hover:bg-secondary peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 dark:peer-checked:bg-emerald-900/20 dark:peer-checked:text-emerald-300 transition-all">
                  {risk}
                </div>
              </label>
            ))}
          </div>
          {errors.riskTolerance && <p className="mt-2 text-sm font-bold text-red-500">{errors.riskTolerance.message}</p>}
        </div>
      </div>

      <div className="bg-secondary/50 p-6 rounded-2xl border border-border mt-8 space-y-4">
        <h4 className="font-bold text-foreground flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-emerald-500" /> Consensi e Privacy
        </h4>
        
        {/* Privacy Policy (Obbligatoria) */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="mt-1">
            <input
              type="checkbox"
              {...register('privacyConsent')}
              className="w-5 h-5 rounded border-border text-emerald-600 focus:ring-emerald-500"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-emerald-600 transition-colors">
              Accetto la Privacy Policy e i Termini di Servizio *
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Acconsento al trattamento dei miei dati personali per la generazione del report.
            </p>
          </div>
        </label>
        {errors.privacyConsent && <p className="text-sm font-bold text-red-500 ml-8">{errors.privacyConsent.message}</p>}

        {/* Consenso Partner (Opzionale ma vitale per il business) */}
        <label className="flex items-start gap-3 cursor-pointer group pt-2">
          <div className="mt-1">
            <input
              type="checkbox"
              {...register('partnerConsent')}
              className="w-5 h-5 rounded border-border text-emerald-600 focus:ring-emerald-500"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-emerald-600 transition-colors">
              Desidero essere contattato da un Consulente o Coach partner per un'analisi gratuita
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Opzionale. Spuntando questa casella, acconsenti a condividere i dati inseriti esclusivamente con un professionista verificato della nostra rete per organizzare una sessione strategica gratuita.
            </p>
          </div>
        </label>
      </div>

    </div>
  );
}