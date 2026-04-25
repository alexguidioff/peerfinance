'use client';

import { useFormContext } from 'react-hook-form';
import type { LeadFormInput } from '@/lib/schemas/lead-schema';
import type { HealthScoreInput } from '@/lib/schemas/health-score';
import { User, Briefcase, Target, ShieldCheck, CheckCircle2 } from 'lucide-react';

const fmt = (n: number) => '€' + Math.round(n).toLocaleString('it-IT');

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
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
  const { watch } = useFormContext<LeadFormInput>();
  const values = watch();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black mb-2">Tutto pronto!</h2>
        <p className="text-muted-foreground">
          Controlla i tuoi dati prima di inviare la richiesta di sessione gratuita.
        </p>
      </div>

      {/* Dati personali */}
      <Section title="Anagrafica" icon={<User className="w-3.5 h-3.5" />}>
        <Row label="Nome" value={`${values.firstName} ${values.lastName}`} />
        <Row label="Email" value={values.email} />
        <Row label="Telefono" value={values.phone} />
        <Row label="Orario preferito" value={values.contactTime} />
        <Row label="Stato civile" value={values.maritalStatus} />
        <Row label="Persone a carico" value={values.dependents} />
      </Section>

      {/* Carriera */}
      <Section title="Carriera" icon={<Briefcase className="w-3.5 h-3.5" />}>
        <Row label="Ruolo" value={values.jobTitle} />
        <Row label="Anzianità" value={values.jobTenure} />
        <Row label="Reddito lordo annuo" value={values.grossAnnualIncome ? fmt(values.grossAnnualIncome) : undefined} />
        <Row label="Obiettivo di carriera" value={values.careerGoal} />
      </Section>

      {/* Strategia */}
      <Section title="Strategia finanziaria" icon={<Target className="w-3.5 h-3.5" />}>
        <Row label="Gestione TFR" value={values.tfrManagement} />
        <Row label="Tolleranza al rischio" value={values.riskTolerance} />
        <Row label="Obiettivo principale" value={values.primaryFinancialGoal} />
        <Row
          label="Assicurazioni attive"
          value={values.activeInsurances?.length > 0 ? values.activeInsurances.join(', ') : 'Nessuna'}
        />
      </Section>

      {/* Dati dall'Health Score */}
      <Section title="Dati dal tuo Health Score" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
        <Row label="Età" value={`${prefilledData.age} anni`} />
        <Row label="Comune" value={prefilledData.comune} />
        <Row label="Categoria" value={prefilledData.jobCategory} />
        <Row label="Reddito netto mensile" value={fmt(prefilledData.monthlyNetIncome)} />
        <Row label="Spese fisse mensili" value={fmt(prefilledData.monthlyFixedExpenses)} />
        <Row label="Risparmi totali" value={fmt(prefilledData.totalSavings)} />
        <Row label="Debito al consumo" value={prefilledData.consumerDebt > 0 ? fmt(prefilledData.consumerDebt) : 'Nessuno'} />
        <Row label="Situazione abitativa" value={prefilledData.housingStatus} />
      </Section>

      {/* Consenso sessione */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
          Hai richiesto una{' '}
          <strong>Sessione Strategica Gratuita (valore €150)</strong> con un professionista
          verificato della nostra rete. Ti contatteremo entro 48 ore lavorative.
        </p>
      </div>
    </div>
  );
}