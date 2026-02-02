
import React from 'react';
import { LANGUAGES } from '../types';

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, value, onChange }) => {
  const currentLang = LANGUAGES.find(l => l.code === value);
  const countryCode = value.split('-')[1] || 'UN';

  return (
    <div className="flex flex-col gap-1 w-full md:min-w-[130px]">
      <label className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] font-extrabold text-neutral-400 px-0.5 truncate">{label}</label>
      <div className="relative group">
        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 pointer-events-none">
          <span className="text-[8px] sm:text-[10px] font-black bg-neutral-200 text-neutral-500 px-1 sm:px-1.5 py-0.5 rounded-md leading-none">{countryCode}</span>
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs sm:text-sm font-bold py-2 sm:py-2.5 pl-8 sm:pl-12 pr-6 sm:pr-10 rounded-xl sm:rounded-2xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 border-none truncate"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
