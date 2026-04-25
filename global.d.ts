// types/global.d.ts
interface Window {
    gtag?: (...args: any[]) => void;
    __cookieConsent?: {
      technical: true;
      analytics: boolean;
      decided: boolean;
    };
  }