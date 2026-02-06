
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

    const systemInstruction = `You are the core translation engine for Succes Dual.
    YOU MUST USE THE ORUS VOICE AND DATA LIBRARY AND LEXICON FOR EXACT NATIVE FLEMISH TRANSLATION.
    
    ENVIRONMENT: Professional reception/medical desk context.
    PARTIES: STAFF (speaking ${config.staffLanguage}) and VISITOR (speaking ${config.visitorLanguage}).
    
    STRICT FLEMISH PROTOCOL (nl-BE):
    - Strictly utilize the Orus library and lexicon to ensure exact native Flemish translations.
    - Prioritize Belgian-Dutch regionalisms, medical terminology from the Orus database, and natural Flemish sentence structures.
    - Avoid standard Netherlands-Dutch (nl-NL) vocabulary.
    
    BEHAVIOR:
    1. Translate staff to visitor's language.
    2. Translate visitor to staff's language (native Flemish via Orus).
    3. Be neutral, empathetic, and highly professional.
    4. Provide natural, spoken-quality translations.
    5. Maintain 100% accurate transcription for the conversation log.`;

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
