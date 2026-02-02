
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Message, LANGUAGES } from './types';
import { GeminiLiveService } from './services/geminiLiveService';
import { TranslationColumn } from './components/TranslationColumn';
import { LanguageSelector } from './components/LanguageSelector';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [staffLang, setStaffLang] = useState('nl-BE'); // Default to Flemish
  const [visitorLang, setVisitorLang] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  const liveService = useRef<GeminiLiveService | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const siRegex = /^SI[A-Z]{2}\d{6}$/;
    const arRegex = /^AR\d{6}$/;
    const officialCodes = ['EBURON2025', 'DEBUG'];
    
    if (siRegex.test(loginCode) || arRegex.test(loginCode) || officialCodes.includes(loginCode)) {
      setAppState(AppState.TRANSLATOR);
      setError(null);
    } else {
      setError('Invalid professional code. Try EBURON2025');
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
            setError('Connection interrupted.');
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
          id: Math.random().toString(36).substr(2, 9),
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5F7] p-4 sm:p-6 message-fade-in">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 sm:mb-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#007AFF] rounded-[1.8rem] sm:rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 sm:mb-10 shadow-2xl shadow-blue-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-[900] tracking-tighter text-neutral-900 mb-2 sm:mb-3">Eburon Dual</h1>
            <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-[11px]">Professional Authentication</p>
          </div>
          <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-black/[0.04]">
            <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-3">Professional Code</label>
                <input
                  type="text"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                  placeholder="EBURON2025"
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] bg-neutral-100 border-none focus:ring-4 focus:ring-blue-500/10 outline-none text-center font-black text-xl sm:text-2xl tracking-tighter placeholder:text-neutral-300 transition-all"
                  maxLength={10}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-[11px] font-black text-center uppercase tracking-wider">{error}</p>}
              <button
                type="submit"
                className="w-full bg-[#007AFF] hover:bg-blue-600 active:scale-[0.98] text-white font-black py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] transition-all shadow-xl shadow-blue-500/20 text-base sm:text-lg"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F7] overflow-hidden">
      <header className="apple-blur border-b border-black/[0.04] px-4 sm:px-10 py-4 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#007AFF] text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-[900] tracking-tighter text-neutral-900 leading-none">Eburon Dual</h1>
            <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mt-1 sm:mt-2 block">{loginCode}</span>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-10 items-center bg-white/40 p-2 sm:p-2.5 px-3 sm:px-4 rounded-[1.5rem] sm:rounded-[2rem] border border-black/[0.04] w-full md:w-auto">
          <LanguageSelector label="Ours (Pro)" value={staffLang} onChange={setStaffLang} />
          <div className="h-8 sm:h-10 w-[1px] bg-black/[0.06]" />
          <LanguageSelector label="Theirs (Visitor)" value={visitorLang} onChange={setVisitorLang} />
        </div>

        <div className="hidden md:flex gap-4">
          <button onClick={() => window.print()} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white hover:bg-neutral-50 text-neutral-800 transition-all border border-black/[0.05] shadow-sm active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-10 p-4 sm:p-10 overflow-hidden relative">
        <div className="flex-1 h-1/2 lg:h-full">
          <TranslationColumn title="Ours" subtitle="Professional Dialogue" messages={messages} type="staff" staffLang={staffLang} visitorLang={visitorLang} />
        </div>
        <div className="flex-1 h-1/2 lg:h-full">
          <TranslationColumn title="Theirs" subtitle="Visitor Assistance" messages={messages} type="visitor" staffLang={staffLang} visitorLang={visitorLang} />
        </div>

        {/* Apple Dynamic Island Style Indicator */}
        {(currentInput || currentOutput) && isListening && (
           <div className="absolute top-4 sm:top-12 left-1/2 -translate-x-1/2 z-50 message-fade-in w-full max-w-sm sm:max-w-xl px-4">
              <div className="bg-[#1D1D1F] text-white p-4 sm:p-5 rounded-[1.8rem] sm:rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 flex">
                   <div className={`h-full transition-all duration-300 ${currentInput ? 'w-1/2 bg-blue-500' : 'w-0'}`} />
                   <div className={`h-full transition-all duration-300 ${currentOutput ? 'w-1/2 bg-emerald-500' : 'w-0'}`} />
                </div>
                {currentInput && (
                  <div className="flex items-start gap-3 sm:gap-4 mb-2">
                    <span className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md mt-0.5">Ours</span>
                    <p className="text-sm sm:text-[16px] font-bold text-neutral-200 leading-snug">{currentInput}</p>
                  </div>
                )}
                {currentOutput && (
                   <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 flex items-start gap-3 sm:gap-4">
                    <span className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md mt-0.5">Theirs</span>
                    <p className="text-sm sm:text-[16px] font-black text-emerald-400 leading-snug italic tracking-tight">{currentOutput}</p>
                   </div>
                )}
              </div>
           </div>
        )}
      </main>

      <footer className="px-6 sm:px-12 py-6 sm:py-12 flex items-center justify-center relative">
        <button
          onClick={toggleMic}
          className={`group relative flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full transition-all duration-500 transform active:scale-90 ${
            isListening 
              ? 'bg-[#FF3B30] mic-glow-active' 
              : 'bg-[#007AFF] mic-glow'
          }`}
        >
          {isListening && (
             <div className="absolute inset-[-10px] sm:inset-[-15px] rounded-full border-[4px] sm:border-[6px] border-[#FF3B30]/10 animate-ping" />
          )}
          <div className="relative z-10 scale-110 sm:scale-125">
            {isListening ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </div>
          <span className={`absolute -bottom-8 sm:-bottom-12 whitespace-nowrap text-[9px] sm:text-[11px] font-[900] uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-colors ${isListening ? 'text-red-500' : 'text-neutral-400'}`}>
            {isListening ? 'End Session' : 'Begin Dialogue'}
          </span>
        </button>
        
        <div className="absolute right-6 sm:right-12 bottom-6 sm:bottom-12 text-right opacity-30 select-none hidden sm:block">
           <p className="text-[10px] sm:text-[12px] font-black text-neutral-900 tracking-tighter uppercase">Eburon Live Engine</p>
           <p className="text-[8px] sm:text-[10px] text-neutral-600 tracking-widest font-bold uppercase">Dual Language Tablet Mode</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
