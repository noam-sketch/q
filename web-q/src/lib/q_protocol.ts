// src/lib/q_protocol.ts

export type QMessage = 
  | { type: 'INIT' }
  | { type: 'USER_INPUT', content: string }
  | { type: 'AI_RESPONSE', content: string }
  | { type: 'THINKING', content: string }
  | { type: 'ERROR', content: string }
  | { type: 'STATUS', content: string }
  | { type: 'CONFIG', apiKey: string, model: string };

export interface WorkerState {
  apiKey: string;
  model: string;
  systemPrompt: string;
}
