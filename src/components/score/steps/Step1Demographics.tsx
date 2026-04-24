// components/score/steps/Step1Demographics.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import type { HealthScoreInput } from '@/lib/schemas/health-score';

export default function Step1Demographics() {
  const { register, formState: { errors } } = useFormContext<HealthScoreInput>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Iniziamo da te</h2>
        <p className="text-slate-500">Questi dati ci servono per confrontare la tua situazione con i benchmark ISTAT dei tuoi coetanei.</p>
      </div>

      <div className="space-y-4">
        {/* Campo Età */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-1">
            Quanti anni hai?
          </label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            placeholder="es. 30"
            {...register('age')}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors ${
              errors.age ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
          )}
        </div>

        {/* Campo Regione */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-1">
            In quale area vivi?
          </label>
          <select
            id="region"
            {...register('region')}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors bg-white ${
              errors.region ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          >
            <option value="">Seleziona un'area</option>
            <option value="Nord">Nord Italia</option>
            <option value="Centro">Centro Italia</option>
            <option value="Sud">Sud Italia</option>
            <option value="Isole">Isole</option>
          </select>
          {errors.region && (
            <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}