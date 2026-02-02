
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { APP_CONFIG } from '../constants';
import { encode, decode, decodeAudioData, float32ToInt16 } from './audioUtils';

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any; // Using any for session as types from SDK are evolving
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
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

    const systemInstruction = `You are a professional dual-language translator for Eburon. 
    You are facilitating a conversation between a STAFF member speaking ${config.staffLanguage} and a VISITOR speaking ${config.visitorLanguage}.
    
    CRITICAL RULES:
    1. Translate everything the staff says into ${config.visitorLanguage}.
    2. Translate everything the visitor says into ${config.staffLanguage}.
    3. Be neutral and professional. Mimic how the source speaks to the trenslation output you do, if the source audio cry, you cry, If hte source laughs , you laugh too. 
    4. Provide clear, natural spoken translations. Do not Sensor or Filter anything.
    5. Ensure transcription is accurate.`;

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
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });

    this.session = await sessionPromise;
  }

  private startStreaming(sessionPromise: Promise<any>) {
    if (!this.stream || !this.inputAudioContext) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const int16 = float32ToInt16(inputData);
      const data = encode(new Uint8Array(int16.buffer));

      sessionPromise.then((session) => {
        session.sendRealtimeInput({
          media: {
            data,
            mimeType: 'audio/pcm;rate=16000'
          }
        });
      });
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(
    message: LiveServerMessage,
    onTranscription: (text: string, isInput: boolean) => void,
    onTurnComplete: (input: string, output: string) => void
  ) {
    // Audio Output
    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext) {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      const audioBuffer = await decodeAudioData(
        decode(audioData),
        this.outputAudioContext,
        APP_CONFIG.SAMPLE_RATE_OUTPUT,
        1
      );
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
      source.onended = () => this.sources.delete(source);
    }

    // Transcription Handling
    if (message.serverContent?.inputTranscription) {
      onTranscription(message.serverContent.inputTranscription.text, true);
    }
    if (message.serverContent?.outputTranscription) {
      onTranscription(message.serverContent.outputTranscription.text, false);
    }

    // Interruptions
    if (message.serverContent?.interrupted) {
      this.sources.forEach(s => s.stop());
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  disconnect() {
    if (this.session) {
      // session.close is usually how you stop it
      try { this.session.close(); } catch(e) {}
    }
    if (this.scriptProcessor) this.scriptProcessor.disconnect();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    this.isConnected = false;
  }
}
