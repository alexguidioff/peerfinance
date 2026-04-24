// lib/schemas/health-score.ts
import { z } from 'zod';

export const healthScoreSchema = z.object({
  age: z.coerce.number({ message: "Inserisci un'età valida" })
    .min(18, "Devi avere almeno 18 anni")
    .max(99, "Inserisci un'età valida"),
  region: z.enum(['Nord', 'Centro', 'Sud', 'Isole'], { 
    message: "Seleziona un'area geografica" 
  }),
// ... il resto del codice

  monthlyNetIncome: z.coerce.number().min(0, "Il reddito non può essere negativo"),
  monthlyFixedExpenses: z.coerce.number().min(0, "Le spese non possono essere negative"),
  totalSavings: z.coerce.number().min(0, "I risparmi non possono essere negativi"),
  consumerDebt: z.coerce.number().min(0, "I debiti non possono essere negativi"),
});

// ... il resto del codice
