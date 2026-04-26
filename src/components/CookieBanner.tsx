'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

const COOKIE_KEY = 'cookie_consent';

type ConsentState = {
  technical: true;   // sempre true, non modificabile
  analytics: boolean;
  decided: boolean;
};

function getStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeConsent(analytics: boolean) {
  const consent: ConsentState = { technical: true, analytics, decided: true };
  localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
  // Esponi globalmente per GTM / GA
  window.__cookieConsent = consent;
  // Se analytics è false e GA è caricato, disabilita
  if (!analytics && typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }
  if (analytics && typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored?.decided) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const acceptAll = () => {
    storeConsent(true);
    setVisible(false);
  };

  const acceptTechnicalOnly = () => {
    storeConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 md:p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-card border-2 border-border rounded-2xl md:rounded-[2rem] shadow-2xl p-5 md:p-6 relative">

        {/* X per chiudere (visibile in alto a destra su mobile, nascosta su desktop) */}
        <button
          onClick={acceptTechnicalOnly}
          className="absolute top-3 right-3 text-muted-foreground hover:bg-secondary rounded-full p-2 transition-colors md:hidden"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenitore Principale: Colonna su Mobile, Riga su Desktop */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">

          {/* Icona + Testo */}
          <div className="flex items-start gap-4 flex-1 w-full pr-8 md:pr-0">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <Cookie className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base font-bold mb-1 text-foreground">Utilizziamo i cookie</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                Usiamo cookie tecnici (necessari) e analytics per capire come
                viene usato il sito. Nessun marketing.{' '}
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="font-bold underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  {showDetails ? 'Nascondi dettagli' : 'Dettagli'}
                </button>
                <span className="mx-1.5">·</span>
                <Link href="/privacy" className="font-bold underline underline-offset-2 hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </p>

              {/* Dettagli espandibili */}
              {showDetails && (
                <div className="mt-4 space-y-3 text-xs md:text-sm font-medium text-muted-foreground border-t border-border pt-4">
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1 shadow-sm shadow-emerald-500/50" />
                    <span>
                      <strong className="text-foreground">Tecnici</strong> — sempre attivi. Necessari
                      per il funzionamento del sito (sessioni, form, sicurezza).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1 shadow-sm shadow-blue-500/50" />
                    <span>
                      <strong className="text-foreground">Analytics</strong> — opzionali. Raccolgono
                      dati anonimi sulle visite (es. Google Analytics). Nessun dato viene venduto.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottoni (Larghezza totale su mobile, in fila su desktop) */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={acceptTechnicalOnly}
              className="text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-secondary border-2 border-border rounded-xl px-5 py-3.5 sm:py-2.5 transition-colors w-full sm:w-auto text-center"
            >
              Solo tecnici
            </button>
            <button
              onClick={acceptAll}
              className="text-sm font-bold bg-primary text-primary-foreground rounded-xl px-5 py-3.5 sm:py-2.5 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full sm:w-auto text-center"
            >
              Accetta tutti
            </button>

            {/* X per chiudere (visibile in fila coi bottoni su desktop) */}
            <button
              onClick={acceptTechnicalOnly}
              className="hidden md:flex text-muted-foreground hover:bg-secondary rounded-full transition-colors shrink-0 p-2.5 ml-1"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
