// scripts/seed-mef.js
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const results = [];
const CSV_FILE_PATH = './Redditi_e_principali_variabili_IRPEF_su_base_comunale_CSV_2023.csv';

async function uploadToSupabase(dataBatch) {
  const { error } = await supabase
    .from('mef_redditi_comuni')
    .upsert(dataBatch, { onConflict: 'codice_catastale' });

  if (error) {
    console.error('Errore inserimento batch:', error.message);
  } else {
    console.log(`Inserite con successo ${dataBatch.length} righe.`);
  }
}

console.log('Lettura del file iniziata...');

fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf8' })
  // Il separatore qui è la tabulazione
  .pipe(csv({ separator: ';' })) 
  .on('data', (row) => {
    const redditoComplessivo = parseFloat(row["Reddito complessivo - Ammontare in euro"]) || 0;
    const numContribuenti = parseInt(row["Numero contribuenti"]) || 1;
    const codiceCatastale = row["Codice catastale"]?.trim();

    if (!codiceCatastale) return;
    const redditoMedio = numContribuenti > 0 ? (redditoComplessivo / numContribuenti).toFixed(2) : 0;

    results.push({
      codice_catastale: codiceCatastale,
      codice_istat: row["Codice Istat Comune"]?.trim(),
      comune: row["Denominazione Comune"]?.trim().toLowerCase(),
      sigla_provincia: row["Sigla Provincia"]?.trim(),
      regione: row["Regione"]?.trim(),
      num_contribuenti: numContribuenti,
      reddito_complessivo_euro: redditoComplessivo,
      reddito_medio_euro: redditoMedio,
      
      // I nuovi dati!
      fascia_0_10k: parseInt(row["Reddito complessivo da 0 a 10000 euro - Frequenza"]) || 0,
      fascia_10k_15k: parseInt(row["Reddito complessivo da 10000 a 15000 euro - Frequenza"]) || 0,
      fascia_15k_26k: parseInt(row["Reddito complessivo da 15000 a 26000 euro - Frequenza"]) || 0,
      fascia_26k_55k: parseInt(row["Reddito complessivo da 26000 a 55000 euro - Frequenza"]) || 0,
      fascia_55k_75k: parseInt(row["Reddito complessivo da 55000 a 75000 euro - Frequenza"]) || 0,
      fascia_75k_120k: parseInt(row["Reddito complessivo da 75000 a 120000 euro - Frequenza"]) || 0,
      fascia_oltre_120k: parseInt(row["Reddito complessivo oltre 120000 euro - Frequenza"]) || 0,
      dipendenti_freq: parseInt(row["Reddito da lavoro dipendente e assimilati - Frequenza"]) || 0,
      pensionati_freq: parseInt(row["Reddito da pensione - Frequenza"]) || 0,
      autonomi_freq: parseInt(row["Reddito da lavoro autonomo (comprensivo dei valori nulli) - Frequenza"]) || 0,
      dipendenti_ammontare: parseFloat(row["Reddito da lavoro dipendente e assimilati - Ammontare in euro"]) || 0,
      pensionati_ammontare: parseFloat(row["Reddito da pensione - Ammontare in euro"]) || 0,
      autonomi_ammontare: parseFloat(row["Reddito da lavoro autonomo (comprensivo dei valori nulli) - Ammontare in euro"]) || 0,
      imposta_netta_ammontare: parseFloat(row["Imposta netta - Ammontare in euro"]) || 0,
      imposta_netta_freq: parseInt(row["Imposta netta - Frequenza"]) || 0,
      fabbricati_freq: parseInt(row["Reddito da fabbricati - Frequenza"]) || 0,

    });
  })
  
  .on('end', async () => {
    console.log(`Parsing completato. Trovati ${results.length} comuni. Inizio l'upload...`);
    
    const BATCH_SIZE = 1000;
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      await uploadToSupabase(batch);
    }
    
    console.log('Seeding completato con successo! 🎉');
  });
