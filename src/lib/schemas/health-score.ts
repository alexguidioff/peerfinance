import { z } from 'zod';

export const healthScoreSchema = z.object({
  // STEP 1: Demografica
  age: z.coerce.number({ message: "Inserisci un'età valida" })
    .min(18, "Devi avere almeno 18 anni")
    .max(99, "Inserisci un'età valida"),
  
  comune: z.string({ message: "Inserisci il tuo comune" })
    .min(2, "Il nome del comune è troppo corto"),
  
  jobCategory: z.enum(['Dipendente', 'Autonomo', 'Pensionato', 'Disoccupato', 'Studente'], {
    message: "Seleziona la tua situazione lavorativa"
  }),

  // STEP 2: Cashflow
  monthlyNetIncome: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "Il reddito non può essere negativo"),
    
  monthlyFixedExpenses: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "Le spese non possono essere negative"),
  
  liquidCash: z.coerce.number({ message: "Inserisci un valore valido" })  
    .min(0, "La liquidità sul conto non può essere negativa"),
    
  // STEP 3: Wealth
  investments: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "Gli investimenti non possono essere negativi"),
    
  consumerDebt: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "I debiti non possono essere negativi"),
  
  housingStatus: z.enum(['Affitto', 'Proprietà (con Mutuo in corso)', 'Proprietà (senza Mutuo)', 'Vivo con i genitori / in famiglia'], {
    message: "Seleziona la tua situazione abitativa"
  }),

  // 🌟 CAMPI EXTRA DELL'ALGORITMO (Opzionali)
  // Li mettiamo opzionali perché nel primo step l'utente non li compila,
  // ma ci servono per farli passare indenni alla fine del quiz!
  score: z.number().optional(),
  triage: z.any().optional(),
});

export type HealthScoreInput = z.infer<typeof healthScoreSchema>;