
import React from 'react';
import { LANGUAGES } from '../types';

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  color: 'blue' | 'green';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, value, onChange, color }) => {
  const accentClass = color === 'blue' ? 'text-blue-600' : 'text-green-600';
  const bgClass = color === 'blue' ? 'bg-blue-50' : 'bg-green-50';

  return (
    <div className="flex flex-col gap-1 w-full max-w-[180px]">
      <label className={`text-[10px] font-black uppercase tracking-widest ${accentClass} opacity-70 px-1`}>
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none w-full ${bgClass} hover:bg-white border border-black/5 text-neutral-900 text-sm font-bold py-3 pl-4 pr-10 rounded-2xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm`}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
