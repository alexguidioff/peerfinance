"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, TrendingUp, MapPin } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Inizializza Supabase client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Tipo per i risultati della ricerca
type Suggestion = {
  comune: string;
  sigla_provincia: string;
};

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Ref per chiudere il dropdown se si clicca fuori
  const searchRef = useRef<HTMLDivElement>(null);

  // Effetto per il Debouncing e la chiamata API a Supabase
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Se l'input è vuoto o troppo corto, chiudi il dropdown
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      setShowDropdown(true);

      // Cerca su Supabase usando "ilike" (case insensitive)
      const { data, error } = await supabase
        .from("mef_redditi_comuni")
        .select("comune, sigla_provincia")
        .ilike("comune", `${searchQuery}%`) // Cerca i comuni che INIZIANO con l'input
        .limit(5); // Mostra solo i primi 5 risultati

      if (!error && data) {
        setSuggestions(data);
      }
      setIsLoading(false);
    };

    // DEBOUNCER: Aspetta 300ms prima di fare la chiamata
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    // Cleanup se l'utente continua a digitare prima dei 300ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Gestione clic fuori dalla barra di ricerca per chiudere il dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gestione della selezione di un comune dal dropdown
  const handleSelectComune = (comuneSelezionato: string) => {
    const formattedQuery = encodeURIComponent(comuneSelezionato.toLowerCase());
    setSearchQuery("");
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    router.push(`/stipendio/${formattedQuery}`);
  };

  // Se l'utente preme invio invece di cliccare, prendiamo il primo risultato
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectComune(suggestions[0].comune);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 md:px-10">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Peerfinance
          </span>
        </Link>

        {/* MENU E SEARCH (DESKTOP) */}
        <div className="hidden md:flex md:items-center md:gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
    {/* I tuoi nuovi link */}
    <Link href="/redditi" className="transition-colors hover:text-foreground">Redditi</Link>
    <Link href="/immobiliare" className="transition-colors hover:text-foreground">Immobiliare</Link>
    <Link href="/demografia" className="transition-colors hover:text-foreground">Demografia</Link>
    <Link href="/score" className="transition-colors hover:text-foreground">Health Score</Link>
  </div>


          {/* SEARCHBAR CON AUTOCOMPLETE */}
          <div className="relative" ref={searchRef}>
            <form onSubmit={handleSubmit}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca il tuo comune..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                className="h-10 w-64 rounded-full border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                autoComplete="off"
              />
            </form>

            {/* DROPDOWN RISULTATI DESKTOP */}
            {showDropdown && (
              <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Ricerca in corso...</div>
                ) : suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((sugg) => (
                      <li key={sugg.comune}>
                        <button
                          onClick={() => handleSelectComune(sugg.comune)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize font-medium text-foreground">{sugg.comune}</span>
                          <span className="ml-auto text-xs text-muted-foreground uppercase">{sugg.sigla_provincia}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">Nessun comune trovato</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* HAMBURGER MENU (MOBILE) */}
        <button 
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* DROPDOWN MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="relative mb-4">
            <form onSubmit={handleSubmit}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca comune (es. Milano)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:bg-background"
                autoComplete="off"
              />
            </form>
            
            {/* DROPDOWN RISULTATI MOBILE (INLINE) */}
            {searchQuery.length >= 2 && (
              <div className="mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-sm">
                {isLoading ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">Ricerca...</div>
                ) : suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((sugg) => (
                      <li key={sugg.comune}>
                        <button
                          onClick={() => handleSelectComune(sugg.comune)}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-secondary border-b border-border last:border-0"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize font-medium text-foreground">{sugg.comune}</span>
                          <span className="ml-auto text-xs text-muted-foreground uppercase">{sugg.sigla_provincia}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-sm text-muted-foreground">Nessun comune trovato</div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 text-base font-medium text-muted-foreground border-t border-border pt-4">
            <Link href="/score" onClick={() => setIsMobileMenuOpen(false)}>Health Score</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
