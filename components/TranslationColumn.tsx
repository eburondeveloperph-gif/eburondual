
import React from 'react';
import { Message } from '../types';

interface TranslationColumnProps {
  title: string;
  subtitle: string;
  messages: Message[];
  type: 'staff' | 'visitor';
}

export const TranslationColumn: React.FC<TranslationColumnProps> = ({ title, subtitle, messages, type }) => {
  return (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-sm rounded-3xl overflow-hidden border border-black/[0.03] shadow-sm">
      <div className="p-6 pb-4 border-b border-black/[0.05]">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">{title}</h2>
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mt-1">{subtitle}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-sm font-medium italic">Conversation will appear here</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isStaffColumn = type === 'staff';
          
          if (isStaffColumn) {
            // Staff Column: [Staff Original] or [Visitor Translation]
            return (
              <div key={msg.id} className="fade-in max-w-[90%]">
                {msg.sender === 'staff' ? (
                  <div className="p-4 bg-blue-600 rounded-2xl rounded-tl-none shadow-md shadow-blue-500/10">
                    <p className="text-[15px] font-medium leading-relaxed text-white">
                      {msg.originalText}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-black/[0.05] rounded-2xl rounded-tl-none shadow-sm">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Visitor Speaking</p>
                    <p className="text-[15px] font-semibold text-neutral-900 leading-relaxed">
                      {msg.translatedText}
                    </p>
                    <p className="text-[11px] text-neutral-400 italic mt-2 border-t border-black/[0.03] pt-2">
                      "{msg.originalText}"
                    </p>
                  </div>
                )}
              </div>
            );
          } else {
            // Visitor Column: [Staff Translation (Large)] or [Visitor Original]
            return (
              <div key={msg.id} className="fade-in max-w-[90%] ml-auto">
                {msg.sender === 'staff' ? (
                  <div className="p-5 bg-white border border-black/[0.05] rounded-3xl rounded-tr-none shadow-sm text-right">
                    <p className="text-[20px] font-bold text-blue-600 leading-tight">
                      {msg.translatedText}
                    </p>
                    <p className="text-[12px] text-neutral-400 italic mt-3 font-serif opacity-70">
                      "{msg.originalText}"
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500 rounded-2xl rounded-tr-none shadow-md shadow-emerald-500/10 text-right">
                    <p className="text-[15px] font-medium leading-relaxed text-white">
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
