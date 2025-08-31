import type { Chat } from "@google/genai";

export type ActiveTab = 'chat' | 'image' | 'video' | 'sheets' | 'history';

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: number;
  prompts?: string[];
}

export interface GeneratedMedia {
    id: string;
    type: 'image' | 'video';
    prompt: string;
    url: string;
    caption: string;
    timestamp: number;
}


export interface SheetPrompt {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  resultUrl?: string;
  caption?: string;
}

export interface Sheet {
  id: string;
  name: string;
  type: 'image' | 'video';
  prompts: SheetPrompt[];
}