import { createClient } from '@supabase/supabase-js';
import PiramideClient from '@/components/PiramideClient';

export const metadata = {
  title: 'Piramide dei Redditi in Italia | Peerfinance',
};

export default async function PiramidePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Scarichiamo anche l'imposta netta per calcolare il vero netto!
  const { data } = await supabase
    .from('mef_distribuzione_eta')
    .select('classe_eta, num_contribuenti, reddito_complessivo_ammontare, imposta_netta_ammontare');

  // Aggregazione dati
  const raggruppati = data?.reduce((acc: any, curr) => {
    const key = curr.classe_eta;
    if (!acc[key]) acc[key] = { eta: key, contribuenti: 0, lordo: 0, tasse: 0 };
    
    acc[key].contribuenti += (Number(curr.num_contribuenti) || 0);
    acc[key].lordo += (Number(curr.reddito_complessivo_ammontare) || 0);
    acc[key].tasse += (Number(curr.imposta_netta_ammontare) || 0);
    
    return acc;
  }, {});

  // Formattiamo i dati per il Client
  const chartData = Object.values(raggruppati || {}).map((d: any) => {
    const lordoAnnuale = d.contribuenti > 0 ? d.lordo / d.contribuenti : 0;
    const tasseAnnuali = d.contribuenti > 0 ? d.tasse / d.contribuenti : 0;
    const nettoAnnuale = lordoAnnuale - tasseAnnuali;

    return {
      eta: d.eta,
      contribuenti: d.contribuenti,
      lordoAnnuale,
      nettoAnnuale,
    };
  });

  return <PiramideClient initialData={chartData} />;
}
