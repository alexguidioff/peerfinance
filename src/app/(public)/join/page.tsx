'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mail, User, Briefcase, ArrowRight, CheckCircle, ShieldCheck, 
  Phone, Building2, MapPin, Globe, Award, X
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// --- LISTE MAGICHE PER LA UX ---
const SPECIALIZZAZIONI_DISPONIBILI = [
  "Pianificazione Finanziaria", "Passaggio Generazionale", "Previdenza",
  "Investimenti ESG", "Protezione Patrimoniale", "Pianificazione Fiscale",
  "Corporate Finance", "Gestione del Debito"
];

const PROVINCE_ITALIANE = [
  "Agrigento", "Alessandria", "Ancona", "Aosta", "Arezzo", "Ascoli Piceno", "Asti", "Avellino", "Bari", "Barletta-Andria-Trani", "Belluno", "Benevento", "Bergamo", "Biella", "Bologna", "Bolzano", "Brescia", "Brindisi", "Cagliari", "Caltanissetta", "Campobasso", "Caserta", "Catania", "Catanzaro", "Chieti", "Como", "Cosenza", "Cremona", "Crotone", "Cuneo", "Enna", "Fermo", "Ferrara", "Firenze", "Foggia", "Forlì-Cesena", "Frosinone", "Genova", "Gorizia", "Grosseto", "Imperia", "Isernia", "L'Aquila", "La Spezia", "Latina", "Lecce", "Lecco", "Livorno", "Lodi", "Lucca", "Macerata", "Mantova", "Massa-Carrara", "Matera", "Messina", "Milano", "Modena", "Monza e della Brianza", "Napoli", "Novara", "Nuoro", "Oristano", "Padova", "Palermo", "Parma", "Pavia", "Perugia", "Pesaro e Urbino", "Pescara", "Piacenza", "Pisa", "Pistoia", "Pordenone", "Potenza", "Prato", "Ragusa", "Ravenna", "Reggio Calabria", "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo", "Salerno", "Sassari", "Savona", "Siena", "Siracusa", "Sondrio", "Sud Sardegna", "Taranto", "Teramo", "Terni", "Torino", "Trapani", "Trento", "Treviso", "Trieste", "Udine", "Varese", "Venezia", "Verbano-Cusio-Ossola", "Vercelli", "Verona", "Vibo Valentia", "Vicenza", "Viterbo"
];

// Array prefissi diviso per importanza
const TOP_COUNTRIES = [
  { name: "Italia", code: "+39", flag: "🇮🇹" },
  { name: "San Marino", code: "+378", flag: "🇸🇲" },
  { name: "Svizzera", code: "+41", flag: "🇨🇭" },
  { name: "Città del Vaticano", code: "+379", flag: "🇻🇦" },
];

const OTHER_COUNTRIES = [
  { name: "Albania", code: "+355", flag: "🇦🇱" }, { name: "Austria", code: "+43", flag: "🇦🇹" },
  { name: "Belgio", code: "+32", flag: "🇧🇪" }, { name: "Brasile", code: "+55", flag: "🇧🇷" },
  { name: "Canada", code: "+1", flag: "🇨🇦" }, { name: "Croazia", code: "+385", flag: "🇭🇷" },
  { name: "Danimarca", code: "+45", flag: "🇩🇰" }, { name: "Francia", code: "+33", flag: "🇫🇷" },
  { name: "Germania", code: "+49", flag: "🇩🇪" }, { name: "Giappone", code: "+81", flag: "🇯🇵" },
  { name: "Grecia", code: "+30", flag: "🇬🇷" }, { name: "Irlanda", code: "+353", flag: "🇮🇪" },
  { name: "Malta", code: "+356", flag: "🇲🇹" }, { name: "Monaco", code: "+377", flag: "🇲🇨" },
  { name: "Paesi Bassi", code: "+31", flag: "🇳🇱" }, { name: "Polonia", code: "+48", flag: "🇵🇱" },
  { name: "Portogallo", code: "+351", flag: "🇵🇹" }, { name: "Regno Unito", code: "+44", flag: "🇬🇧" },
  { name: "Slovenia", code: "+386", flag: "🇸🇮" }, { name: "Spagna", code: "+34", flag: "🇪🇸" },
  { name: "Stati Uniti", code: "+1", flag: "🇺🇸" }, { name: "Svezia", code: "+46", flag: "🇸🇪" }
];


export default function JoinPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Stato per il prefisso telefonico
  const [phonePrefix, setPhonePrefix] = useState('+39');

  // Stati per l'autocomplete delle province
  const [provInput, setProvInput] = useState('');
  const [filteredProvinces, setFilteredProvinces] = useState<string[]>([]);
  const [showProvDropdown, setShowProvDropdown] = useState(false);
  const provContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    company_name: '', type: '', provinces: [] as string[],
    accepts_online: false, specializations: [] as string[]
  });

  // Gestione clic fuori dal menu a tendina delle province
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (provContainerRef.current && !provContainerRef.current.contains(event.target as Node)) {
        setShowProvDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // --- LOGICA PROVINCE (Autocomplete Blindato) ---
  const handleProvInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProvInput(val);
    
    if (val.trim().length > 0) {
      const filtered = PROVINCE_ITALIANE.filter(
        p => p.toLowerCase().includes(val.toLowerCase()) && !formData.provinces.includes(p)
      );
      setFilteredProvinces(filtered);
      setShowProvDropdown(true);
    } else {
      setShowProvDropdown(false);
    }
  };

  const addProvince = (prov: string) => {
    if (!formData.provinces.includes(prov)) {
      setFormData(prev => ({ ...prev, provinces: [...prev.provinces, prov] }));
    }
    setProvInput('');
    setShowProvDropdown(false);
  };

  const handleProvinceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Permetti invio solo se c'è un match esatto (ignora maiuscole/minuscole)
      const exactMatch = PROVINCE_ITALIANE.find(p => p.toLowerCase() === provInput.toLowerCase());
      if (exactMatch) {
        addProvince(exactMatch);
      }
    }
  };

  const removeProvince = (provToRemove: string) => {
    setFormData(prev => ({ ...prev, provinces: prev.provinces.filter(p => p !== provToRemove) }));
  };

  // --- LOGICA SPECIALIZZAZIONI (Tag da lista) ---
  const handleAddSpecialization = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !formData.specializations.includes(val)) {
      setFormData(prev => ({ ...prev, specializations: [...prev.specializations, val] }));
    }
    e.target.value = ""; 
  };

  const removeSpecialization = (specToRemove: string) => {
    setFormData(prev => ({ ...prev, specializations: prev.specializations.filter(s => s !== specToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.provinces.length === 0 && !formData.accepts_online) {
      alert("Inserisci almeno una provincia o accetta la consulenza online.");
      return;
    }

    setIsSubmitting(true);
    
    // Inizializza Supabase
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Dati da inviare
    const finalPhone = `${phonePrefix} ${formData.phone.trim()}`;
    const finalProvinces = formData.provinces.join(', ');
    const finalSpecializations = formData.specializations.join(', ');

    // Inseriamo nel database!
    // ... (sopra c'è l'inserimento in supabase)

    const { error } = await supabase
      .from('join_requests')
      .insert([
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: finalPhone,
          company_name: formData.company_name,
          type: formData.type,
          provinces: finalProvinces,
          specializations: finalSpecializations,
          accepts_online: formData.accepts_online
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      console.error("Errore Supabase:", error);
      alert("Si è verificato un errore durante l'invio. Riprova tra poco.");
    } else {
      // 🎉 INSERISCI QUESTO BLOCCO NUOVO 🎉
      // Se il salvataggio va a buon fine, chiediamo alla nostra API di mandarci la mail!
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: finalPhone,
            type: formData.type,
            provinces: finalProvinces
          })
        });
      } catch (mailError) {
        // Ignoriamo gli errori visivi della mail, l'utente ha comunque fatto l'iscrizione
        console.error("Errore notifica mail:", mailError);
      }
      
      // Mostriamo il successo all'utente
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-card border border-emerald-500/20 rounded-3xl p-8 text-center shadow-lg shadow-emerald-500/5 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Richiesta inviata!</h2>
          <p className="text-muted-foreground mb-8">
            Abbiamo ricevuto il tuo profilo. Il nostro team lo valuterà e ti contatterà presto all'indirizzo <strong className="text-foreground">{formData.email}</strong>.
          </p>
          <Link href="/" className="inline-block bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 px-6 rounded-xl transition-colors">
            Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground">Candidatura Rete Consulenti</h1>
          <p className="text-muted-foreground">
            Accedi a lead finanziari pre-qualificati. Compila il form per richiedere l'accesso alla piattaforma B2B.
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nome</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="w-full pl-10 p-3 border-2 rounded-xl font-medium text-foreground bg-secondary/30 focus:bg-background focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all" placeholder="Mario" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cognome</label>
                <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className="w-full p-3 border-2 rounded-xl font-medium text-foreground bg-secondary/30 focus:bg-background focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all" placeholder="Rossi" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Lavorativa</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 p-3 border-2 rounded-xl font-medium text-foreground bg-secondary/30 focus:bg-background focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all" placeholder="mario@studio.it" />
                </div>
              </div>

              {/* CAMPO CELLULARE PROFESSIONALE */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cellulare</label>
                <div className="flex bg-secondary/30 border-2 border-transparent focus-within:bg-background focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-xl transition-all">
                  <div className="pl-4 flex items-center justify-center pointer-events-none">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {/* Select Prefisso. Scrivendo su tastiera salta direttamente al paese */}
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="bg-transparent pl-2 pr-1 py-3 text-foreground font-medium outline-none cursor-pointer max-w-[120px] truncate"
                  >
                    <optgroup label="Principali">
                      {TOP_COUNTRIES.map(c => (
                        <option key={c.name} value={c.code} className="text-foreground bg-background">{c.name} ({c.code}) {c.flag}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tutti i Paesi">
                      {OTHER_COUNTRIES.map(c => (
                        <option key={c.name} value={c.code} className="text-foreground bg-background">{c.name} ({c.code}) {c.flag}</option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="w-px bg-border/50 my-2 mx-1"></div>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="flex-1 bg-transparent p-3 pl-2 outline-none text-foreground font-medium min-w-0" placeholder="333 1234567" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Qualifica</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <select name="type" required value={formData.type} onChange={handleChange} className="w-full pl-10 p-3 border-2 rounded-xl font-medium text-foreground bg-secondary/30 focus:bg-background focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all appearance-none">
                    <option value="" disabled className="text-foreground bg-background">Seleziona ruolo...</option>
                    <option value="CFA" className="text-foreground bg-background">Consulente Autonomo</option>
                    <option value="Promotore" className="text-foreground bg-background">Consulente abilitato (Rete)</option>
                    <option value="Studio" className="text-foreground bg-background">Studio Associato</option>
                    <option value="Financial Coach" className="text-foreground bg-background">Financial Coach</option>
                    <option value="Job Coach" className="text-foreground bg-background">Job Coach / Career Coach</option>
                    <option value="Altro" className="text-foreground bg-background">Altro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nome Mandante/Studio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full pl-10 p-3 border-2 rounded-xl font-medium text-foreground bg-secondary/30 focus:bg-background focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all" placeholder="Es. Fineco, Fideuram..." />
                </div>
              </div>
            </div>

            {/* Province a Tag con Autocomplete */}
            <div ref={provContainerRef} className="relative">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Province di operatività</label>
              <div className="bg-secondary/30 border-2 border-transparent focus-within:bg-background focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-xl p-2 transition-all flex flex-wrap gap-2 items-center min-h-[52px]">
                <MapPin className="h-4 w-4 text-muted-foreground ml-2" />
                
                {formData.provinces.map((prov) => (
                  <span key={prov} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5">
                    {prov}
                    <button type="button" onClick={() => removeProvince(prov)} className="hover:text-emerald-800 dark:hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={provInput}
                  onChange={handleProvInputChange}
                  onKeyDown={handleProvinceKeyDown}
                  className="flex-1 bg-transparent min-w-[150px] outline-none text-foreground font-medium p-1"
                  placeholder={formData.provinces.length === 0 ? "Scrivi la provincia..." : ""}
                />
              </div>

              {/* Menu a tendina autocomplete */}
              {showProvDropdown && filteredProvinces.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredProvinces.map(prov => (
                    <div 
                      key={prov} 
                      className="px-4 py-2 hover:bg-secondary/50 cursor-pointer text-sm font-medium text-foreground"
                      onClick={() => addProvince(prov)}
                    >
                      {prov}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Specializzazioni a Tag */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Specializzazioni principali</label>
              <div className="bg-secondary/30 border-2 border-transparent focus-within:bg-background focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-xl p-2 transition-all flex flex-wrap gap-2 items-center min-h-[52px] relative">
                <Award className="h-4 w-4 text-muted-foreground ml-2" />
                
                {formData.specializations.map((spec) => (
                  <span key={spec} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5">
                    {spec}
                    <button type="button" onClick={() => removeSpecialization(spec)} className="hover:text-indigo-800 dark:hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}

                <select 
                  onChange={handleAddSpecialization}
                  className="flex-1 bg-transparent min-w-[150px] outline-none text-muted-foreground hover:text-foreground cursor-pointer font-medium p-1 appearance-none"
                >
                  <option value="" className="text-foreground bg-background">+ Aggiungi specializzazione...</option>
                  {SPECIALIZZAZIONI_DISPONIBILI.map(spec => (
                    <option key={spec} value={spec} disabled={formData.specializations.includes(spec)} className="text-foreground bg-background">
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accetta Online Checkbox Avanzata */}
            <div className={`p-5 border-2 rounded-xl mt-2 transition-all cursor-pointer ${formData.accepts_online ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-secondary/20 border-border hover:border-foreground/20'}`}
                 onClick={() => setFormData(p => ({ ...p, accepts_online: !p.accepts_online }))}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <input type="checkbox" checked={formData.accepts_online} readOnly className="w-5 h-5 rounded border-gray-400 text-emerald-600 focus:ring-emerald-600 pointer-events-none" />
                </div>
                <div>
                  <label className="text-sm font-black text-foreground flex items-center gap-2 cursor-pointer">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    Consulenza Remota (Tutta Italia)
                  </label>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                    Selezionando questa opzione, confermi di essere strutturato per operare in videoconferenza, accedendo così all'intero bacino di lead nazionali.
                  </p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 mt-6">
              {isSubmitting ? 'Elaborazione profilo...' : 'Invia Candidatura'}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sei già stato approvato?{' '}
          <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Accedi qui
          </Link>
        </p>

      </div>
    </div>
  );
}