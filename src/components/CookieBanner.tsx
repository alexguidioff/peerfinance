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
      // Piccolo delay per evitare flash al primo render
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
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5">

        {/* Riga principale */}
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold mb-1">Utilizziamo i cookie</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Usiamo cookie tecnici (necessari al funzionamento) e cookie analytics per capire come
              viene usato il sito. Nessun cookie di marketing.{' '}
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {showDetails ? 'Nascondi dettagli' : 'Dettagli'}
              </button>
              {' · '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </p>

            {/* Dettagli espandibili */}
            {showDetails && (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                  <span>
                    <strong className="text-foreground">Tecnici</strong> — sempre attivi. Necessari
                    per il funzionamento del sito (sessioni, form, sicurezza).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                  <span>
                    <strong className="text-foreground">Analytics</strong> — opzionali. Raccolgono
                    dati anonimi sulle pagine visitate per migliorare il sito (es. Plausible /
                    Google Analytics). Nessun dato viene venduto o ceduto a inserzionisti.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottoni */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={acceptTechnicalOnly}
              className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2.5 transition-colors whitespace-nowrap"
            >
              Solo tecnici
            </button>
            <button
              onClick={acceptAll}
              className="text-xs font-bold bg-primary text-primary-foreground rounded-xl px-4 py-2.5 hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Accetta tutti
            </button>
          </div>

          {/* X per chiudere senza scegliere (conta come "solo tecnici") */}
          <button
            onClick={acceptTechnicalOnly}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}