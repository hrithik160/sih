import React from 'react';
import { useLanguage } from './LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage, LANGUAGE_NAMES, isTranslating } = useLanguage();

  return (
    <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
      <Globe className={`w-3.5 h-3.5 ${isTranslating ? 'text-amber-500 animate-spin' : 'text-slate-500'}`} />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer border-none max-w-[80px]"
      >
        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    </div>
  );
}
