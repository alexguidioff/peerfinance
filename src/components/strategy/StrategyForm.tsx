'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadFormSchema, type LeadFormInput } from '@/lib/schemas/lead-schema';
import type { HealthScoreInput } from '@/lib/schemas/health-score';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

import Step1Personal from './steps/Step1Personal';
import Step2Career from './steps/Step2Career';
import Step3Strategy from './steps/Step3Strategy';
import StepConfirm from './steps/StepConfirm';

// ── Singleton Supabase ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STORAGE_KEY = 'strategy_form_draft';

const STEPS = [
  {
    id: 'step-1',
    title: 'Anagrafica',
    fields: ['firstName', 'lastName', 'email', 'phone', 'contactTime', 'maritalStatus', 'dependents', 'taxFiling'],
  },
  {
    id: 'step-2',
    title: 'Carriera',
    fields: ['jobTitle', 'jobTenure', 'jobSatisfaction', 'grossAnnualIncome', 'careerGoal'],
  },
  {
    id: 'step-3',
    title: 'Strategia',
    fields: ['tfrManagement', 'activeInsurances', 'riskTolerance', 'primaryFinancialGoal', 'privacyConsent', 'partnerConsent'],
  },
  {
    id: 'step-4',
    title: 'Conferma',
    fields: [],
  },
] as const;

export default function StrategyForm({ prefilledData }: { prefilledData: HealthScoreInput }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reddito lordo stimato pre-compilato dall'Health Score
  const estimatedGrossAnnual = Math.round((prefilledData.monthlyNetIncome * 12) / 0.70);

  const methods = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      contactTime: undefined,
      maritalStatus: undefined,
      dependents: 0,
      taxFiling: undefined,
      jobTitle: '',
      jobTenure: undefined,
      jobSatisfaction: 5,
      grossAnnualIncome: estimatedGrossAnnual, // ← pre-compilato
      careerGoal: undefined,
      tfrManagement: undefined,
      activeInsurances: [],
      riskTolerance: undefined,
      primaryFinancialGoal: undefined,
      privacyConsent: false,
      partnerConsent: true, // ← true di default: chi compila questo form vuole la consulenza
    } as any,
  });

  const { trigger, handleSubmit, watch, reset, getValues } = methods;

  // ── Persistenza localStorage ──────────────────────────────────────────────
  // Ripristina bozza salvata
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset({ ...getValues(), ...parsed });
      }
    } catch {
      // ignora errori di parsing
    }
  }, [getValues, reset]);

  // Salva bozza ad ogni cambio
  useEffect(() => {
    const sub = watch((values) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch { /* quota exceeded, ignora */ }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  // ── Navigazione ───────────────────────────────────────────────────────────
  const nextStep = async () => {
    if (currentStep === STEPS.length - 1) return; // step conferma non va avanti
    const fieldsToValidate = STEPS[currentStep].fields as any;
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((p) => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit: SubmitHandler<LeadFormInput> = async (data) => {
    setIsSubmitting(true);

    const { error } = await supabase.from('leads').insert([{
      first_name:             data.firstName,
      last_name:              data.lastName,
      email:                  data.email,
      phone:                  data.phone,
      contact_time:           data.contactTime,
      marital_status:         data.maritalStatus,
      dependents:             data.dependents,
      tax_filing:             data.taxFiling,
      job_title:              data.jobTitle,
      job_tenure:             data.jobTenure,
      job_satisfaction:       data.jobSatisfaction,
      gross_annual_income:    data.grossAnnualIncome,
      career_goal:            data.careerGoal,
      tfr_management:         data.tfrManagement,
      active_insurances:      data.activeInsurances,
      risk_tolerance:         data.riskTolerance,
      primary_financial_goal: data.primaryFinancialGoal,
      privacy_consent:        data.privacyConsent,
      partner_consent:        data.partnerConsent,
      
      // Dati ereditati dall'Health Score (AGGIORNATI)
      age:                    prefilledData.age,
      comune:                 prefilledData.comune,
      job_category:           prefilledData.jobCategory,
      monthly_net_income:     prefilledData.monthlyNetIncome,
      monthly_fixed_expenses: prefilledData.monthlyFixedExpenses,
      liquid_cash:            prefilledData.liquidCash,    // ← Nuovo campo
      investments:            prefilledData.investments,   // ← Nuovo campo
      consumer_debt:          prefilledData.consumerDebt,
      housing_status:         prefilledData.housingStatus,
    }]);

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setSubmitError("C'è stato un errore durante l'invio. Riprova tra qualche secondo.");
      return;
    }

    // Pulizia bozza e redirect a thank-you page
    localStorage.removeItem(STORAGE_KEY);
    router.push('/grazie');
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="bg-card rounded-[2.5rem] shadow-xl border border-border p-8 md:p-10">

      {/* Barra progresso */}
      <div className="mb-8">
        <div className="flex gap-2 mb-3">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out rounded-full ${
                  idx < currentStep ? 'bg-emerald-500' :
                  idx === currentStep ? 'bg-emerald-400' : 'bg-transparent'
                }`}
                style={{ width: idx <= currentStep ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Step {currentStep + 1} di {STEPS.length}: {STEPS[currentStep].title}
          </h2>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {Math.round(((currentStep) / STEPS.length) * 100)}% completato
          </span>
        </div>
      </div>

      <FormProvider {...methods}>
        <div className="space-y-8">

          {/* Step content */}
          <div className={currentStep === 0 ? 'block' : 'hidden'}><Step1Personal /></div>
          <div className={currentStep === 1 ? 'block' : 'hidden'}>
          <Step2Career 
        estimatedGrossAnnual={estimatedGrossAnnual} 
        jobCategory={prefilledData.jobCategory} // Usa prefilledData.jobCategory
      />
    </div>
          <div className={currentStep === 2 ? 'block' : 'hidden'}><Step3Strategy /></div>
          <div className={currentStep === 3 ? 'block' : 'hidden'}>
            <StepConfirm prefilledData={prefilledData} />
          </div>

          {/* Errore submit */}
          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-2xl px-6 py-4 text-sm font-medium">
              {submitError}
            </div>
          )}

          {/* Navigazione */}
          <div className="flex gap-4 pt-8 border-t border-border mt-8">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-4 border-2 border-border text-muted-foreground font-bold rounded-2xl hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Indietro
              </button>
            )}

            {!isLastStep ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25 ml-auto flex items-center gap-2"
              >
                Continua <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25 ml-auto flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Invio in corso…
                  </>
                ) : (
                  <>
                    Richiedi la Sessione Gratuita <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </FormProvider>
    </div>
  );
}