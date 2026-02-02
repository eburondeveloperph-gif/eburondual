
export enum AppState {
  LOGIN = 'LOGIN',
  TRANSLATOR = 'TRANSLATOR'
}

export interface Message {
  id: string;
  sender: 'staff' | 'visitor';
  originalText: string;
  translatedText: string;
  timestamp: number;
}

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English' },
  { code: 'fr-FR', name: 'French' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'de-DE', name: 'German' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-PT', name: 'Portuguese' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'ar-XA', name: 'Arabic' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ru-RU', name: 'Russian' }
];
