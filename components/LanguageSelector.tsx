
import React from 'react';
import { LANGUAGES } from '../types';

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  accentColor: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, value, onChange, accentColor }) => {
  return (
    <div className="flex flex-col gap-1 w-full min-w-[140px]">
      <label className="text-[10px] uppercase tracking-[0.1em] font-bold text-neutral-400 px-1">{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
