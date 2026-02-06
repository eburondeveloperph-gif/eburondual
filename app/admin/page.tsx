
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

interface AccessCode {
  code: string;
  createdAt: number;
  generationDuration: number; // in milliseconds
}

export default function AdminPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('succes_access_codes');
    if (stored) {
      try {
        setCodes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse codes', e);
      }
    }
  }, []);

  const generateCode = () => {
    // Track Performance Start
    const startTime = performance.now();

    // Logic: SI + 6 Digits + Text
    const digits = Math.floor(100000 + Math.random() * 900000); // 6 digits
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let text = "";
    for (let i = 0; i < 4; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const newCodeString = `SI${digits}${text}`;

    // Track Performance End
    const endTime = performance.now();
    const duration = endTime - startTime;

    const newEntry: AccessCode = {
      code: newCodeString,
      createdAt: Date.now(),
      generationDuration: duration
    };

    const updatedCodes = [newEntry, ...codes];
    setCodes(updatedCodes);
    localStorage.setItem('succes_access_codes', JSON.stringify(updatedCodes));
  };

  const deleteCode = (codeToDelete: string) => {
    if (confirm(`Delete code ${codeToDelete}?`)) {
      const updated = codes.filter(c => c.code !== codeToDelete);
      setCodes(updated);
      localStorage.setItem('succes_access_codes', JSON.stringify(updated));
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-roboto text-neutral-800">
      <header className="bg-white px-6 py-5 border-b border-black/5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-blue-600">Succes Dual</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Admin Console</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-[2rem] shadow-xl border border-black/5 overflow-hidden">
          
          {/* Generator Section */}
          <div className="p-8 border-b border-black/5 bg-neutral-50/50">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight mb-2">Stock Code Generator</h2>
                  <p className="text-sm text-neutral-500">Generate valid access keys for the Succes Dual platform. Format: SI + 6 Digits + Text.</p>
                </div>
                <button 
                  onClick={generateCode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New Code
                </button>
             </div>
          </div>

          {/* List Section */}
          <div className="p-0">
            {codes.length === 0 ? (
              <div className="p-20 text-center text-neutral-400">
                <p className="font-black uppercase tracking-widest text-xs">No active stock codes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    <tr>
                      <th className="px-8 py-4">Access Code</th>
                      <th className="px-8 py-4">Created At</th>
                      <th className="px-8 py-4">Perf. Time</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {codes.map((item) => (
                      <tr key={item.code} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-mono font-bold text-lg text-neutral-800 tracking-tight">{item.code}</span>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-neutral-700">{new Date(item.createdAt).toLocaleDateString()}</span>
                             <span className="text-xs text-neutral-400">{new Date(item.createdAt).toLocaleTimeString()}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold font-mono">
                             {item.generationDuration.toFixed(3)} ms
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => copyToClipboard(item.code)}
                              className="text-neutral-400 hover:text-blue-600 transition-colors"
                              title="Copy Code"
                            >
                              {copiedId === item.code ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                            <button 
                              onClick={() => deleteCode(item.code)}
                              className="text-neutral-400 hover:text-red-500 transition-colors"
                              title="Delete Code"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
