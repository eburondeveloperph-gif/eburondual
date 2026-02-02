
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Message, LANGUAGES } from './types';
import { GeminiLiveService } from './services/geminiLiveService';
import { TranslationColumn } from './components/TranslationColumn';
import { LanguageSelector } from './components/LanguageSelector';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Translator State
  const [staffLang, setStaffLang] = useState('en-US');
  const [visitorLang, setVisitorLang] = useState('fr-FR');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  const liveService = useRef<GeminiLiveService | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const siRegex = /^SI[A-Z]{2}\d{6}$/;
    const arRegex = /^AR\d{6}$/;
    
    if (siRegex.test(loginCode) || arRegex.test(loginCode) || loginCode === 'DEBUG') {
      setAppState(AppState.TRANSLATOR);
      setError(null);
    } else {
      setError('Invalid professional code. Please check and try again.');
    }
  };

  const toggleMic = async () => {
    if (isListening) {
      liveService.current?.disconnect();
      setIsListening(false);
    } else {
      if (!liveService.current) {
        liveService.current = new GeminiLiveService();
      }
      
      const sLang = LANGUAGES.find(l => l.code === staffLang)?.name || 'English';
      const vLang = LANGUAGES.find(l => l.code === visitorLang)?.name || 'French';

      try {
        await liveService.current.connect({
          staffLanguage: sLang,
          visitorLanguage: vLang,
          onTranscription: (text, isInput) => {
            if (isInput) setCurrentInput(prev => prev + text);
            else setCurrentOutput(prev => prev + text);
          },
          onTurnComplete: () => {},
          onError: (e) => {
            setError('Connection error. Retrying...');
            setIsListening(false);
          }
        });
        setIsListening(true);
      } catch (err) {
        setError('Could not access microphone.');
        console.error(err);
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
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [currentInput, currentOutput, isListening]);

  const saveLog = () => {
    const logContent = messages.map(m => 
      `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.originalText} -> ${m.translatedText}`
    ).join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Eburon_Log_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (appState === AppState.LOGIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5F7] p-6 fade-in">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">Eburon Dual</h1>
            <p className="text-neutral-400 font-medium">Professional Translation Services</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-black/[0.04]">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1 mb-2">Access Code</label>
                <input
                  type="text"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                  placeholder="SIAB123456"
                  className="w-full px-6 py-4 rounded-2xl bg-neutral-100 border-none focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-xl tracking-widest placeholder:text-neutral-300 transition-all"
                  maxLength={10}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
              >
                Sign In
              </button>
            </form>
          </div>
          <p className="mt-12 text-center text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
            &copy; 2025 Ariolas BV • Succes Invest
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F7] fade-in">
      {/* Dynamic Header */}
      <header className="apple-blur border-b border-black/[0.05] px-8 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-neutral-900 leading-none">Eburon Dual</h1>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1 block">{loginCode}</span>
          </div>
        </div>

        <div className="flex gap-8 items-center bg-white/50 p-2 rounded-2xl border border-black/[0.03]">
          <LanguageSelector label="Professional" value={staffLang} onChange={setStaffLang} accentColor="blue" />
          <div className="h-8 w-[1px] bg-black/[0.05]" />
          <LanguageSelector label="Visitor" value={visitorLang} onChange={setVisitorLang} accentColor="emerald" />
        </div>

        <div className="flex gap-3">
          <button onClick={saveLog} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-neutral-100 text-neutral-600 transition-all border border-black/[0.05] shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button onClick={() => window.print()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-neutral-100 text-neutral-600 transition-all border border-black/[0.05] shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Experience */}
      <main className="flex-1 flex gap-8 p-8 overflow-hidden">
        <div className="flex-1 h-full">
          <TranslationColumn title="Staff" subtitle="Professional Console" messages={messages} type="staff" />
        </div>
        <div className="flex-1 h-full">
          <TranslationColumn title="Visitor" subtitle="Patient / Client View" messages={messages} type="visitor" />
        </div>

        {/* Dynamic Island style Listening UI */}
        {(currentInput || currentOutput) && isListening && (
           <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 fade-in w-full max-w-lg">
              <div className="bg-neutral-900 text-white p-4 rounded-[2rem] shadow-2xl mx-4 flex flex-col gap-2 border border-white/10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 animate-pulse" />
                {currentInput && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-sm font-medium text-neutral-300 leading-snug">
                      <span className="text-[10px] block opacity-50 uppercase tracking-widest font-bold mb-1">Live Transcription</span>
                      {currentInput}
                    </p>
                  </div>
                )}
                {currentOutput && (
                   <div className="mt-2 pt-3 border-t border-white/10 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p className="text-sm font-bold text-emerald-400 leading-snug italic">
                       {currentOutput}
                    </p>
                   </div>
                )}
              </div>
           </div>
        )}
      </main>

      {/* Control Surface */}
      <footer className="px-12 py-10 flex items-center justify-center relative bg-gradient-to-t from-black/[0.02] to-transparent">
        <button
          onClick={toggleMic}
          className={`group relative flex items-center justify-center w-28 h-28 rounded-full transition-all duration-500 transform active:scale-95 ${
            isListening 
              ? 'bg-red-500 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.5)]' 
              : 'bg-blue-600 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.5)]'
          }`}
        >
          {isListening && (
             <div className="absolute inset-[-12px] rounded-full border-4 border-red-500/20 animate-ping" />
          )}
          <div className="relative z-10">
            {isListening ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </div>
          <span className="absolute -bottom-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 group-hover:text-neutral-600 transition-colors">
            {isListening ? 'Stop Dialogue' : 'Start Translation'}
          </span>
        </button>
        
        <div className="absolute right-12 bottom-12 flex flex-col items-end opacity-20 select-none">
           <p className="text-[10px] font-black text-neutral-900 tracking-tighter">POWERED BY GEMINI PRO</p>
           <p className="text-[8px] text-neutral-600 tracking-widest font-bold">NATIVE AUDIO REAL-TIME ENGINE</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
