'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  MapPin, 
  UserCircle, 
  TrendingUp, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Search,
  Loader2,
  Target
} from 'lucide-react';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Inquadramento = 'Operaio' | 'Impiegato' | 'Quadro' | 'Dirigente' | 'Apprendista';

type Suggestion = {
  comune: string;
  sigla_provincia: string;
};

const formatComuneName = (name: string) =>
  name.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const fmt = (n: number) => '€' + Math.round(n).toLocaleString('it-IT');

export default function StipendiPage() {
  const [loading, setLoading] = useState(false);
  
  // Dati calcolati pronti per la visualizzazione
  const [results, setResults] = useState<{
    localAvg: number;
    ageAvg: number;
    userRal: number;
    localGap: number;
    ageGap: number;
    isJunior: boolean;
  } | null>(null);

  const [formData, setFormData] = useState({
    comuneScelto: '',      
    provinciaScelta: '',   
    inquadramento: '' as Inquadramento,
    ageGroup: '',
    userRal: ''
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingComune, setIsLoadingComune] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // --- AUTOCOMPLETE ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery === formData.comuneScelto) return;
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      setIsLoadingComune(true);
      setShowDropdown(true);

      const { data, error } = await supabase
        .from("mef_redditi_comuni")
        .select("comune, sigla_provincia")
        .ilike("comune", `%${searchQuery}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(data.map((item) => ({ ...item, comune: formatComuneName(item.comune) })));
      }
      setIsLoadingComune(false);
    };

    const id = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(id);
  }, [searchQuery, formData.comuneScelto]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectComune = (s: Suggestion) => {
    setSearchQuery(s.comune);
    setFormData({ ...formData, comuneScelto: s.comune, provinciaScelta: s.sigla_provincia });
    setShowDropdown(false);
  };

  // --- SUBMIT E CALCOLO MOTORE LOGICO ---
  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provinciaScelta) {
      alert("Seleziona un comune valido dall'elenco a tendina.");
      return;
    }

    setLoading(true);
    
    // TODO: Sostituire con query vere a Supabase
    setTimeout(() => {
      const mockLocalAvg = 37458; // Es. Impiegato a MI
      const mockAgeAvg = 30722;   // Es. Impiegato 25-29 in IT
      const userRalNum = Number(formData.userRal);

      const isJunior = ['Fino a 19', '20 - 24', '25 - 29', '30 - 34'].includes(formData.ageGroup);
      
      const localGap = ((userRalNum - mockLocalAvg) / mockLocalAvg) * 100;
      const ageGap = ((userRalNum - mockAgeAvg) / mockAgeAvg) * 100;

      setResults({
        localAvg: mockLocalAvg,
        ageAvg: mockAgeAvg,
        userRal: userRalNum,
        localGap,
        ageGap,
        isJunior
      });

      setLoading(false);
      window.scrollTo({ top: 500, behavior: 'smooth' });
    }, 800);
  };

  // --- RENDERIZZATORI DINAMICI ---
  const renderGapBadge = (gap: number) => {
    if (gap > 0) return <div className="text-right text-emerald-500 font-black text-xl">+{gap.toFixed(1)}% vs te</div>;
    if (gap < -5) return <div className="text-right text-red-500 font-black text-xl">{gap.toFixed(1)}% vs te</div>;
    return <div className="text-right text-amber-500 font-black text-xl">In linea</div>;
  };

  const getAnalysisText = () => {
    if (!results) return null;

    if (results.isJunior) {
      if (results.ageGap >= 0) {
        return (
          <>
            Ottimo lavoro! Guadagni il <strong>{results.ageGap.toFixed(1)}% in più</strong> rispetto ai tuoi coetanei in Italia. 
            Sei sotto la media provinciale assoluta ({fmt(results.localAvg)}), ma è normale: quella include anche profili con maggiore senority. Quello è il tuo obiettivo per le prossime negoziazioni.
          </>
        );
      } else {
        return (
          <>
            Attenzione: sei sotto la media sia a livello provinciale che rispetto ai tuoi coetanei (<strong>{results.ageGap.toFixed(1)}%</strong>). C'è un evidente gap retributivo che devi colmare il prima possibile.
          </>
        );
      }
    } else {
      // Senior (35+)
      if (results.localGap < -10) {
        return (
          <>
            C'è un problema. Con la tua seniority sei pagato il <strong>{Math.abs(results.localGap).toFixed(1)}% in meno</strong> rispetto al mercato di {formData.comuneScelto}. Stai lasciando sul piatto migliaia di euro ogni anno.
          </>
        );
      } else if (results.localGap >= 0) {
        return (
          <>
            Stai gestendo bene la tua carriera. Sei sopra la media di mercato per la provincia di {formData.comuneScelto}. L'obiettivo ora è puntare a benefit aziendali o ruoli di leadership.
          </>
        );
      } else {
        return (
          <>
            Sei perfettamente in linea con le retribuzioni di {formData.comuneScelto}. Per fare il salto di qualità devi iniziare a differenziare le tue competenze rispetto alla media.
          </>
        );
      }
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-2 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
            Benchmark <span className="text-indigo-600">Salari</span> 2024
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Confronta la tua RAL con i dati ufficiali INPS. Scopri quanto guadagnano i tuoi coetanei e i tuoi colleghi nella tua provincia.
          </p>
        </div>

        {/* STEP 1: IL CALCOLATORE */}
        <div className="bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-visible">
          <div className="p-8 md:p-12">
            <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Ricerca Comune */}
              <div className="space-y-2 relative" ref={searchRef}>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Dove lavori?
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cerca il tuo comune..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value !== formData.comuneScelto) {
                        setFormData({...formData, comuneScelto: '', provinciaScelta: ''}); 
                      }
                    }}
                    onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                    className="w-full h-14 rounded-2xl border-2 border-border bg-background py-2 pl-12 pr-10 text-lg font-bold text-foreground outline-none focus:border-indigo-500"
                    autoComplete="off"
                    required
                  />
                  {isLoadingComune && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-indigo-600" />}
                </div>
                {showDropdown && (
                  <div className="absolute z-50 top-full mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                    {suggestions.length > 0 ? (
                      <ul className="py-1">
                        {suggestions.map((s) => (
                          <li key={s.comune}>
                            <button type="button" onClick={() => handleSelectComune(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                              <span className="font-bold text-foreground text-base">{s.comune}</span>
                              <span className="ml-auto rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-1 text-xs font-black uppercase tracking-wider">
                                {s.sigla_provincia}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : !isLoadingComune ? (
                      <div className="p-4 text-center text-sm font-medium text-muted-foreground">Nessun comune trovato.</div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Inquadramento */}
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Qualifica INPS
                </label>
                <select required value={formData.inquadramento} onChange={(e) => setFormData({...formData, inquadramento: e.target.value as Inquadramento})} className="w-full h-14 px-4 rounded-2xl border-2 border-border bg-background focus:border-indigo-500 outline-none text-lg font-bold">
                  <option value="">Seleziona...</option>
                  <option value="Apprendista">Apprendista / Stage</option>
                  <option value="Operaio">Operaio</option>
                  <option value="Impiegato">Impiegato</option>
                  <option value="Quadro">Quadro</option>
                  <option value="Dirigente">Dirigente</option>
                </select>
              </div>

              {/* Fascia Età */}
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> La tua età
                </label>
                <select required value={formData.ageGroup} onChange={(e) => setFormData({...formData, ageGroup: e.target.value})} className="w-full h-14 px-4 rounded-2xl border-2 border-border bg-background focus:border-indigo-500 outline-none text-lg font-bold">
                  <option value="">Seleziona...</option>
                  <option value="Fino a 19">Sotto i 20 anni</option>
                  <option value="20 - 24">20-24 anni</option>
                  <option value="25 - 29">25-29 anni</option>
                  <option value="30 - 34">30-34 anni</option>
                  <option value="35 - 39">35-39 anni</option>
                  <option value="40 - 44">40-44 anni</option>
                  <option value="45 - 49">45-49 anni</option>
                  <option value="50 - 54">50-54 anni</option>
                  <option value="55 - 59">55-59 anni</option>
                  <option value="60 - 64">60-64 anni</option>
                  <option value="65 ed oltre">Oltre 65 anni</option>
                </select>
              </div>

              {/* RAL Utente */}
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> La tua RAL (Lorda)
                </label>
                <input type="number" placeholder="Es: 28000" required value={formData.userRal} onChange={(e) => setFormData({...formData, userRal: e.target.value})} className="w-full h-14 px-4 rounded-2xl border-2 border-border bg-background focus:border-indigo-500 outline-none text-2xl font-black" />
              </div>

              <div className="md:col-span-2 pt-4">
                <button type="submit" disabled={loading || !formData.provinciaScelta} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 disabled:opacity-50">
                  {loading ? 'Analisi in corso...' : 'Confronta ora lo stipendio'} <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* STEP 2: RISULTATI (Mostrati solo se il calcolo è avvenuto) */}
        {results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Benchmark Coetanei (Più rilevante per i giovani, meno per i senior, ma sempre utile) */}
              <div className="bg-card p-8 rounded-[2rem] border border-border shadow-lg hover:-translate-y-1 transition-transform">
                <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-emerald-500" /> Benchmark Coetanei
                </h3>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-4xl font-black">{fmt(results.ageAvg)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Media Italia fascia {formData.ageGroup}</p>
                  </div>
                  {renderGapBadge(results.ageGap)}
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-6">
                  <div className={`h-full transition-all ${results.ageGap >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min((results.userRal / results.ageAvg) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Benchmark Territorio */}
              <div className="bg-card p-8 rounded-[2rem] border border-border shadow-lg hover:-translate-y-1 transition-transform">
                <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" /> Mercato Provinciale (Tutte le fasce d'età)
                </h3>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-4xl font-black">{fmt(results.localAvg)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Media {formData.inquadramento} ({formData.provinciaScelta})</p>
                  </div>
                  {renderGapBadge(results.localGap)}
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-6">
                  <div className={`h-full transition-all ${results.localGap >= 0 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((results.userRal / results.localAvg) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* STEP 3: ANALISI E CTA CAREER COACH */}
            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-2 space-y-5">
                  <h3 className="text-3xl font-black flex items-center gap-3">
                    <Target className="w-8 h-8 text-indigo-400" /> Analisi di Carriera
                  </h3>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {getAnalysisText()}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {results.ageGap < 0 || results.localGap < -10 ? (
                      <div className="flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-bold">
                        <AlertCircle className="w-4 h-4" /> Sottopagato rispetto al mercato
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Ottima retention salariale
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <button className="w-full bg-white text-slate-900 p-6 rounded-2xl font-black hover:bg-slate-100 transition-all flex flex-col items-center gap-1 group shadow-lg">
                    <span className="text-xs uppercase tracking-tighter opacity-70">Aumenta la tua RAL</span>
                    <span className="text-xl">Parla con un Coach</span>
                    <ArrowRight className="w-5 h-5 mt-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}