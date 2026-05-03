'use client';

// app/dashboard/leads/page.tsx
// Nota: questo è un Client Component perché gestisce il carrello in locale
// prima che l'utente invii la richiesta di acquisto.

import { useEffect, useState, useTransition } from 'react';
import { createClient } from "@supabase/supabase-js";
import {
  ShoppingCart, MapPin, Video, Clock, Filter,
  ChevronDown, Loader2, CheckCircle2, Info
} from 'lucide-react';

type Lead = {
  notification_id: string;
  lead_id: string;
  score: number;
  age: number;
  job_category: string;
  province: string;
  accepts_online: boolean;
  price_offered: number;   // centesimi
  notified_at: string;
  // Dati aggregati visibili prima dell'acquisto (NO contatti)
  monthly_net_income_range: string;  // es. "1.500–2.000"
  liquid_assets_range: string;       // es. "10.000–25.000"
  housing_status: string;
  flags: string[];
};

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : score >= 50
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return (
    <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center border flex-shrink-0 ${cls}`}>
      <span className="text-xl font-black leading-none">{score}</span>
      <span className="text-[10px] font-medium opacity-70 mt-0.5">score</span>
    </div>
  );
}

function FlagBadge({ flag }: { flag: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    INVESTMENT_GAP:         { text: 'Gap invest.', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    INVESTED_RUNWAY_BUFFER: { text: 'Patrimonio alto', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    SMALL_DEBT_EXEMPTION:   { text: 'Debito minimo', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    POSSIBLE_FAMILY_INPUT:  { text: 'Verifica dati', color: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
  };
  const l = labels[flag];
  if (!l) return null;
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${l.color}`}>
      {l.text}
    </span>
  );
}

export default function LeadsPage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Set<string>>(new Set()); // notification_ids
  const [filterOnline, setFilterOnline] = useState<boolean | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchLeads = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: consultant } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!consultant) return;

      /**
       * Join lead_notifications → leads
       * Mostriamo solo dati aggregati/anonimizzati:
       * - score, età, categoria, provincia, fascia reddito, fascia asset
       * - NO nome, email, telefono (sbloccati solo dopo acquisto)
       */
      const { data } = await supabase
        .from('lead_notifications')
        .select(`
          id,
          lead_id,
          price_offered,
          notified_at,
          leads (
            score, age, job_category, province,
            accepts_online, housing_status, engine_flags,
            monthly_net_income, liquid_cash, investments
          )
        `)
        .eq('consultant_id', consultant.id)
        .eq('status', 'pending')
        .order('notified_at', { ascending: false });

      if (data) {
        const mapped: Lead[] = data.map((n: any) => {
          const l = n.leads;
          // Fascia reddito: arrotondiamo per non esporre il dato esatto
          const income = l.monthly_net_income;
          const incomeRange = income < 1500 ? '< 1.500'
            : income < 2500 ? '1.500–2.500'
            : income < 4000 ? '2.500–4.000'
            : '> 4.000';

          const assets = (l.liquid_cash ?? 0) + (l.investments ?? 0);
          const assetsRange = assets < 10000 ? '< 10.000'
            : assets < 30000 ? '10.000–30.000'
            : assets < 100000 ? '30.000–100.000'
            : '> 100.000';

          return {
            notification_id: n.id,
            lead_id: n.lead_id,
            score: l.score,
            age: l.age,
            job_category: l.job_category,
            province: l.province,
            accepts_online: l.accepts_online,
            price_offered: n.price_offered,
            notified_at: n.notified_at,
            monthly_net_income_range: incomeRange,
            liquid_assets_range: assetsRange,
            housing_status: l.housing_status,
            flags: l.engine_flags ?? [],
          };
        });
        setLeads(mapped);
      }
      setLoading(false);
    };

    fetchLeads();
  }, []);

  const toggleCart = (notificationId: string) => {
    setCart(prev => {
      const next = new Set(prev);
      next.has(notificationId) ? next.delete(notificationId) : next.add(notificationId);
      return next;
    });
  };

  const filtered = leads.filter(l => {
    if (filterOnline !== null && l.accepts_online !== filterOnline) return false;
    if (filterCategory && l.job_category !== filterCategory) return false;
    return true;
  });

  const cartLeads = leads.filter(l => cart.has(l.notification_id));
  const cartTotal = cartLeads.reduce((sum, l) => sum + l.price_offered, 0);

  const categories = [...new Set(leads.map(l => l.job_category))];

  const hoursLeft = (notifiedAt: string) => {
    const expires = new Date(notifiedAt).getTime() + 48 * 3600 * 1000;
    const h = Math.max(0, Math.floor((expires - Date.now()) / 3600000));
    return h;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Lead Disponibili</h1>
          <p className="text-white/40 mt-1">
            {filtered.length} profili compatibili con il tuo account.
            I dati di contatto si sbloccano dopo l'acquisto.
          </p>
        </div>

        {/* Carrello flotante */}
        {cart.size > 0 && (
          <a
            href="/dashboard/carrello"
            className="flex items-center gap-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.size} lead · €{(cartTotal / 100).toFixed(0)}
          </a>
        )}
      </div>

      {/* Filtri */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Filter className="w-4 h-4" /> Filtra:
        </div>

        <button
          onClick={() => setFilterOnline(null)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            filterOnline === null ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          Tutti
        </button>
        <button
          onClick={() => setFilterOnline(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            filterOnline === true ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> Solo online
        </button>
        <button
          onClick={() => setFilterOnline(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            filterOnline === false ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Solo presenza
        </button>

        {categories.length > 1 && (
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 border border-white/10 outline-none"
          >
            <option value="">Tutte le categorie</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Lista lead */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white/30">Nessun lead disponibile al momento.</p>
          <p className="text-white/20 text-sm mt-1">Ti notificheremo via email quando arrivano nuovi profili.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const inCart = cart.has(lead.notification_id);
            const h = hoursLeft(lead.notified_at);
            const urgent = h < 12;

            return (
              <div
                key={lead.notification_id}
                className={`bg-[#13151f] border rounded-2xl p-5 transition-all ${
                  inCart
                    ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <ScoreBadge score={lead.score} />

                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-base font-bold text-white">
                        {lead.job_category} · {lead.age} anni
                      </span>
                      <span className="text-white/30">·</span>
                      <span className="flex items-center gap-1 text-sm text-white/50">
                        <MapPin className="w-3.5 h-3.5" /> {lead.province}
                      </span>
                      {lead.accepts_online && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
                          <Video className="w-3 h-3" /> Online
                        </span>
                      )}
                    </div>

                    {/* Dati aggregati anonimi */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-white/[0.03] rounded-xl p-2.5">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Reddito netto/mese</p>
                        <p className="text-sm font-bold text-white">€{lead.monthly_net_income_range}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-2.5">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Asset liquidi</p>
                        <p className="text-sm font-bold text-white">€{lead.liquid_assets_range}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-2.5">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Abitazione</p>
                        <p className="text-sm font-bold text-white truncate">{lead.housing_status}</p>
                      </div>
                    </div>

                    {/* Flag motore */}
                    {lead.flags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Info className="w-3.5 h-3.5 text-white/20" />
                        {lead.flags.map(f => <FlagBadge key={f} flag={f} />)}
                      </div>
                    )}
                  </div>

                  {/* Prezzo + azione */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                    <p className="text-2xl font-black text-white">
                      €{(lead.price_offered / 100).toFixed(0)}
                    </p>

                    <button
                      onClick={() => toggleCart(lead.notification_id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        inCart
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-white/5 text-white/60 hover:bg-indigo-500/10 hover:text-indigo-300 border border-white/10'
                      }`}
                    >
                      {inCart
                        ? <><CheckCircle2 className="w-4 h-4" /> Nel carrello</>
                        : <><ShoppingCart className="w-4 h-4" /> Aggiungi</>
                      }
                    </button>

                    {/* Countdown scadenza */}
                    <p className={`text-xs flex items-center gap-1 ${urgent ? 'text-rose-400' : 'text-white/25'}`}>
                      <Clock className="w-3 h-3" />
                      {h === 0 ? 'Scade a breve' : `${h}h rimanenti`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}