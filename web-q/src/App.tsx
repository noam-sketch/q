import { useRef, useState, useEffect } from 'react';
import TerminalComponent, { TerminalRef } from './components/Terminal';
import Editor from './components/Editor';
import SettingsModal from './components/SettingsModal';
import { THEMES } from './lib/themes';
import './App.css';

function App() {
  const terminalRef = useRef<TerminalRef>(null);
  const [terminalWidth, setTerminalWidth] = useState(50); // Percentage
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isDragging = useRef(false);

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
    const savedClaudeModel = localStorage.getItem('q_claude_model') || 'claude-3-opus-20240229';
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
      
      {/* Settings Button */}
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
    </div>
  );
}

export default App;