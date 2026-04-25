'use client';

import { useFormContext } from 'react-hook-form';
import type { LeadFormInput } from '@/lib/schemas/lead-schema';
import { User, Mail, Phone, Clock, Users, Baby, FileText } from 'lucide-react';

export default function Step1Personal() {
  const { register, formState: { errors } } = useFormContext<LeadFormInput>();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" /> Nome
          </label>
          <input
            type="text"
            placeholder="es. Mario"
            {...register('firstName')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.firstName ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.firstName && <p className="mt-2 text-sm font-bold text-red-500">{errors.firstName.message}</p>}
        </div>

        {/* Cognome */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" /> Cognome
          </label>
          <input
            type="text"
            placeholder="es. Rossi"
            {...register('lastName')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.lastName ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.lastName && <p className="mt-2 text-sm font-bold text-red-500">{errors.lastName.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-500" /> Email
          </label>
          <input
            type="email"
            placeholder="mario.rossi@email.com"
            {...register('email')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.email ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.email && <p className="mt-2 text-sm font-bold text-red-500">{errors.email.message}</p>}
        </div>

        {/* Telefono */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-500" /> Telefono
          </label>
          <input
            type="tel"
            placeholder="+39 333 1234567"
            {...register('phone')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.phone ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.phone && <p className="mt-2 text-sm font-bold text-red-500">{errors.phone.message}</p>}
        </div>
      </div>

      <hr className="border-border my-6" />

      {/* Preferenza Contatto */}
      <div>
        <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500" /> Fascia oraria preferita per essere contattato
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["Mattina", "Pausa Pranzo", "Pomeriggio", "Sera", "Solo Email"].map((time) => (
            <label key={time} className="cursor-pointer">
              <input type="radio" value={time} {...register('contactTime')} className="peer sr-only" />
              <div className="text-center p-3 border-2 border-border rounded-xl font-medium text-sm text-muted-foreground hover:bg-secondary peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 dark:peer-checked:bg-emerald-900/20 dark:peer-checked:text-emerald-300 transition-all">
                {time}
              </div>
            </label>
          ))}
        </div>
        {errors.contactTime && <p className="mt-2 text-sm font-bold text-red-500">{errors.contactTime.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Stato Civile */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Stato Civile
          </label>
          <select
            {...register('maritalStatus')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.maritalStatus ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona...</option>
            <option value="Single">Single</option>
            <option value="Convivente">Convivente</option>
            <option value="Sposato/a">Sposato/a</option>
            <option value="Divorziato/a">Divorziato/a / Separato/a</option>
          </select>
          {errors.maritalStatus && <p className="mt-2 text-sm font-bold text-red-500">{errors.maritalStatus.message}</p>}
        </div>

        {/* Figli */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Baby className="w-4 h-4 text-emerald-500" /> Figli a carico
          </label>
          <input
            type="number"
            min="0"
            {...register('dependents', { valueAsNumber: true })}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.dependents ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.dependents && <p className="mt-2 text-sm font-bold text-red-500">{errors.dependents.message}</p>}
        </div>

        {/* Dichiarazione Redditi */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Dichiarazione Redditi
          </label>
          <select
            {...register('taxFiling')}
            className={`w-full p-4 border-2 rounded-2xl font-medium bg-secondary/30 focus:bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.taxFiling ? 'border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona...</option>
            <option value="730 / Modello Redditi">Sì, 730 o Modello Redditi</option>
            <option value="Nessuna dichiarazione">No, nessuna dichiarazione</option>
            <option value="Non lo so">Non lo so</option>
          </select>
          {errors.taxFiling && <p className="mt-2 text-sm font-bold text-red-500">{errors.taxFiling.message}</p>}
        </div>
      </div>

    </div>
  );
}