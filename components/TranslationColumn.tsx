
import React from 'react';
import { Message, LANGUAGES } from '../types';

interface TranslationColumnProps {
  title: string;
  subtitle: string;
  messages: Message[];
  type: 'staff' | 'visitor';
  staffLang: string;
  visitorLang: string;
}

export const TranslationColumn: React.FC<TranslationColumnProps> = ({ title, subtitle, messages, type, staffLang, visitorLang }) => {
  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-black/[0.04] shadow-sm">
      <div className="p-4 sm:p-7 pb-3 sm:pb-5 border-b border-black/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">{title}</h2>
            <p className="text-[8px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-0.5 sm:mt-1">{subtitle}</p>
          </div>
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-neutral-100 rounded-full">
            <span className="text-[8px] sm:text-[10px] font-black text-neutral-500 uppercase">
              {type === 'staff' ? staffLang.split('-')[1] : visitorLang.split('-')[1]}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 sm:space-y-10 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 select-none grayscale text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm font-bold tracking-tight">Listening for dialogue...</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isStaffColumn = type === 'staff';
          
          if (isStaffColumn) {
            return (
              <div key={msg.id} className="message-fade-in max-w-[95%]">
                {msg.sender === 'staff' ? (
                  <div className="p-4 sm:p-5 bg-[#007AFF] rounded-[1.5rem] sm:rounded-[2rem] rounded-tl-lg shadow-xl shadow-blue-500/10">
                    <p className="text-sm sm:text-[17px] font-semibold leading-relaxed text-white">
                      {msg.originalText}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 bg-neutral-50 border border-black/[0.03] rounded-[1.5rem] sm:rounded-[2rem] rounded-tl-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                       <span className="text-[8px] sm:text-[10px] font-black text-[#34C759] uppercase tracking-widest">Their Translation</span>
                    </div>
                    <p className="text-sm sm:text-[17px] font-bold text-neutral-900 leading-relaxed">
                      {msg.translatedText}
                    </p>
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-black/[0.04]">
                      <p className="text-[10px] sm:text-[12px] text-neutral-400 italic">
                        "{msg.originalText}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="message-fade-in max-w-[95%] ml-auto">
                {msg.sender === 'staff' ? (
                  <div className="p-4 sm:p-6 bg-white border border-black/[0.04] rounded-[1.8rem] sm:rounded-[2.5rem] rounded-tr-lg shadow-sm text-right">
                     <div className="flex items-center justify-end gap-2 mb-2 sm:mb-3">
                       <span className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest">Our Translation</span>
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                    <p className="text-lg sm:text-[24px] font-extrabold text-[#007AFF] leading-tight tracking-tight">
                      {msg.translatedText}
                    </p>
                    <p className="text-[11px] sm:text-[14px] text-neutral-400 italic mt-3 sm:mt-4 font-serif opacity-80 leading-relaxed">
                      {msg.originalText}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 bg-[#34C759] rounded-[1.5rem] sm:rounded-[2rem] rounded-tr-lg shadow-xl shadow-emerald-500/10 text-right">
                    <p className="text-sm sm:text-[17px] font-semibold leading-relaxed text-white">
                      {msg.originalText}
                    </p>
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};
