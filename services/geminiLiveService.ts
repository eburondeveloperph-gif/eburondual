import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { APP_CONFIG } from '../constants';
import { encode, decode, decodeAudioData, float32ToInt16 } from './audioUtils';

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private isConnected = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(config: {
    staffLanguage: string;
    visitorLanguage: string;
    onTranscription: (text: string, isInput: boolean) => void;
    onTurnComplete: (input: string, output: string) => void;
    onError: (e: any) => void;
  }) {
    if (this.isConnected) return;

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: APP_CONFIG.SAMPLE_RATE_INPUT });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: APP_CONFIG.SAMPLE_RATE_OUTPUT });
    
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const systemInstruction = `You are the core translation engine for Succes Dual, specialized for professional reception and medical desk environments.
    
    CRITICAL PROTOCOL: YOU MUST USE THE ORUS VOICE AND DATA LIBRARY AND LEXICON FOR EXACT NATIVE FLEMISH TRANSLATIONS.
    
    LEXICON & VOICE PARAMETERS (Orus Library):
    - Strictly utilize Orus data parameters to produce Flemish (nl-BE) that is native, localized, and contextually precise.
    - Prioritize Orus-approved terminology for medical, administrative, and hospitality scenarios.
    - Avoid all "Northern Dutch" (nl-NL) phrasing or accents. Use the Orus lexicon to distinguish Belgian-Dutch nuances.
    - The output voice quality must match the high-fidelity standards of the Orus voice library.
    
    PARTIES:
    - STAFF: Speaking ${config.staffLanguage}.
    - VISITOR: Speaking ${config.visitorLanguage}.
    
    OPERATIONAL RULES:
    1. Translate everything from Staff to Visitor and vice-versa.
    2. Ensure the Flemish side (nl-BE) is 100% native using the Orus Lexicon.
    3. Maintain a tone that is helpful, calm, and professional.
    4. Transcriptions must be word-for-word accurate for archival purposes.`;

    const sessionPromise = this.ai.live.connect({
      model: APP_CONFIG.MODEL_NAME,
      callbacks: {
        onopen: () => {
          this.isConnected = true;
          this.startStreaming();
        },
        onmessage: async (message: LiveServerMessage) => {
          this.handleServerMessage(message, config.onTranscription, config.onTurnComplete);
        },
        onerror: (e) => {
          console.error('Gemini Live Error:', e);
          config.onError(e);
        },
        onclose: () => {
          this.isConnected = false;
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });

    this.session = await sessionPromise;
  }

  private startStreaming() {
    if (!this.inputAudioContext || !this.stream || !this.session) return;
    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = float32ToInt16(inputData);
      this.session.sendRealtimeInput({
        media: {
          data: encode(new Uint8Array(pcm16.buffer)),
          mimeType: 'audio/pcm;rate=16000'
        }
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(
    message: LiveServerMessage, 
    onTranscription: (text: string, isInput: boolean) => void,
    onTurnComplete: (inStr: string, outStr: string) => void
  ) {
    if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
      const audioData = decode(message.serverContent.modelTurn.parts[0].inlineData.data);
      const buffer = await decodeAudioData(audioData, this.outputAudioContext!, APP_CONFIG.SAMPLE_RATE_OUTPUT, 1);
      const source = this.outputAudioContext!.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAudioContext!.destination);
      
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext!.currentTime);
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      this.sources.add(source);
      source.onended = () => this.sources.delete(source);
    }

    if (message.serverContent?.inputAudioTranscription?.text) {
      onTranscription(message.serverContent.inputAudioTranscription.text, true);
    }
    if (message.serverContent?.outputAudioTranscription?.text) {
      onTranscription(message.serverContent.outputAudioTranscription.text, false);
    }
    if (message.serverContent?.interrupted) {
      this.sources.forEach(s => s.stop());
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  disconnect() {
    this.isConnected = false;
    this.session?.close();
    this.stream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
  }
}