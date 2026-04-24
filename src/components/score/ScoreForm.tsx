// components/score/ScoreForm.tsx
'use client';

import { useState } from 'react';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { healthScoreSchema, type HealthScoreInput } from '@/lib/schemas/health-score';
import { useRouter } from 'next/navigation';

import Step1Demographics from './steps/Step1Demographics';
import Step2Cashflow from './steps/Step2Cashflow';
import Step3Wealth from './steps/Step3Wealth';

const STEPS = [
  { id: 'step-1', fields: ['age', 'region'] },
  { id: 'step-2', fields: ['monthlyNetIncome', 'monthlyFixedExpenses'] },
  { id: 'step-3', fields: ['totalSavings', 'consumerDebt'] },
] as const;

export default function ScoreForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // FIX TypeScript: Aggiunto "as any" per bypassare il conflitto di z.coerce
  const methods = useForm<HealthScoreInput>({
    resolver: zodResolver(healthScoreSchema) as any, 
    mode: 'onTouched',
    defaultValues: {
      age: undefined,
      region: undefined,
      monthlyNetIncome: undefined,
      monthlyFixedExpenses: undefined,
      totalSavings: undefined,
      consumerDebt: undefined,
    } as any, // FIX TypeScript: Permettiamo undefined come stato iniziale
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

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // FIX TypeScript: Tipizzato esplicitamente come SubmitHandler
  const onSubmit: SubmitHandler<HealthScoreInput> = async (data) => {
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    router.push(`/report?d=${encoded}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentStep < STEPS.length - 1) {
        nextStep();
      } else {
        handleSubmit(onSubmit)();
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-500 font-medium mb-2">
          <span>Step {currentStep + 1} di {STEPS.length}</span>
          <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <FormProvider {...methods}>
        <div onKeyDown={handleKeyDown} className="space-y-6">
          
          {/* Render Condizionale degli Step */}
          {currentStep === 0 && <Step1Demographics />}
          {currentStep === 1 && <Step2Cashflow />}
          {currentStep === 2 && <Step3Wealth />}

          {/* Navigazione */}
          <div className="flex gap-4 pt-6 border-t border-slate-100">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors w-full md:w-auto"
              >
                Indietro
              </button>
            )}
            
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto ml-auto"
              >
                Continua
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors w-full md:w-auto ml-auto"
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