import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, model: string, themeName: string) => void;
}

const MODELS = [
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'claude-3-5-sonnet-20240620',
  'claude-3-opus-20240229'
];

export const THEMES: Record<string, any> = {
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

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [theme, setTheme] = useState('Ocean Blue');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('q_api_key');
    const storedModel = localStorage.getItem('q_model');
    const storedTheme = localStorage.getItem('q_theme');
    
    if (storedApiKey) setApiKey(storedApiKey);
    if (storedModel) setModel(storedModel);
    if (storedTheme && THEMES[storedTheme]) setTheme(storedTheme);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('q_api_key', apiKey);
    localStorage.setItem('q_model', model);
    localStorage.setItem('q_theme', theme);
    onSave(apiKey, model, theme);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Settings</h2>
        
        <div className="form-group">
          <label>API Key (Google/Anthropic)</label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder="Enter API Key..."
          />
        </div>

        <div className="form-group">
          <label>Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            {Object.keys(THEMES).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSave} className="btn-save">Save & Apply</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;