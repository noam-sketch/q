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
  },
  'Merkabah Light': {
     background: '#f8f9fa',
     foreground: '#1c3144', // Deep etheric blue
     cursor: '#d4af37',     // Pure gold
     selectionBackground: '#e0e8f0', // Soft luminous blue
  }
};
