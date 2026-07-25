import React, { createContext, useContext, useState } from 'react';
import en from './en';
import ar from './ar';

const strings = { en, ar };

export const I18nContext = createContext({ t: en, lang: 'en', setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = strings[lang] || en;
  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
