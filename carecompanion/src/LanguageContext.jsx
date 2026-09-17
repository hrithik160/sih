import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import TRANSLATIONS_EN from './translations';

const INFERENCE_KEY = "7MrLAyB7arzzpx0wjaCY7XqyiBWUR4o5t9hCEhta-5wacf_f-Pu3W5apSe3ooHSC";
const BHASHINI_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";
const SERVICE_ID = "ai4bharat/indictrans-v2-all-gpu--t4";

const LANGUAGE_NAMES = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
  ta: "தமிழ்",
  mr: "मराठी",
  bn: "বাংলা",
  gu: "ગુજરાતી",
  ml: "മലയാളം",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  pa: "ਪੰਜਾਬੀ",
  sa: "संस्कृत",
  ne: "नेपाली",
  si: "سنڌي",
  mni: "মৈতৈলোন্",
};

const LanguageContext = createContext();

// --- Batch translate entire dictionary via Bhashini ---
const batchTranslate = async (texts, targetLang) => {
  try {
    const payload = {
      pipelineTasks: [{
        taskType: "translation",
        config: {
          language: { sourceLanguage: "en", targetLanguage: targetLang },
          serviceId: SERVICE_ID
        }
      }],
      inputData: {
        input: texts.map(t => ({ source: t }))
      }
    };

    const response = await fetch(BHASHINI_URL, {
      method: "POST",
      headers: {
        "Accept": "*/*",
        "Authorization": INFERENCE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      return result.pipelineResponse[0].output.map(o => o.target);
    }
    console.error("Bhashini error:", response.status);
    return texts; // fallback to English
  } catch (err) {
    console.error("Bhashini network error:", err);
    return texts;
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'en');
  const [translations, setTranslations] = useState(TRANSLATIONS_EN);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_language', language);

    if (language === 'en') {
      setTranslations(TRANSLATIONS_EN);
      return;
    }

    // Check localStorage cache for this language
    const cacheKey = `bhashini_dict_${language}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setTranslations(JSON.parse(cached));
        return;
      } catch (_) {}
    }

    // Batch-translate everything
    setIsTranslating(true);
    const keys = Object.keys(TRANSLATIONS_EN);
    const values = Object.values(TRANSLATIONS_EN);

    batchTranslate(values, language).then(translated => {
      const newDict = {};
      keys.forEach((k, i) => { newDict[k] = translated[i] || values[i]; });
      setTranslations(newDict);
      localStorage.setItem(cacheKey, JSON.stringify(newDict));
      setIsTranslating(false);
    });
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, isTranslating, LANGUAGE_NAMES }}>
      {isTranslating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-600 text-white text-xs font-bold text-center py-1 animate-pulse">
          Translating app... / ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ...
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

// The main translation hook — use this in every component
export const useT = () => {
  const { translations } = useContext(LanguageContext);

  const t = (key, vars = {}) => {
    let str = translations[key] || TRANSLATIONS_EN[key] || key;
    // Replace template vars like {n}, {title}, {time}
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return str;
  };

  return { t };
};

// Legacy <T> component for one-off uses
export const T = ({ children }) => {
  const { language, translations } = useLanguage();
  // Try to find this string in the dictionary
  const key = Object.keys(TRANSLATIONS_EN).find(k => TRANSLATIONS_EN[k] === children);
  if (key && translations[key]) return <>{translations[key]}</>;
  return <>{children}</>;
};
