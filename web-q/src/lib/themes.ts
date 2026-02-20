export interface Theme {
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
}

export const THEMES: Record<string, Theme> = {
  'Ocean Blue': {
    background: '#021a24',
    foreground: '#e0f7fa',
    cursor: '#00e5ff',
    selectionBackground: '#0d47a1',
  },
  'Classic Dark': {
    background: '#1a1a1a',
    foreground: '#ffffff',
    cursor: '#00ff00',
    selectionBackground: '#333333',
  },
  'Matrix Green': {
    background: '#000000',
    foreground: '#00ff41',
    cursor: '#00ff41',
    selectionBackground: '#003b00',
  },
  'Cyberpunk': {
     background: '#0f0b1e',
     foreground: '#00ff9f', // Neon Green text
     cursor: '#ff0055',     // Neon Pink cursor
     selectionBackground: '#7df9ff',
  }
};
