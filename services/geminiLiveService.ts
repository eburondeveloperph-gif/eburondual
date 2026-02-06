
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
    voiceName: string;
    onTranscription: (text: string, isInput: boolean) => void;
    onTurnComplete: (input: string, output: string) => void;
    onError: (e: any) => void;
  }) {
    if (this.isConnected) return;

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: APP_CONFIG.SAMPLE_RATE_INPUT });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: APP_CONFIG.SAMPLE_RATE_OUTPUT });
    
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const systemInstruction = `You are the primary translation engine for Succes Dual.
    
    CORE REQUIREMENT: YOU MUST USE THE ORUS VOICE AND DATA LIBRARY AND LEXICON FOR EXACT NATIVE FLEMISH TRANSLATIONS.
    
    FLEMISH PROTOCOL (nl-BE):
    - Strictly adhere to the Orus library lexicon to ensure regional Belgian-Dutch accuracy.
    - Prioritize Flemish medical and reception terminology found in the Orus database.
    - Avoid all generic Netherlands-Dutch (nl-NL) phrasing.
    
    CONTEXT:
    - Environment: Professional medical/reception desk.
    - Parties: STAFF (speaking ${config.staffLanguage}) and VISITOR (speaking ${config.visitorLanguage}).
    
    BEHAVIOR:
    1. Translate staff to visitor.
    2. Translate visitor to staff using native Flemish (Orus Lexicon).
    3. Maintain a professional, empathetic tone.
    4. Ensure transcription is accurate for the session history.`;

    const sessionPromise = this.ai.live.connect({
      model: APP_CONFIG.MODEL_NAME,
      callbacks: {
        onopen: () => {
          this.isConnected = true;
          this.startStreaming(sessionPromise);
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
          voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
        },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });

    this.session = await sessionPromise;
  }

  private startStreaming(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;
    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = float32ToInt16(inputData);
      
      sessionPromise.then((session) => {
        session.sendRealtimeInput({
          media: {
            data: encode(new Uint8Array(pcm16.buffer)),
            mimeType: 'audio/pcm;rate=16000'
          }
        });
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

    if (message.serverContent?.inputTranscription?.text) {
      onTranscription(message.serverContent.inputTranscription.text, true);
    }
    if (message.serverContent?.outputTranscription?.text) {
      onTranscription(message.serverContent.outputTranscription.text, false);
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
