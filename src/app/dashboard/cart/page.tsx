'use client';

// app/dashboard/carrello/page.tsx

import { useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { ShoppingCart, Trash2, Send, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * Il carrello è gestito in localStorage per semplicità.
 * Quando il consulente clicca "Richiedi acquisto":
 * 1. Inseriamo una riga per ogni lead in lead_notifications con status 'in_cart'
 * 2. Tu ricevi una email con il riepilogo
 * 3. Dopo il pagamento manuale, cambi lo status a 'purchased' e i contatti si sbloccano
 */

type CartItem = {
  notification_id: string;
  lead_id: string;
  score: number;
  age: number;
  job_category: string;
  province: string;
  price_offered: number;
};

export default function CartPage() {
  // In un'implementazione reale questo viene da un context/store condiviso con LeadsPage
  // Per ora leggiamo da localStorage o da lead_notifications con status 'in_cart'
  const [items, setItems] = useState<CartItem[]>([]);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.notification_id !== id));
  };

  const total = items.reduce((sum, i) => sum + i.price_offered, 0);

  const handleRequest = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: consultant } = await supabase
        .from('consultants')
        .select('id, first_name, last_name, email')
        .eq('user_id', user.id)
        .single();
      if (!consultant) return;

      // Segna tutti i lead del carrello come 'in_cart' in lead_notifications
      const updates = items.map(item =>
        supabase
          .from('lead_notifications')
          .update({ status: 'in_cart' })
          .eq('id', item.notification_id)
          .eq('consultant_id', consultant.id)
      );
      await Promise.all(updates);

      // Inserisci una riga in purchase_requests (tabella semplice per notifica admin)
      await supabase.from('purchase_requests').insert({
        consultant_id: consultant.id,
        notification_ids: items.map(i => i.notification_id),
        total_cents: total,
        note: note || null,
        status: 'pending_payment',
      });

      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Richiesta inviata!</h2>
        <p className="text-white/50 max-w-md leading-relaxed">
          Abbiamo ricevuto la tua richiesta per <strong className="text-white">{items.length} lead</strong>.
          Riceverai una email con le istruzioni di pagamento entro poche ore.
          Una volta confermato il pagamento, i dati di contatto si sbloccheranno automaticamente.
        </p>
        <div className="mt-8 p-4 bg-white/[0.03] rounded-2xl border border-white/5 text-left w-full max-w-sm">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Riepilogo richiesta</p>
          {items.map(i => (
            <div key={i.notification_id} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
              <span className="text-white/60">{i.job_category} · {i.age}a · {i.province}</span>
              <span className="text-white font-bold">€{(i.price_offered / 100).toFixed(0)}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-black text-white pt-3 mt-1">
            <span>Totale</span>
            <span>€{(total / 100).toFixed(0)}</span>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="mt-8 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Torna alla dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Lead disponibili
        </Link>
        <span className="text-white/10">/</span>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-indigo-400" /> Carrello
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30">Il carrello è vuoto.</p>
          <Link
            href="/dashboard/leads"
            className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
          >
            Sfoglia i lead disponibili →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Lista item */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div
                key={item.notification_id}
                className="bg-[#13151f] border border-white/5 rounded-2xl p-5 flex items-center gap-4"
              >
                {/* Score */}
                <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-black border
                  ${item.score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    item.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                       'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  <span className="text-lg leading-none">{item.score}</span>
                  <span className="text-[10px] opacity-60">score</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {item.job_category} · {item.age} anni · {item.province}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    Dati di contatto sbloccati dopo il pagamento
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-lg font-black text-white">
                    €{(item.price_offered / 100).toFixed(0)}
                  </p>
                  <button
                    onClick={() => removeItem(item.notification_id)}
                    className="p-2 rounded-xl text-white/20 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Riepilogo ordine */}
          <div className="lg:col-span-1">
            <div className="bg-[#13151f] border border-white/5 rounded-2xl p-5 sticky top-8">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
                Riepilogo
              </h3>

              <div className="space-y-2 mb-4 pb-4 border-b border-white/5">
                {items.map(i => (
                  <div key={i.notification_id} className="flex justify-between text-sm">
                    <span className="text-white/40 truncate max-w-[140px]">
                      {i.job_category} · {i.age}a
                    </span>
                    <span className="text-white font-medium">
                      €{(i.price_offered / 100).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-lg font-black text-white mb-5">
                <span>Totale</span>
                <span>€{(total / 100).toFixed(0)}</span>
              </div>

              {/* Note opzionali */}
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note per il team (opzionale)..."
                rows={2}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-white/60 placeholder:text-white/20 outline-none focus:border-indigo-500/40 resize-none mb-4"
              />

              <button
                onClick={handleRequest}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><Send className="w-4 h-4" /> Richiedi acquisto</>
                }
              </button>

              <p className="text-xs text-white/20 text-center mt-3 leading-relaxed">
                Riceverai una email con le istruzioni di pagamento.
                I contatti si sbloccano dopo la conferma.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}