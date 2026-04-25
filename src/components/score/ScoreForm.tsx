'use client';

import { useState } from 'react';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { healthScoreSchema, type HealthScoreInput } from '@/lib/schemas/health-score';
import { useRouter } from 'next/navigation';

import Step1Demographics from './steps/Step1Demographics';
import Step2Cashflow from './steps/Step2Cashflow';
import Step3Wealth from './steps/Step3Wealth';

// AGGIORNATO CON I NUOVI CAMPI DELLO SCHEMA ZOD
const STEPS = [
  { id: 'step-1', fields: ['age', 'comune', 'jobCategory'] },
  { id: 'step-2', fields: ['monthlyNetIncome', 'monthlyFixedExpenses'] },
  { id: 'step-3', fields: ['totalSavings', 'consumerDebt', 'housingStatus'] },
] as const;

export default function ScoreForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<HealthScoreInput>({
    resolver: zodResolver(healthScoreSchema) as any, 
    mode: 'onTouched',
    defaultValues: {
      age: undefined,
      comune: '',
      jobCategory: undefined,
      monthlyNetIncome: undefined,
      monthlyFixedExpenses: undefined,
      totalSavings: undefined,
      consumerDebt: undefined,
      housingStatus: undefined,
    } as any, 
  });

  const { trigger, handleSubmit } = methods;

  const nextStep = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const fieldsToValidate = STEPS[currentStep].fields as any;
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const onSubmit: SubmitHandler<HealthScoreInput> = async (data) => {
    // Passiamo i dati codificati all'URL della pagina report
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    router.push(`/report?d=${encoded}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentStep < STEPS.length - 1) nextStep();
      else handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-card p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-border">
      {/* Progress Bar Premium */}
      <div className="mb-10">
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          <span>Step {currentStep + 1} di {STEPS.length}</span>
          <span className="text-emerald-600">{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <FormProvider {...methods}>
        <div onKeyDown={handleKeyDown} className="space-y-8">
          
          {/* Render Condizionale degli Step */}
          {currentStep === 0 && <Step1Demographics />}
          {currentStep === 1 && <Step2Cashflow />}
          {currentStep === 2 && <Step3Wealth />}

          {/* Navigazione */}
          <div className="flex gap-4 pt-8 border-t border-border mt-8">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-4 border-2 border-border text-muted-foreground font-bold rounded-2xl hover:bg-secondary transition-colors w-full md:w-auto"
              >
                Indietro
              </button>
            )}
            
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25 w-full md:w-auto ml-auto"
              >
                Continua
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25 w-full md:w-auto ml-auto"
              >
                Calcola il mio Score
              </button>
            )}
          </div>
        </div>
      </FormProvider>
    </div>
  );
}
