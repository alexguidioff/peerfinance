"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Suggestion = {
  comune: string;
  sigla_provincia: string;
};

export default function SearchRedditi() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("mef_redditi_comuni")
        .select("comune, sigla_provincia")
        .ilike("comune", `${query}%`)
        .limit(6);

      if (data) setSuggestions(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Chiudi dropdown se clicchi fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (comune: string) => {
    // Trasforma "Milano" in "milano", "Reggio Emilia" in "reggio-emilia"
    const slug = encodeURIComponent(comune.toLowerCase().replace(/\s+/g, '-'));
    router.push(`/redditi/${slug}`);
  };

  return (
    <div className="max-w-2xl mx-auto relative" ref={containerRef}>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
          )}
        </div>
        <input
          type="text"
          placeholder="Cerca un comune per vedere gli stipendi medi..."
          className="w-full h-16 pl-14 pr-6 bg-card border-2 border-border rounded-2xl text-lg outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <ul className="divide-y divide-border">
            {suggestions.map((s) => (
              <li key={s.comune}>
                <button
                  onClick={() => handleSelect(s.comune)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold capitalize">{s.comune}</span>
                  </div>
                  <span className="text-xs font-black text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {s.sigla_provincia}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
