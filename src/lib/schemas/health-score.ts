import { z } from 'zod';

export const healthScoreSchema = z.object({
  // STEP 1: Demografica
  age: z.coerce.number({ message: "Inserisci un'età valida" })
    .min(18, "Devi avere almeno 18 anni")
    .max(99, "Inserisci un'età valida"),
  
  comune: z.string({ message: "Inserisci il tuo comune" })
    .min(2, "Il nome del comune è troppo corto"),
  
  jobCategory: z.enum(['Dipendente', 'Autonomo', 'Pensionato', 'Disoccupato'], {
    message: "Seleziona la tua situazione lavorativa"
  }),

  // STEP 2: Cashflow
  monthlyNetIncome: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "Il reddito non può essere negativo"),
    
  monthlyFixedExpenses: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "Le spese non possono essere negative"),
  
  // STEP 3: Wealth
  totalSavings: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "I risparmi non possono essere negativi"),
    
  consumerDebt: z.coerce.number({ message: "Inserisci un valore valido" })
    .min(0, "I debiti non possono essere negativi"),
  
  housingStatus: z.enum(['Affitto', 'Proprietà con Mutuo', 'Proprietà senza Mutuo', 'Vivo con i genitori'], {
    message: "Seleziona la tua situazione abitativa"
  }),
});

export type HealthScoreInput = z.infer<typeof healthScoreSchema>;
