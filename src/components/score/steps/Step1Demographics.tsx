'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { HealthScoreInput } from '@/lib/schemas/health-score';
import { MapPin, User, Briefcase, Search, ChevronDown, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Inizializza Supabase (assicurati di avere le env variables nel file .env.local)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Step1Demographics() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<HealthScoreInput>();
  
  // Stati per la tendina di ricerca
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredComuni, setFilteredComuni] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedComune = watch('comune');

  // Chiude la tendina se clicchi fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Query live a Supabase con Debounce (300ms)
  useEffect(() => {
    // Evita query inutili se la stringa è troppo corta o se coincide col comune già selezionato
    if (searchTerm.length < 2 || searchTerm === selectedComune) {
      setFilteredComuni([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    const delayDebounceFn = setTimeout(async () => {
      const { data, error } = await supabase
        .from('mef_redditi_comuni')
        .select('comune')
        .ilike('comune', `%${searchTerm}%`)
        .limit(10); // Ne mostriamo max 10 per non intasare la UI

      if (data && !error) {
        // Estraiamo i nomi e li mettiamo in formato Capitalize (es: "MILANO" -> "Milano")
        const comuniFormattati = data.map(d => 
          d.comune.charAt(0).toUpperCase() + d.comune.slice(1).toLowerCase()
        );
        setFilteredComuni(comuniFormattati);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedComune]);

  const handleSelectComune = (comune: string) => {
    setValue('comune', comune, { shouldValidate: true });
    setSearchTerm(comune);
    setIsOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-foreground mb-3">Identikit Finanziario</h2>
        <p className="text-muted-foreground text-lg">
          Questi dati ci servono per confrontare la tua situazione con i benchmark ISTAT e MEF dei tuoi esatti coetanei e concittadini.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Campo Età */}
        <div className="relative">
          <label htmlFor="age" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" /> Quanti anni hai?
          </label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            placeholder="es. 30"
            {...register('age')}
            className={`w-full p-4 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
              errors.age ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          />
          {errors.age && <p className="mt-2 text-sm font-bold text-red-500">{errors.age.message}</p>}
        </div>

        {/* CAMPO COMUNE COLLEGATO A SUPABASE */}
        <div className="relative" ref={wrapperRef}>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" /> Comune di residenza
          </label>
          
          <input type="hidden" {...register('comune')} />
          
          <div className="relative">
            <input
              type="text"
              placeholder="Inizia a digitare il tuo comune..."
              value={isOpen ? searchTerm : (selectedComune || searchTerm)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
                if (e.target.value === '') setValue('comune', '', { shouldValidate: true });
              }}
              onFocus={() => setIsOpen(true)}
              className={`w-full p-4 pl-12 pr-12 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all ${
                errors.comune ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
              }`}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            
            {/* Animazione di caricamento quando interroga il DB */}
            {isSearching ? (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-spin" />
            ) : (
              <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>

          {/* Risultati da Supabase */}
          {isOpen && searchTerm.length >= 2 && (
            <ul className="absolute z-50 w-full mt-2 bg-card border-2 border-border rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2">
              {filteredComuni.length > 0 ? (
                filteredComuni.map((comune) => (
                  <li
                    key={comune}
                    onClick={() => handleSelectComune(comune)}
                    className="px-4 py-3 cursor-pointer rounded-xl font-medium text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    {comune}
                  </li>
                ))
              ) : (
                !isSearching && <li className="px-4 py-3 text-muted-foreground text-center">Nessun comune trovato nel database MEF</li>
              )}
            </ul>
          )}
          {errors.comune && <p className="mt-2 text-sm font-bold text-red-500">{errors.comune.message}</p>}
        </div>

        {/* Campo Lavoro */}
        <div className="relative">
          <label htmlFor="jobCategory" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-500" /> Categoria lavorativa
          </label>
          <select
            id="jobCategory"
            {...register('jobCategory')}
            className={`w-full p-4 border-2 rounded-2xl text-lg font-medium bg-card focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all appearance-none cursor-pointer ${
              errors.jobCategory ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-emerald-500'
            }`}
          >
            <option value="">Seleziona la tua categoria...</option>
            <option value="Dipendente">Lavoratore Dipendente</option>
            <option value="Autonomo">Lavoratore Autonomo / P.IVA</option>
            <option value="Pensionato">Pensionato</option>
            <option value="Disoccupato">Non occupato / Studente</option>
          </select>
          {errors.jobCategory && <p className="mt-2 text-sm font-bold text-red-500">{errors.jobCategory.message}</p>}
        </div>

      </div>
    </div>
  );
}
