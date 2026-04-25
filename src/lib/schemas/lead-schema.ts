import { z } from 'zod';

export const leadFormSchema = z.object({
  firstName: z.string().min(2, "Inserisci il tuo nome"),
  lastName: z.string().min(2, "Inserisci il tuo cognome"),
  email: z.string().email("Inserisci un'email valida"),
  phone: z.string().min(9, "Inserisci un numero di telefono valido"),
  contactTime: z.enum(["Mattina", "Pausa Pranzo", "Pomeriggio", "Sera", "Solo Email"]),
  maritalStatus: z.enum(["Single", "Convivente", "Sposato/a", "Divorziato/a"]),
  dependents: z.number().min(0, "Numero non valido"),
  taxFiling: z.enum(["730 / Modello Redditi", "Nessuna dichiarazione", "Non lo so"]),
  jobTitle: z.string().min(2, "Inserisci la tua qualifica (es. Impiegato, Sviluppatore...)"),
  jobTenure: z.enum(["Meno di 1 anno", "1-3 anni", "3-5 anni", "Oltre 5 anni"]),
  jobSatisfaction: z.number().min(1).max(10), 
  grossAnnualIncome: z.number().min(0, "Inserisci la RAL stimata (Lorda)"),
  careerGoal: z.enum([
    "Aumento di stipendio",
    "Cambio azienda / ruolo",
    "Cambio radicale carriera",
    "Miglioramento Work-Life balance",
    "Sto bene così"
  ]),
  tfrManagement: z.enum(["Lasciato in Azienda", "Fondo Pensione Negoziale", "Fondo Pensione Aperto/PIP", "Non applicabile / Autonomo", "Non lo so"]),
  activeInsurances: z.array(z.string()), // Rimosso .optional()
  riskTolerance: z.enum([
    "Bassa (Voglio proteggere il capitale)",
    "Media (Accetto oscillazioni moderate)",
    "Alta (Punto alla crescita, accetto cali anche del 20%)"
  ]),
  primaryFinancialGoal: z.enum([
    "Comprare casa",
    "Creare una rendita futura / Pensione",
    "Protezione dall'inflazione",
    "Gestire liquidità in eccesso",
    "Uscire dai debiti"
  ]),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "Devi accettare la Privacy Policy",
  }),
  partnerConsent: z.boolean(), // Rimosso .default(false)
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;