"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Search, MapPin, Loader2 } from 'lucide-react';

// Singleton fuori dal componente — evita istanze multiple ad ogni render
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SearchImmobiliare() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchComuni = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);

      // Tentativo 1: ricerca normale su quello che ha scritto l'utente
      let { data, error } = await supabase
        .from('mef_redditi_comuni')
        .select('comune, sigla_provincia, comune_slug')
        .ilike('comune', `${query}%`)
        .limit(5);

      // Tentativo 2: se non trova nulla, cerca per slug
      // (es. utente scrive "sanremo" senza spazio)
      if (!error && (!data || data.length === 0)) {
        const querySlug = query.toLowerCase().replace(/[^a-z0-9]/g, '');
        const { data: retryData } = await supabase
          .from('mef_redditi_comuni')
          .select('comune, sigla_provincia, comune_slug')
          .ilike('comune_slug', `${querySlug}%`)
          .limit(5);
        data = retryData;
      }

      if (!error && data) {
        setResults(data);
        setIsOpen(true);
      }
      setIsLoading(false);
    };

    const timeoutId = setTimeout(searchComuni, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (comuneSlug: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/immobiliare/${comuneSlug}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto z-50">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Cerca un comune (es. Milano, Roma...)"
          className="w-full h-16 pl-12 pr-12 rounded-2xl border bg-card shadow-xl focus:ring-2 focus:ring-primary outline-none text-lg transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {results.map((r) => (
            <button
              key={`${r.comune_slug}-${r.sigla_provincia}`}
              onClick={() => handleSelect(r.comune_slug)}
              className="w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-secondary transition-colors border-b last:border-0"
            >
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-foreground">{r.comune}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {r.sigla_provincia}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
