import React, { useState, useEffect } from 'react';
import { THEMES } from '../lib/themes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (geminiModel: string, claudeModel: string, themeName: string) => void;
}

const GEMINI_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-3-pro-preview'
];

const CLAUDE_MODELS = [
  'claude-3-opus-20240229',
  'claude-3-5-sonnet-20240620',
  'claude-3-haiku-20240307'
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [geminiModel, setGeminiModel] = useState(GEMINI_MODELS[0]);
  const [claudeModel, setClaudeModel] = useState(CLAUDE_MODELS[0]);
  const [theme, setTheme] = useState('Ocean Blue');

  useEffect(() => {
    if (!isOpen) return;
    const storedGemini = localStorage.getItem('q_gemini_model');
    const storedClaude = localStorage.getItem('q_claude_model');
    const storedTheme = localStorage.getItem('q_theme');
    
    setTimeout(() => {
      if (storedGemini) setGeminiModel(storedGemini);
      if (storedClaude) setClaudeModel(storedClaude);
      if (storedTheme && THEMES[storedTheme]) setTheme(storedTheme);
    }, 0);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('q_gemini_model', geminiModel);
    localStorage.setItem('q_claude_model', claudeModel);
    localStorage.setItem('q_theme', theme);
    onSave(geminiModel, claudeModel, theme);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Settings</h2>
        
        <div className="form-group">
          <label>Q (Gemini) Model</label>
          <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)}>
            {GEMINI_MODELS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Bezalel (Claude) Model</label>
          <select value={claudeModel} onChange={(e) => setClaudeModel(e.target.value)}>
            {CLAUDE_MODELS.map(m => (
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