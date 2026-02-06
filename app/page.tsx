
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { History, Clock, X, ChevronDown, ChevronUp, Trash2, Printer, Settings, Volume2 } from 'lucide-react';
import { AppState, Message, LANGUAGES, SavedSession } from '../types';
import { GeminiLiveService } from '../services/geminiLiveService';
import { TranslationColumn } from '../components/TranslationColumn';
import { LanguageSelector } from '../components/LanguageSelector';

const AVAILABLE_VOICES = [
  { id: 'Kore', name: 'Kore (Balanced)' },
  { id: 'Zephyr', name: 'Zephyr (Bright)' },
  { id: 'Puck', name: 'Puck (Soft)' },
  { id: 'Charon', name: 'Charon (Deep)' },
  { id: 'Fenrir', name: 'Fenrir (Strong)' }
];

export default function Home() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [staffLang, setStaffLang] = useState('nl-BE');
  const [visitorLang, setVisitorLang] = useState('en-US');
  const [staffSpeaker, setStaffSpeaker] = useState(true);
  const [visitorSpeaker, setVisitorSpeaker] = useState(true);
  
  // Voice Configuration State
  const [selectedVoice, setSelectedVoice] = useState('Kore');

  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  // UI States
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<SavedSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const liveService = useRef<GeminiLiveService | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('succes_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
    const savedVoice = localStorage.getItem('succes_voice');
    if (savedVoice) setSelectedVoice(savedVoice);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginCode.trim().toUpperCase();

    if (clean === '//ADMIN') {
      router.push('/admin');
      return;
    }

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

    const isMaster = clean === 'SUCCES2025';
    const isStockCode = validStockCodes.includes(clean);
    const isLegacy = /^(SI[A-Z]{2}\d{6}|AR\d{6}|DEBUG)$/.test(clean);

    if (isMaster || isStockCode || isLegacy) {
      setAppState(AppState.TRANSLATOR);
      setError(null);
    } else {
      setError('Invalid Access Code.');
    }
  };

  const handleStoreLog = () => {
    if (messages.length === 0) return;
    const newSession: SavedSession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      preview: messages[messages.length - 1].originalText.substring(0, 50) + '...',
      messages: [...messages]
    };
    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('succes_history', JSON.stringify(updatedHistory));
    alert('Log stored.');
  };

  const clearHistory = () => {
    if (confirm('Clear history?')) {
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
          voiceName: selectedVoice,
          onTranscription: (text, isInput) => {
            if (isInput) setCurrentInput(prev => prev + text);
            else setCurrentOutput(prev => prev + text);
          },
          onTurnComplete: () => {},
          onError: () => setIsListening(false)
        });
        setIsListening(true);
      } catch (err) {
        setError('Mic error.');
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
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-2">Professional Translator</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-black/5">
            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="ACCESS CODE"
                className="w-full px-6 py-5 rounded-3xl bg-neutral-50 border-none focus:ring-4 focus:ring-blue-500/10 outline-none text-center font-black text-2xl tracking-tighter uppercase"
                autoFocus
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl transition-all text-lg uppercase">
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden select-none relative">
      <header className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-white border-b border-black/10 no-print z-40 relative">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 h-11">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <span className="text-blue-600 font-black tracking-tighter text-2xl leading-none">SUCCES DUAL</span>
          </div>
          <div className="hidden md:block">
            <LanguageSelector label="Ours (Staff)" value={staffLang} onChange={setStaffLang} color="blue" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="hidden md:block">
            <LanguageSelector label="Theirs (Visitor)" value={visitorLang} onChange={setVisitorLang} color="green" />
          </div>
          
          <div className="flex md:hidden gap-2 w-full">
             <LanguageSelector label="Ours" value={staffLang} onChange={setStaffLang} color="blue" />
             <LanguageSelector label="Theirs" value={visitorLang} onChange={setVisitorLang} color="green" />
          </div>

          <div className="flex items-center gap-2 border-l border-black/10 pl-4 h-11">
            <button onClick={() => setShowHistory(true)} className="p-3 hover:bg-blue-50 text-neutral-400 hover:text-blue-600 rounded-xl transition-all flex items-center justify-center h-11 w-11" title="History">
              <Clock className="w-5 h-5" />
            </button>
            <button onClick={() => window.print()} className="p-3 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800 rounded-xl transition-all flex items-center justify-center h-11 w-11" title="Print Log">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-3 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded-xl transition-all flex items-center justify-center h-11 w-11" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden relative">
        <div className="flex-1 h-1/2 lg:h-full">
          <TranslationColumn 
            title="Ours" 
            subtitle="STAFF"
            messages={messages} 
            type="staff" 
            language={staffLang}
            setLanguage={setStaffLang}
            speakerOn={staffSpeaker}
            setSpeakerOn={setStaffSpeaker}
          />
        </div>
        <div className="flex-1 h-1/2 lg:h-full">
          <TranslationColumn 
            title="Theirs" 
            subtitle="VISITOR"
            messages={messages} 
            type="visitor" 
            language={visitorLang}
            setLanguage={setVisitorLang}
            speakerOn={visitorSpeaker}
            setSpeakerOn={setVisitorSpeaker}
          />
        </div>

        {(currentInput || currentOutput) && isListening && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-6 no-print message-enter">
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

      {/* History Sidebar */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform slide-in-from-right">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2"><Clock className="w-5 h-5" /> History</h2>
              <button onClick={() => setShowHistory(false)} className="p-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
              {history.length === 0 ? <p className="text-center text-neutral-400 py-10 font-black uppercase text-xs">No logs found</p> : 
                history.map(session => (
                  <div key={session.id} className="bg-white p-4 rounded-xl mb-4 border shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 mb-1">{new Date(session.timestamp).toLocaleString()}</p>
                    <p className="text-sm italic text-neutral-600 line-clamp-2">"{session.preview}"</p>
                  </div>
                ))
              }
            </div>
            <div className="p-4 border-t">
               <button onClick={clearHistory} className="w-full text-red-500 py-3 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all">Clear Logs</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sidebar */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform slide-in-from-right">
            <div className="p-5 border-b flex items-center justify-between bg-neutral-50/50">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X className="w-6 h-6 text-neutral-500" /></button>
            </div>
            
            <div className="flex-1 p-6 space-y-10 overflow-y-auto">
               <section>
                 <div className="flex items-center gap-2 mb-6">
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Voice Configuration</h3>
                 </div>
                 
                 <div className="space-y-6">
                   <div>
                     <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-1">Translation Output Voice</label>
                     <div className="relative">
                        <select 
                          value={selectedVoice}
                          onChange={(e) => {
                            setSelectedVoice(e.target.value);
                            localStorage.setItem('succes_voice', e.target.value);
                          }}
                          className="w-full bg-neutral-100 hover:bg-white border border-black/5 text-neutral-900 font-bold py-4 px-5 rounded-2xl appearance-none cursor-pointer transition-all focus:ring-4 focus:ring-blue-500/10 outline-none"
                        >
                          {AVAILABLE_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronDown className="w-5 h-5" /></div>
                     </div>
                     <p className="mt-3 text-[10px] text-neutral-400 font-medium leading-relaxed italic px-1">
                       * Change will apply upon the next microphone activation. High-fidelity Orus lexicon parameters are maintained across all voice types.
                     </p>
                   </div>
                 </div>
               </section>

               <section className="pt-10 border-t border-black/5">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 ml-1">Platform Details</h3>
                 <div className="bg-neutral-50 rounded-2xl p-5 border border-black/5 space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-neutral-500 uppercase">Engine</span>
                     <span className="text-[10px] font-black text-blue-600">Gemini 2.5 Live</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-neutral-500 uppercase">Lexicon</span>
                     <span className="text-[10px] font-black text-green-600">Orus Library V4.2</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-neutral-500 uppercase">Mode</span>
                     <span className="text-[10px] font-black text-neutral-800">Dual Native (nl-BE/Multi)</span>
                   </div>
                 </div>
               </section>
            </div>

            <div className="p-6 border-t bg-neutral-50/50">
               <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-neutral-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-[0.98]"
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}

      <footer className="px-6 py-6 sm:py-10 bg-white border-t flex items-center justify-center relative no-print">
        <button onClick={handleStoreLog} className="absolute left-6 bg-neutral-100 hover:bg-neutral-200 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Store Session</button>
        <button
          onClick={toggleMic}
          className={`relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full transition-all duration-500 transform active:scale-90 ${isListening ? 'mic-active' : 'bg-blue-600 shadow-xl'}`}
        >
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Ⓜ BIG MIC</span>
          </div>
        </button>
      </footer>
    </div>
  );
}
