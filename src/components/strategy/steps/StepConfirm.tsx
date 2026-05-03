'use client';

import { useFormContext } from 'react-hook-form';
import type { LeadFormInput } from '@/lib/schemas/lead-schema';
import type { HealthScoreInput } from '@/lib/schemas/health-score';
import {
  User, Briefcase, Target, ShieldCheck, CheckCircle2,
  Wallet, TrendingUp, Video, MapPin
} from 'lucide-react';

const fmt = (n: number) => '€' + Math.round(n).toLocaleString('it-IT');

function Row({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground shrink-0 flex items-center gap-2">
        {icon} {label}
      </span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-secondary/40 rounded-2xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

export default function StepConfirm({ prefilledData }: { prefilledData: HealthScoreInput }) {
  const { watch, register, setValue, formState: { errors } } = useFormContext<LeadFormInput>();
  const values = watch();

  const showFullCareer =
    prefilledData.jobCategory !== 'Studente' &&
    prefilledData.jobCategory !== 'Disoccupato';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black mb-2">Tutto pronto!</h2>
        <p className="text-muted-foreground">
          Controlla i tuoi dati prima di inviare la richiesta di sessione gratuita.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dati personali */}
        <Section title="Anagrafica" icon={<User className="w-3.5 h-3.5" />}>
          <Row label="Nome" value={`${values.firstName} ${values.lastName}`} />
          <Row label="Email" value={values.email} />
          <Row label="Telefono" value={values.phone} />
          <Row label="Orario preferito" value={values.contactTime} />
        </Section>

        {/* Carriera */}
        <Section title="Carriera" icon={<Briefcase className="w-3.5 h-3.5" />}>
          {showFullCareer && (
            <>
              <Row label="Ruolo" value={values.jobTitle} />
              <Row label="Anzianità" value={values.jobTenure} />
            </>
          )}
          <Row
            label="Reddito lordo annuo"
            value={values.grossAnnualIncome ? fmt(values.grossAnnualIncome) : undefined}
          />
          <Row label="Obiettivo" value={values.careerGoal} />
        </Section>
      </div>

      {/* Dati Health Score */}
      <Section title="Dati dal tuo Health Score" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
          <Row label="Età" value={`${prefilledData.age} anni`} />
          <Row label="Comune" value={prefilledData.comune} />
          <Row label="Categoria" value={prefilledData.jobCategory} />
          <Row label="Situazione abitativa" value={prefilledData.housingStatus} />
          <Row label="Reddito netto mensile" value={fmt(prefilledData.monthlyNetIncome)} />
          <Row label="Spese fisse mensili" value={fmt(prefilledData.monthlyFixedExpenses)} />
          <Row
            label="Liquidità Immediata"
            value={fmt(prefilledData.liquidCash)}
            icon={<Wallet className="w-3 h-3 text-blue-500" />}
          />
          <Row
            label="Investimenti"
            value={fmt(prefilledData.investments)}
            icon={<TrendingUp className="w-3 h-3 text-emerald-500" />}
          />
          <Row
            label="Debito al consumo"
            value={prefilledData.consumerDebt > 0 ? fmt(prefilledData.consumerDebt) : 'Nessuno'}
          />
        </div>
      </Section>

      {/* Strategia */}
      <Section title="Strategia finanziaria" icon={<Target className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
          <Row label="Gestione TFR" value={values.tfrManagement} />
          <Row label="Tolleranza al rischio" value={values.riskTolerance} />
          <Row label="Obiettivo principale" value={values.primaryFinancialGoal} />
          <Row
            label="Assicurazioni"
            value={values.activeInsurances?.length > 0 ? values.activeInsurances.join(', ') : 'Nessuna'}
          />
        </div>
      </Section>

      {/* ==========================================
          DOMANDA: CONSULENZA IN PRESENZA O ONLINE?
          
          Posizionata qui — dopo il riepilogo dati ma
          prima dei consensi — perché è una preferenza
          logistica, non un dato personale. L'utente
          ha già capito cosa sta richiedendo e può
          rispondere con consapevolezza.
          
          Il valore viene salvato in lead.accepts_online
          e usato dal sistema di matching per decidere
          se il lead è visibile solo ai consulenti della
          sua provincia o a tutti i consulenti attivi.
      ========================================== */}
      <div className="border-2 border-border rounded-[2rem] p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-indigo-500" />
            Come preferisci ricevere la consulenza?
          </h3>
          <p className="text-sm text-muted-foreground">
            Ci aiuta a trovare il professionista più adatto a te.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Solo in presenza */}
          <label className="cursor-pointer">
            <input
              type="radio"
              value="false"
              {...register('acceptsOnline')}
              className="peer sr-only"
            />
            <div className="flex items-center gap-3 p-4 border-2 border-border rounded-2xl transition-all
                            peer-checked:border-indigo-500 peer-checked:bg-indigo-50
                            dark:peer-checked:bg-indigo-900/20 dark:peer-checked:border-indigo-400
                            hover:bg-secondary">
              <MapPin className="w-5 h-5 text-muted-foreground peer-checked:text-indigo-500 shrink-0" />
              <div>
                <p className="font-bold text-sm">Solo in presenza</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preferisco incontrare il consulente di persona nella mia zona
                </p>
              </div>
            </div>
          </label>

          {/* Anche online */}
          <label className="cursor-pointer">
            <input
              type="radio"
              value="true"
              {...register('acceptsOnline')}
              className="peer sr-only"
            />
            <div className="flex items-center gap-3 p-4 border-2 border-border rounded-2xl transition-all
                            peer-checked:border-indigo-500 peer-checked:bg-indigo-50
                            dark:peer-checked:bg-indigo-900/20 dark:peer-checked:border-indigo-400
                            hover:bg-secondary">
              <Video className="w-5 h-5 text-muted-foreground peer-checked:text-indigo-500 shrink-0" />
              <div>
                <p className="font-bold text-sm">Anche online</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Va bene anche una videochiamata — amplia le possibilità di match
                </p>
              </div>
            </div>
          </label>
        </div>

        {errors.acceptsOnline && (
          <p className="text-sm font-bold text-red-500">{errors.acceptsOnline.message}</p>
        )}
      </div>

      {/* Consenso sessione */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-[2rem] p-6 flex items-start gap-4">
        <div className="bg-emerald-600 rounded-full p-2 mt-0.5">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
            Sessione Strategica Gratuita
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mt-1 leading-relaxed">
            Un consulente verificato della nostra rete analizzerà il tuo report Health Score
            per costruire un piano d'azione. Verrai ricontattato entro 48 ore lavorative.
          </p>
        </div>
      </div>
    </div>
  );
}