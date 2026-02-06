
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { History, Clock, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { AppState, Message, LANGUAGES, SavedSession } from '../types';
import { GeminiLiveService } from '../services/geminiLiveService';
import { TranslationColumn } from '../components/TranslationColumn';

export default function Home() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [staffLang, setStaffLang] = useState('nl-BE');
  const [visitorLang, setVisitorLang] = useState('en-US');
  const [staffSpeaker, setStaffSpeaker] = useState(true);
  const [visitorSpeaker, setVisitorSpeaker] = useState(true);
  
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  // History State
  const [history, setHistory] = useState<SavedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const liveService = useRef<GeminiLiveService | null>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('succes_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginCode.trim().toUpperCase();

    // 1. Admin Command Check
    if (clean === '//ADMIN') {
      router.push('/admin');
      return;
    }

    // 2. Load generated stock codes
    let validStockCodes: string[] = [];
    try {
      const stored = localStorage.getItem('succes_access_codes');
      if (stored) {
        const parsed = JSON.parse(stored);
        validStockCodes = parsed.map((item: any) => item.code);
      }
    } catch (e) {
      console.error('Error reading stock codes', e);
    }

    // 3. Validation Logic
    // Allow: Master Key (SUCCES2025), Generated Stock Codes, or Legacy/Debug formats
    const isMaster = clean === 'SUCCES2025';
    const isStockCode = validStockCodes.includes(clean);
    const isLegacy = /^(SI[A-Z]{2}\d{6}|AR\d{6}|DEBUG)$/.test(clean);

    if (isMaster || isStockCode || isLegacy) {
      setAppState(AppState.TRANSLATOR);
      setError(null);
    } else {
      setError('Invalid Access Code. Please check your stock entry.');
    }
  };

  const handleStoreLog = () => {
    if (messages.length === 0) {
      alert('No messages to store.');
      return;
    }

    const newSession: SavedSession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      preview: messages[messages.length - 1].originalText.substring(0, 50) + '...',
      messages: [...messages]
    };

    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('succes_history', JSON.stringify(updatedHistory));
    alert('Current session saved to History.');
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
      localStorage.removeItem('succes_history');
    }
  };

  const toggleMic = async () => {
    if (isListening) {
      liveService.current?.disconnect();
      setIsListening(false);
    } else {
      if (!liveService.current) liveService.current = new GeminiLiveService();
      const sLang = LANGUAGES.find(l => l.code === staffLang)?.name || 'Flemish';
      const vLang = LANGUAGES.find(l => l.code === visitorLang)?.name || 'English';
      try {
        await liveService.current.connect({
          staffLanguage: sLang,
          visitorLanguage: vLang,
          onTranscription: (text, isInput) => {
            if (isInput) setCurrentInput(prev => prev + text);
            else setCurrentOutput(prev => prev + text);
          },
          onTurnComplete: () => {},
          onError: () => {
            setError('Mic error.');
            setIsListening(false);
          }
        });
        setIsListening(true);
      } catch (err) {
        setError('Mic access denied.');
      }
    }
  };

  useEffect(() => {
    if ((currentInput || currentOutput) && isListening) {
      const timeout = setTimeout(() => {
        const newMessage: Message = {
          id: Math.random().toString(36).substr(2, 6).toUpperCase(),
          sender: currentInput ? 'staff' : 'visitor',
          originalText: currentInput || '...',
          translatedText: currentOutput || '...',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, newMessage]);
        setCurrentInput('');
        setCurrentOutput('');
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [currentInput, currentOutput, isListening]);

  if (appState === AppState.LOGIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-neutral-900">Succes Dual</h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-2">Professional Dialogue Engine</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-black/5">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-2">Access Code</label>
                <input
                  type="text"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="SUCCES2025"
                  className="w-full px-6 py-5 rounded-3xl bg-neutral-50 border-none focus:ring-4 focus:ring-blue-500/10 outline-none text-center font-black text-2xl tracking-tighter placeholder:text-neutral-200 uppercase"
                  maxLength={20}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-[10px] font-black text-center uppercase">{error}</p>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-blue-500/20 text-lg uppercase tracking-widest">
                Authorize
              </button>
            </form>
            <p className="mt-8 text-center text-[9px] text-neutral-300 font-black uppercase tracking-[0.2em]">
                Enter //ADMIN for Stock Generation
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden select-none relative">
      {/* Sketch Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-black/10 no-print z-40 relative">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-black tracking-tighter text-2xl">SUCCES DUAL</span>
          <span className="text-[10px] font-black text-blue-400/50 uppercase tracking-widest hidden sm:inline-block">(online ●)</span>
        </div>
        
        {/* History Link / Settings */}
        <button 
          onClick={() => setShowHistory(true)}
          className="group flex items-center gap-2 text-neutral-400 hover:text-blue-600 transition-colors px-3 py-2 rounded-xl hover:bg-blue-50"
        >
          <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-blue-600">History</span>
          <Clock className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </header>

      {/* Main Dual View - 2 Columns */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden relative z-0">
        <div className="flex-1 h-1/2 md:h-full">
          <TranslationColumn 
            title="YOU (Regular)" 
            subtitle="PRO"
            messages={messages} 
            type="staff" 
            language={staffLang}
            setLanguage={setStaffLang}
            speakerOn={staffSpeaker}
            setSpeakerOn={setStaffSpeaker}
          />
        </div>
        <div className="flex-1 h-1/2 md:h-full">
          <TranslationColumn 
            title="VISITOR" 
            subtitle="CLIENT"
            messages={messages} 
            type="visitor" 
            language={visitorLang}
            setLanguage={setVisitorLang}
            speakerOn={visitorSpeaker}
            setSpeakerOn={setVisitorSpeaker}
          />
        </div>

        {/* Floating Bubble for Real-time Dialogue */}
        {(currentInput || currentOutput) && isListening && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full max-w-lg px-6 no-print message-enter">
              <div className="bg-[#1D1D1F] text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/10 ring-8 ring-black/5">
                {currentInput && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">STT Transcription:</span>
                    <p className="text-lg font-bold text-neutral-200">"{currentInput}"</p>
                  </div>
                )}
                {currentOutput && (
                   <div className={`${currentInput ? 'mt-4 pt-4 border-t border-white/10' : ''}`}>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest block mb-1">Live Translation:</span>
                    <p className="text-xl font-black text-green-400 italic">"{currentOutput}"</p>
                   </div>
                )}
              </div>
           </div>
        )}
      </main>

      {/* History Modal Overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 slide-in-from-right">
            <div className="p-5 border-b border-black/5 flex items-center justify-between bg-neutral-50/80 backdrop-blur">
              <h2 className="text-xl font-black tracking-tight text-neutral-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                SESSION HISTORY
              </h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-black/5 rounded-full text-neutral-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-neutral-50">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                  <Clock className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">No Saved Logs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((session) => (
                    <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                      <div 
                        onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                        className="p-4 cursor-pointer hover:bg-blue-50/50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
                            {new Date(session.timestamp).toLocaleDateString()} • {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <p className="text-sm font-medium text-neutral-600 line-clamp-1 italic">"{session.preview}"</p>
                        </div>
                        {expandedSessionId === session.id ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                      </div>
                      
                      {expandedSessionId === session.id && (
                        <div className="border-t border-black/5 bg-neutral-50/50 p-4 max-h-64 overflow-y-auto custom-scrollbar space-y-3">
                           {session.messages.map((m, idx) => (
                             <div key={idx} className={`text-sm ${m.sender === 'staff' ? 'text-right' : 'text-left'}`}>
                               <span className={`text-[9px] font-black uppercase tracking-widest ${m.sender === 'staff' ? 'text-blue-500' : 'text-green-500'} block mb-0.5`}>
                                 {m.sender === 'staff' ? 'You' : 'Visitor'}
                               </span>
                               <div className={`inline-block p-2 rounded-lg ${m.sender === 'staff' ? 'bg-blue-100 text-blue-900 rounded-tr-none' : 'bg-green-100 text-green-900 rounded-tl-none'}`}>
                                 <p className="font-medium leading-snug">{m.originalText}</p>
                                 <p className="text-xs opacity-60 mt-1 border-t border-black/5 pt-1">{m.translatedText}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-black/5 bg-white">
               <button 
                onClick={clearHistory}
                className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-3 rounded-xl transition-colors text-xs font-black uppercase tracking-widest"
               >
                 <Trash2 className="w-4 h-4" />
                 Clear All Logs
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Sketch Footer */}
      <footer className="px-6 py-6 sm:py-10 bg-white border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-6 no-print z-10 relative">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleStoreLog}
            className="flex-1 sm:flex-none bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-black uppercase text-[10px] tracking-widest px-8 py-4 rounded-xl transition-all active:scale-95 border border-black/5"
          >
            [ STORE ]
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 sm:flex-none bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-black uppercase text-[10px] tracking-widest px-8 py-4 rounded-xl transition-all active:scale-95 border border-black/5"
          >
            [ PRINT ]
          </button>
        </div>

        <div className="flex items-center gap-4">
           <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] hidden lg:block">Single Mic Control</span>
           <button
            onClick={toggleMic}
            className={`group relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full transition-all duration-500 transform active:scale-90 ${
              isListening ? 'mic-active' : 'bg-blue-600 shadow-xl'
            }`}
          >
            <div className="relative z-10 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Ⓜ BIG MIC</span>
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
}
