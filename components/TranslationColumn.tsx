
import React, { useEffect, useRef } from 'react';
import { Message, LANGUAGES } from '../types';

interface TranslationColumnProps {
  title: string;
  subtitle: string;
  messages: Message[];
  type: 'staff' | 'visitor';
  language: string;
  setLanguage: (code: string) => void;
  speakerOn: boolean;
  setSpeakerOn: (on: boolean) => void;
}

export const TranslationColumn: React.FC<TranslationColumnProps> = ({ 
  title, 
  subtitle, 
  messages, 
  type, 
  language, 
  setLanguage,
  speakerOn,
  setSpeakerOn
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStaffCol = type === 'staff';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white border border-black/10 rounded-xl overflow-hidden shadow-md">
      {/* Header as per Sketch */}
      <div className={`p-4 ${isStaffCol ? 'column-header-blue' : 'column-header-green'} bg-neutral-50`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
             <h2 className="text-xl font-black uppercase tracking-tighter text-neutral-800">{title}</h2>
             <span className="text-[10px] font-bold text-neutral-400 bg-neutral-200 px-1.5 py-0.5 rounded leading-none">
                {subtitle}
             </span>
          </div>
          <button 
            onClick={() => setSpeakerOn(!speakerOn)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              speakerOn ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-neutral-200 text-neutral-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Speaker {speakerOn ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Language:</label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent border-none text-sm font-black text-neutral-800 focus:ring-0 cursor-pointer p-0"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.name} ({l.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Section */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-white">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs font-black uppercase tracking-[0.2em]">(scrollable log)</p>
          </div>
        )}

        {messages.map((msg) => {
          const isSender = (isStaffCol && msg.sender === 'staff') || (!isStaffCol && msg.sender === 'visitor');
          
          return (
            <div key={msg.id} className="message-enter space-y-1">
              <div className="flex items-center gap-2 mb-1">
                 <span className={`text-[9px] font-black uppercase tracking-widest ${msg.sender === 'staff' ? 'text-blue-600' : 'text-green-600'}`}>
                    [Turn #{msg.id.slice(0, 3)}]
                 </span>
              </div>
              
              {/* Transcription (Small gray cursive) */}
              <p className="text-[11px] text-neutral-400 italic font-medium leading-tight">
                 small gray: "{msg.originalText}"
              </p>
              
              {/* BIG translation/result */}
              <div className={`p-3 rounded-lg ${isSender ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-800 text-white'}`}>
                <p className="text-lg font-black leading-tight tracking-tight uppercase">
                  {isSender ? `YOU SAID: ${msg.originalText}` : `TRANSLATED: ${msg.translatedText}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
