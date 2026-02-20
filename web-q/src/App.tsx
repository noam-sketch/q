import { useRef, useState, useEffect } from 'react';
import TerminalComponent, { TerminalRef } from './components/Terminal';
import Editor from './components/Editor';
import SettingsModal from './components/SettingsModal';
import PricingModal from './components/PricingModal';
import { THEMES } from './lib/themes';
import { qLocal } from './lib/q_local_client';
import './App.css';

function App() {
  const terminalRef = useRef<TerminalRef>(null);
  const [terminalWidth, setTerminalWidth] = useState(50); // Percentage
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isKernelEntangled, setIsKernelEntangled] = useState(false);
  const isDragging = useRef(false);

  useEffect(() => {
      qLocal.onConnectionChange(setIsKernelEntangled);
  }, []);

  const handleRunCode = (code: string) => {
    if (terminalRef.current) {
        terminalRef.current.runCommand(code);
    }
  };

  const handleSaveSettings = (geminiModel: string, claudeModel: string, themeName: string) => {
    if (terminalRef.current) {
      terminalRef.current.updateConfig('', geminiModel, claudeModel);
      if (themeName && THEMES[themeName]) {
          console.log(`Applying theme: ${themeName}`, THEMES[themeName]);
          terminalRef.current.updateTheme({ ...THEMES[themeName] });
      }
    }
  };

  const startResize = () => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  };

  const stopResize = () => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const resize = (e: MouseEvent) => {
    if (isDragging.current) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      // Clamp width between 20% and 80%
      if (newWidth > 20 && newWidth < 80) {
        setTerminalWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
    
    // Load saved settings on mount
    const savedGeminiModel = localStorage.getItem('q_gemini_model') || localStorage.getItem('q_model') || 'gemini-2.5-pro';
    const savedClaudeModel = localStorage.getItem('q_claude_model') || 'claude-haiku-4-5';
    const savedTheme = localStorage.getItem('q_theme');
    
    // We need a slight delay to ensure terminal is ready
    if (terminalRef.current) {
       setTimeout(() => {
           if (terminalRef.current) {
               terminalRef.current.updateConfig('', savedGeminiModel, savedClaudeModel);
               if (savedTheme && THEMES[savedTheme]) {
                   terminalRef.current.updateTheme(THEMES[savedTheme]);
               }
           }
       }, 500);
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);

  return (
    <div className="App" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      
      {/* Header Actions */}
      <div className="header-actions">
        <div className="status-matrix" title={isKernelEntangled ? "Q-Local Agent is running. You have Kernel access." : "Q-Local Agent is offline. Pure Web Mode."}>
            <div className={`status-indicator ${isKernelEntangled ? 'entangled' : 'isolated'}`}></div>
            <span className="status-text">{isKernelEntangled ? 'KERNEL ENTANGLED' : 'ISOLATED'}</span>
        </div>
        {!isKernelEntangled && (
            <div className="q-local-download">
                <span>[⬇️ Download Q-Local]</span>
                <div className="dropdown-menu">
                    <a href="/q-local-macos" download>macOS (Intel/Apple Silicon)</a>
                    <a href="/q-local-windows.exe" download>Windows (x64)</a>
                    <a href="/q-local-linux" download>Linux (x64)</a>
                </div>
            </div>
        )}
        <button 
          className="pricing-trigger"
          onClick={() => setIsPricingOpen(true)}
        >
          Upgrade / Plans
        </button>
        <button 
          className="settings-trigger"
          onClick={() => setIsSettingsOpen(true)}
          title="Configure Q"
        >
          <svg className="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <div style={{ width: `${terminalWidth}%`, height: '100%' }}>
        <TerminalComponent ref={terminalRef} />
      </div>
      
      {/* Draggable Splitter */}
      <div
        onMouseDown={startResize}
        style={{
          width: '5px',
          height: '100%',
          backgroundColor: '#333',
          cursor: 'col-resize',
          zIndex: 10,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#00ff00')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#333')}
      />

      <div style={{ width: `${100 - terminalWidth}%`, height: '100%' }}>
        <Editor onRunCode={handleRunCode} />
      </div>

      {/* Footer Link */}
      <a 
        href="https://github.com/noam-sketch/q" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="github-footer-link"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="github-icon">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
        Open Source
      </a>
    </div>
  );
}

export default App;