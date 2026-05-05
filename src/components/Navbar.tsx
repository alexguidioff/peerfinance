"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Suggestion = {
  comune: string;
  sigla_provincia: string;
};

const formatComuneName = (name: string) =>
  name
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function CashflowScoreLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <svg
          viewBox="0 0 32 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-auto"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M0,10 L7,10 L10,14 L13,2 L16,18 L19,10 L32,10"
            stroke="white"
            strokeWidth="2.2"
            fill="none"
          />
        </svg>
      </span>
      <span className="text-xl tracking-tight text-foreground">
        <span className="font-medium">Cashflow</span>
        <span className="font-extrabold">Score</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      setShowDropdown(true);

      const { data, error } = await supabase
        .from("mef_redditi_comuni")
        .select("comune, sigla_provincia")
        .ilike("comune", `%${searchQuery}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(
          data.map((item) => ({ ...item, comune: formatComuneName(item.comune) }))
        );
      }
      setIsLoading(false);
    };

    const id = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectComune = (comune: string) => {
    router.push(`/redditi/${encodeURIComponent(comune.toLowerCase())}`);
    setSearchQuery("");
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) handleSelectComune(suggestions[0].comune);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 md:px-10">

        {/* LOGO */}
        <Link href="/" className="transition-opacity hover:opacity-80">
          <CashflowScoreLogo />
        </Link>

        {/* DESKTOP: nav links + search */}
        <div className="hidden md:flex md:items-center md:gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/redditi" className="transition-colors hover:text-foreground">Redditi</Link>
            {/* NUOVO LINK STIPENDI QUI */}
            <Link href="/stipendi" className="transition-colors hover:text-foreground">Stipendi</Link>
            <Link href="/immobiliare" className="transition-colors hover:text-foreground">Immobiliare</Link>
            <Link href="/demografia" className="transition-colors hover:text-foreground">Demografia</Link>
            <Link href="/score" className="transition-colors hover:text-foreground">Health Score</Link>
          </div>

          {/* Searchbar con autocomplete */}
          <div className="relative" ref={searchRef}>
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca il tuo comune..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                className="h-10 w-64 rounded-full border border-border bg-secondary/50 py-2 pl-10 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                autoComplete="off"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
              )}
            </form>

            {showDropdown && (
              <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                {suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((s) => (
                      <li key={s.comune}>
                        <button
                          onClick={() => handleSelectComune(s.comune)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{s.comune}</span>
                          <span className="ml-auto rounded-md bg-secondary px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                            {s.sigla_provincia}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : !isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nessun comune trovato
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE: hamburger */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="relative mb-4">
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca comune (es. Milano)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 py-2 pl-10 pr-10 text-sm text-foreground outline-none focus:border-primary focus:bg-background"
                autoComplete="off"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
              )}
            </form>

            {searchQuery.length >= 2 && (
              <div className="mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-sm">
                {suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((s) => (
                      <li key={s.comune}>
                        <button
                          onClick={() => handleSelectComune(s.comune)}
                          className="flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{s.comune}</span>
                          <span className="ml-auto rounded-md bg-secondary px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                            {s.sigla_provincia}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : !isLoading ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    Nessun comune trovato
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-4 text-base font-medium text-muted-foreground">
            <Link href="/redditi" onClick={() => setIsMobileMenuOpen(false)}>Redditi</Link>
            {/* NUOVO LINK STIPENDI QUI PER MOBILE */}
            <Link href="/stipendi" onClick={() => setIsMobileMenuOpen(false)}>Stipendi</Link>
            <Link href="/immobiliare" onClick={() => setIsMobileMenuOpen(false)}>Immobiliare</Link>
            <Link href="/demografia" onClick={() => setIsMobileMenuOpen(false)}>Demografia</Link>
            <Link href="/score" onClick={() => setIsMobileMenuOpen(false)}>Health Score</Link>
          </div>
        </div>
      )}
    </nav>
  );
}