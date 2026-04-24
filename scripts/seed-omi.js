console.log('🚀 AVVIO SCRIPT OMI...');

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// 1. CONTROLLO VARIABILI D'AMBIENTE
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('🔴 ERRORE: Variabili Supabase mancanti nel file .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. CONTROLLO FILE
const FILE_ZONE = path.resolve(__dirname, '../QI_20252_ZONE.csv');
const FILE_VALORI = path.resolve(__dirname, '../QI_20252_VALORI.csv');

// Se i file sono nella root principale, usa queste righe invece delle due sopra:
// const FILE_ZONE = path.resolve(process.cwd(), 'QI_20252_ZONE.csv');
// const FILE_VALORI = path.resolve(process.cwd(), 'QI_20252_VALORI.csv');

if (!fs.existsSync(FILE_ZONE)) {
  console.error(`🔴 ERRORE: Non trovo il file ZONE qui: ${FILE_ZONE}`);
  process.exit(1);
}
if (!fs.existsSync(FILE_VALORI)) {
  console.error(`🔴 ERRORE: Non trovo il file VALORI qui: ${FILE_VALORI}`);
  process.exit(1);
}

const SEMESTRE = '2025H2';
const dizionarioZone = new Map();
const risultatiFinali = [];

const parseItaNum = (val) => {
  if (!val || val.trim() === '') return 0;
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
};

function caricaDizionarioZone() {
  return new Promise((resolve, reject) => {
    console.log('⏳ Fase 1: Lettura dizionario ZONE.csv...');
    fs.createReadStream(FILE_ZONE, { encoding: 'latin1' })
      .on('error', (err) => reject(`Errore lettura ZONE: ${err.message}`))
      .pipe(csv({ separator: ';', skipLines: 1 }))
      .on('data', (row) => {
        const linkZona = row['LinkZona'];
        if (linkZona) {
          dizionarioZone.set(linkZona, {
            zonaDescr: row['Zona_Descr']?.trim().replace(/'/g, ''),
            microzona: row['Microzona']?.trim() || null
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Dizionario caricato: ${dizionarioZone.size} zone trovate.`);
        resolve();
      })
      .on('error', reject);
  });
}

function elaboraValori() {
  return new Promise((resolve, reject) => {
    console.log('⏳ Fase 2: Elaborazione VALORI.csv...');
    fs.createReadStream(FILE_VALORI, { encoding: 'latin1' })
      .on('error', (err) => reject(`Errore lettura VALORI: ${err.message}`))
      .pipe(csv({ separator: ';', skipLines: 1 }))
      .on('data', (row) => {
        const tipologia = row['Descr_Tipologia']?.toLowerCase() || '';
        if (!tipologia.includes('abitazion')) return;

        const linkZona = row['LinkZona'];
        const infoZona = dizionarioZone.get(linkZona) || { zonaDescr: '', microzona: null };
        const comuneDecoded = row['Comune_descrizione']?.trim().toLowerCase();
        
        if (!comuneDecoded) return;

        risultatiFinali.push({
          comune: comuneDecoded,
          sigla_provincia: row['Prov']?.trim(),
          fascia_zona: `${row['Fascia']} - ${infoZona.zonaDescr}`, 
          microzona: infoZona.microzona,
          tipologia: row['Descr_Tipologia']?.trim(),
          vendita_min: parseItaNum(row['Compr_min']),
          vendita_max: parseItaNum(row['Compr_max']),
          affitto_min: parseItaNum(row['Loc_min']),
          affitto_max: parseItaNum(row['Loc_max']),
          semestre: SEMESTRE
        });
      })
      .on('end', () => {
        console.log(`✅ Elaborazione completata: ${risultatiFinali.length} record abitativi trovati.`);
        resolve();
      })
      .on('error', reject);
  });
}

async function uploadToSupabase() {
  if (risultatiFinali.length === 0) {
    console.log('⚠️ Nessun dato da caricare.');
    return;
  }
  
  console.log(`⏳ Fase 3: Avvio upload di ${risultatiFinali.length} record su Supabase...`);
  const BATCH_SIZE = 500;
  
  for (let i = 0; i < risultatiFinali.length; i += BATCH_SIZE) {
    const batch = risultatiFinali.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('omi_quotazioni').insert(batch);
    
    if (error) {
      console.error(`\n❌ Errore batch ${i}:`, error.message);
    } else {
      process.stdout.write(`\r✅ Inviati ${Math.min(i + BATCH_SIZE, risultatiFinali.length)} di ${risultatiFinali.length} record...`);
    }
  }
  console.log('\n🎉 Upload completato con successo!');
}

async function run() {
  try {
    await caricaDizionarioZone();
    await elaboraValori();
    await uploadToSupabase();
  } catch (err) {
    console.error('🔴 Si è verificato un errore critico:', err);
  }
}

run();
