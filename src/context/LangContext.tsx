import React, { createContext, useContext, useState } from 'react';
import { Lang, TranslationKey, toCyrillic, translateKey } from '../translations';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  tx: (text: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('aqllimahalla_lang');
    return saved === 'cyr' ? 'cyr' : 'lat';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('aqllimahalla_lang', l);
    setLangState(l);
  };

  const t = (key: TranslationKey) => translateKey(key, lang);
  const tx = (text: string) => (lang === 'cyr' ? toCyrillic(text) : text);

  return <LangContext.Provider value={{ lang, setLang, t, tx }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
