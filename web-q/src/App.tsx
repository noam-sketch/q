import { useRef, useState, useEffect } from 'react';
import TerminalComponent, { TerminalRef } from './components/Terminal';
import Editor from './components/Editor';
import './App.css';

function App() {
  const terminalRef = useRef<TerminalRef>(null);
  const [terminalWidth, setTerminalWidth] = useState(50); // Percentage
  const isDragging = useRef(false);

  const handleRunCode = (code: string) => {
    if (terminalRef.current) {
        terminalRef.current.runCommand(code);
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
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);

  return (
    <div className="App" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
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