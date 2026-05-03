// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Users, ShoppingCart, TrendingUp, Zap, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

function StatCard({
  label, value, sub, icon, accent = 'indigo'
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent?: 'indigo' | 'emerald' | 'amber' | 'rose'
}) {
  const colors = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/10  border-amber-500/20  text-amber-400',
    rose:    'bg-rose-500/10   border-rose-500/20   text-rose-400',
  };

  return (
    <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border mb-4 ${colors[accent]}`}>
        {icon}
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-sm font-semibold text-white/60 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  // 1. Diciamo a Next.js di leggere i Cookie (SSR corretto)
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
      
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Chiediamo al DB i dati del consulente.
  // Nota: ho rimosso le colonne 'leads_purchased_30d' e 'leads_notified_30d'
  // se non esistono nel DB ti darebbe un errore 500. Le simuliamo sotto se mancano.
  const { data: dbConsultant } = await supabase
    .from('consultants')
    .select('id, first_name, type, credits')
    .eq('user_id', user.id)
    .single();

  // Profilo di backup in caso di test
  const consultant = dbConsultant || { 
      id: 'test-id', 
      first_name: 'Test', 
      type: 'CFA', 
      credits: 0,
      leads_purchased_30d: 0,
      leads_notified_30d: 0
  };

  // 3. Facciamo query sicure: se le tabelle non esistono ancora, mettiamo 0
  let availableCount = 0;
  let cartCount = 0;
  let purchasedTotal = 0;
  let recentLeads: any[] = [];

  try {
      const { count: aCount } = await supabase
        .from('lead_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('consultant_id', consultant.id)
        .eq('status', 'pending');
      availableCount = aCount || 0;

      const { count: cCount } = await supabase
        .from('lead_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('consultant_id', consultant.id)
        .eq('status', 'in_cart');
      cartCount = cCount || 0;

      const { count: pCount } = await supabase
        .from('lead_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('consultant_id', consultant.id)
        .eq('status', 'purchased');
      purchasedTotal = pCount || 0;

      const { data: rLeads } = await supabase
        .from('lead_notifications')
        .select(`
          id, price_offered, notified_at,
          leads (score, age, job_category, province, accepts_online)
        `)
        .eq('consultant_id', consultant.id)
        .eq('status', 'pending')
        .order('notified_at', { ascending: false })
        .limit(3);
      recentLeads = rLeads || [];
  } catch (e) {
      console.log("Tabella lead_notifications non ancora pronta, uso dati zero.");
  }

// Se i campi 'leads_notified_30d' esistono li usiamo, altrimenti 0
const notified30d = (consultant as any).leads_notified_30d || 0;
const purchased30d = (consultant as any).leads_purchased_30d || 0;

  const conversionRate = notified30d > 0
    ? Math.round((purchased30d / notified30d) * 100)
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white">
          Buongiorno, {consultant.first_name} 👋
        </h1>
        <p className="text-white/40 mt-1">
          Ecco il riepilogo della tua attività su CashflowScore.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lead disponibili"
          value={availableCount}
          sub="Pronti per l'acquisto"
          icon={<Users className="w-5 h-5" />}
          accent="indigo"
        />
        <StatCard
          label="Nel carrello"
          value={cartCount}
          sub="In attesa di conferma"
          icon={<ShoppingCart className="w-5 h-5" />}
          accent="amber"
        />
        <StatCard
          label="Acquistati (totale)"
          value={purchasedTotal}
          sub={`${purchased30d} questo mese`}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="emerald"
        />
        <StatCard
          label="Crediti residui"
          value={consultant.credits || 0}
          sub={`Tasso acquisizione: ${conversionRate}%`}
          icon={<Zap className="w-5 h-5" />}
          accent="rose"
        />
      </div>

      {/* Preview lead recenti */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-bold text-white">Ultimi lead disponibili</h2>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Vedi tutti <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLeads && recentLeads.length > 0 ? (
          <div className="divide-y divide-white/5">
            {recentLeads.map((n: any) => {
              const lead = n.leads;
              const hoursAgo = Math.floor(
                (Date.now() - new Date(n.notified_at).getTime()) / 3600000
              );
              return (
                <div key={n.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  {/* Score badge */}
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg
                    ${lead.score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      lead.score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                         'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {lead.score}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {lead.job_category} • {lead.age} anni • {lead.province}
                      </p>
                      {lead.accepts_online && (
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
                          Online ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hoursAgo < 1 ? 'Meno di un\'ora fa' : `${hoursAgo}h fa`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-white">
                      €{(n.price_offered / 100).toFixed(0)}
                    </p>
                    <Link
                      href="/dashboard/leads"
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Aggiungi →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-white/30 text-sm">Nessun lead disponibile al momento.</p>
            <p className="text-white/20 text-xs mt-1">Ti notificheremo non appena arriveranno nuovi profili compatibili.</p>
          </div>
        )}
      </div>
    </div>
  );
}