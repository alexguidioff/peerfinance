require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CSV_FILE_PATH = './cla_anno_calcolo_irpef_2025.csv'; 

// Funzione per pulire i numeri (toglie punti delle migliaia e gestisce virgole decimali)
const p = (val) => {
  if (!val || val === '-') return 0;
  const clean = val.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

const results = [];

console.log('Inizio elaborazione totale colonne...');

fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf8' })
  .pipe(csv({ separator: ';' }))
  .on('data', (row) => {
    if (row["Classi di reddito complessivo in euro"]?.includes("Totale") || row["Classi di eta'"]?.includes("Totale")) return;

    const numContr = p(row["Numero contribuenti"]);
    const redditoTot = p(row["Reddito complessivo - Ammontare in euro"]);

    results.push({
      classe_reddito: row["Classi di reddito complessivo in euro"]?.trim(),
      classe_eta: row["Classi di eta'"]?.trim(),
      num_contribuenti: Math.round(numContr),
      
      // Redditi
      reddito_complessivo_freq: Math.round(p(row["Reddito complessivo - Frequenza"])),
      reddito_complessivo_ammontare: redditoTot,
      reddito_netto_cedolare_freq: Math.round(p(row["Reddito complessivo al netto della cedolare secca - Frequenza"])),
      reddito_netto_cedolare_ammontare: p(row["Reddito complessivo al netto della cedolare secca - Ammontare in euro"]),
      
      // Deduzioni
      deduzione_abitazione_freq: Math.round(p(row["Deduzione per abitazione principale - Frequenza"])),
      deduzione_abitazione_ammontare: p(row["Deduzione per abitazione principale - Ammontare in euro"]),
      oneri_deducibili_freq: Math.round(p(row["Oneri deducibili - Frequenza"])),
      oneri_deducibili_ammontare: p(row["Oneri deducibili - Ammontare in euro"]),
      reddito_imponibile_freq: Math.round(p(row["Reddito imponibile - Frequenza"])),
      reddito_imponibile_ammontare: p(row["Reddito imponibile - Ammontare in euro"]),
      
      // Imposte
      imposta_lorda_freq: Math.round(p(row["Imposta lorda - Frequenza"])),
      imposta_lorda_ammontare: p(row["Imposta lorda - Ammontare in euro"]),
      detrazioni_imposta_freq: Math.round(p(row["Detrazioni d'imposta - Frequenza"])),
      detrazioni_imposta_ammontare: p(row["Detrazioni d'imposta - Ammontare in euro"]),
      imposta_netta_freq: Math.round(p(row["Imposta netta - Frequenza"])),
      imposta_netta_ammontare: p(row["Imposta netta - Ammontare in euro"]),
      
      // Crediti e Differenza
      crediti_ritenute_freq: Math.round(p(row["Crediti d'imposta e ritenute - Frequenza"])),
      crediti_ritenute_ammontare: p(row["Crediti d'imposta e ritenute - Ammontare in euro"]),
      differenza_freq: Math.round(p(row["Differenza - Frequenza"])),
      differenza_ammontare: p(row["Differenza - Ammontare in euro"]),
      
      // Eccedenze e Acconti
      eccedenza_precedente_freq: Math.round(p(row["Eccedenza d'imposta risultante dalla precedente dichiarazione - Frequenza"])),
      eccedenza_precedente_ammontare: p(row["Eccedenza d'imposta risultante dalla precedente dichiarazione - Ammontare in euro"]),
      acconti_versati_freq: Math.round(p(row["Acconti versati - Frequenza"])),
      acconti_versati_ammontare: p(row["Acconti versati - Ammontare in euro"]),
      
      // Finali
      irpef_a_credito_freq: Math.round(p(row["Irpef a credito - Frequenza"])),
      irpef_a_credito_ammontare: p(row["Irpef a credito - Ammontare in euro"]),
      irpef_a_debito_freq: Math.round(p(row["Irpef a debito - Frequenza"])),
      irpef_a_debito_ammontare: p(row["Irpef a debito - Ammontare in euro"]),

      reddito_medio: numContr > 0 ? parseFloat((redditoTot / numContr).toFixed(2)) : 0
    });
  })
  .on('end', async () => {
    console.log(`Caricamento di ${results.length} righe con mapping completo...`);
    const BATCH_SIZE = 200; // Batch più piccoli visto l'alto numero di colonne
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('mef_distribuzione_eta').insert(batch);
      if (error) console.error('Errore batch:', error);
      else console.log(`Batch ${i / BATCH_SIZE + 1} inviato.`);
    }
    console.log('Finito. Ora hai tutto l\'arsenale di dati pronto.');
  });
