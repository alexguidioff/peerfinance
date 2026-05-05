'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';

// Lista completa delle 107 province (ricerca istantanea lato client)
const PROVINCE = [
  { nome: "Agrigento", sigla: "ag" }, { nome: "Alessandria", sigla: "al" }, { nome: "Ancona", sigla: "an" }, { nome: "Aosta", sigla: "ao" }, { nome: "Arezzo", sigla: "ar" }, { nome: "Ascoli Piceno", sigla: "ap" }, { nome: "Asti", sigla: "at" }, { nome: "Avellino", sigla: "av" }, { nome: "Bari", sigla: "ba" }, { nome: "Barletta-Andria-Trani", sigla: "bt" }, { nome: "Belluno", sigla: "bl" }, { nome: "Benevento", sigla: "bn" }, { nome: "Bergamo", sigla: "bg" }, { nome: "Biella", sigla: "bi" }, { nome: "Bologna", sigla: "bo" }, { nome: "Bolzano", sigla: "bz" }, { nome: "Brescia", sigla: "bs" }, { nome: "Brindisi", sigla: "br" }, { nome: "Cagliari", sigla: "ca" }, { nome: "Caltanissetta", sigla: "cl" }, { nome: "Campobasso", sigla: "cb" }, { nome: "Caserta", sigla: "ce" }, { nome: "Catania", sigla: "ct" }, { nome: "Catanzaro", sigla: "cz" }, { nome: "Chieti", sigla: "ch" }, { nome: "Como", sigla: "co" }, { nome: "Cosenza", sigla: "cs" }, { nome: "Cremona", sigla: "cr" }, { nome: "Crotone", sigla: "kr" }, { nome: "Cuneo", sigla: "cn" }, { nome: "Enna", sigla: "en" }, { nome: "Fermo", sigla: "fm" }, { nome: "Ferrara", sigla: "fe" }, { nome: "Firenze", sigla: "fi" }, { nome: "Foggia", sigla: "fg" }, { nome: "Forlì-Cesena", sigla: "fc" }, { nome: "Frosinone", sigla: "fr" }, { nome: "Genova", sigla: "ge" }, { nome: "Gorizia", sigla: "go" }, { nome: "Grosseto", sigla: "gr" }, { nome: "Imperia", sigla: "im" }, { nome: "Isernia", sigla: "is" }, { nome: "L'Aquila", sigla: "aq" }, { nome: "La Spezia", sigla: "sp" }, { nome: "Latina", sigla: "lt" }, { nome: "Lecce", sigla: "le" }, { nome: "Lecco", sigla: "lc" }, { nome: "Livorno", sigla: "li" }, { nome: "Lodi", sigla: "lo" }, { nome: "Lucca", sigla: "lu" }, { nome: "Macerata", sigla: "mc" }, { nome: "Mantova", sigla: "mn" }, { nome: "Massa-Carrara", sigla: "ms" }, { nome: "Matera", sigla: "mt" }, { nome: "Messina", sigla: "me" }, { nome: "Milano", sigla: "mi" }, { nome: "Modena", sigla: "mo" }, { nome: "Monza e della Brianza", sigla: "mb" }, { nome: "Napoli", sigla: "na" }, { nome: "Novara", sigla: "no" }, { nome: "Nuoro", sigla: "nu" }, { nome: "Oristano", sigla: "or" }, { nome: "Padova", sigla: "pd" }, { nome: "Palermo", sigla: "pa" }, { nome: "Parma", sigla: "pr" }, { nome: "Pavia", sigla: "pv" }, { nome: "Perugia", sigla: "pg" }, { nome: "Pesaro e Urbino", sigla: "pu" }, { nome: "Pescara", sigla: "pe" }, { nome: "Piacenza", sigla: "pc" }, { nome: "Pisa", sigla: "pi" }, { nome: "Pistoia", sigla: "pt" }, { nome: "Pordenone", sigla: "pn" }, { nome: "Potenza", sigla: "pz" }, { nome: "Prato", sigla: "po" }, { nome: "Ragusa", sigla: "rg" }, { nome: "Ravenna", sigla: "ra" }, { nome: "Reggio Calabria", sigla: "rc" }, { nome: "Reggio Emilia", sigla: "re" }, { nome: "Rieti", sigla: "ri" }, { nome: "Rimini", sigla: "rn" }, { nome: "Roma", sigla: "rm" }, { nome: "Rovigo", sigla: "ro" }, { nome: "Salerno", sigla: "sa" }, { nome: "Sassari", sigla: "ss" }, { nome: "Savona", sigla: "sv" }, { nome: "Siena", sigla: "si" }, { nome: "Siracusa", sigla: "sr" }, { nome: "Sondrio", sigla: "so" }, { nome: "Sud Sardegna", sigla: "su" }, { nome: "Taranto", sigla: "ta" }, { nome: "Teramo", sigla: "te" }, { nome: "Terni", sigla: "tr" }, { nome: "Torino", sigla: "to" }, { nome: "Trapani", sigla: "tp" }, { nome: "Trento", sigla: "tn" }, { nome: "Treviso", sigla: "tv" }, { nome: "Trieste", sigla: "ts" }, { nome: "Udine", sigla: "ud" }, { nome: "Varese", sigla: "va" }, { nome: "Venezia", sigla: "ve" }, { nome: "Verbano-Cusio-Ossola", sigla: "vb" }, { nome: "Vercelli", sigla: "vc" }, { nome: "Verona", sigla: "vr" }, { nome: "Vibo Valentia", sigla: "vv" }, { nome: "Vicenza", sigla: "vi" }, { nome: "Viterbo", sigla: "vt" }
];

const SUGGESTED = [
  { nome: 'Milano', sigla: 'mi' },
  { nome: 'Roma', sigla: 'rm' },
  { nome: 'Torino', sigla: 'to' },
  { nome: 'Napoli', sigla: 'na' },
];

export default function SearchProvinceStipendi() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Chiudi il menu se l'utente clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtriamo la lista basandoci sull'input (limitiamo ai primi 5 risultati)
  const suggestions = searchQuery.trim().length > 0 
    ? PROVINCE.filter(p => 
        p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sigla.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSelect = (sigla: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/stipendi/${sigla}`);
  };

  return (
    <section>
      <div className="flex flex-col mb-8 gap-6 max-w-2xl mx-auto">
        
        {/* Barra di Ricerca con Autocomplete */}
        <div className="relative w-full" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
            <input
              type="text"
              placeholder="Cerca la tua provincia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-14 pr-4 py-4 bg-card border-2 border-border hover:border-indigo-300 focus:border-indigo-500 rounded-2xl outline-none transition-all text-lg font-bold shadow-lg"
            />
          </div>

          {/* Menu a tendina Autocomplete */}
          {showDropdown && searchQuery.trim().length > 0 && (
            <div className="absolute z-50 top-full mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
              {suggestions.length > 0 ? (
                <ul className="py-1">
                  {suggestions.map((s) => (
                    <li key={s.sigla}>
                      <button
                        type="button"
                        onClick={() => handleSelect(s.sigla)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary"
                      >
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold text-foreground text-base">{s.nome}</span>
                        <span className="ml-auto rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-1 text-xs font-black uppercase tracking-wider">
                          {s.sigla}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm font-medium text-muted-foreground">
                  Nessuna provincia trovata.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4 Province Suggerite Rapide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUGGESTED.map((prov) => (
            <Link
              key={prov.sigla}
              href={`/stipendi/${prov.sigla}`}
              className="bg-card border border-border rounded-xl p-4 text-center hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-800 transition-colors group shadow-sm"
            >
              <p className="font-bold text-foreground group-hover:text-indigo-600 transition-colors text-sm">{prov.nome}</p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}