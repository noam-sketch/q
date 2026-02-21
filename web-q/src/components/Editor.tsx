import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface EditorProps {
    onRunCode: (code: string) => void;
}

const Editor: React.FC<EditorProps> = ({ onRunCode }) => {
    const [code, setCode] = React.useState("// Write your prompt or code here...\n\n");

    const onChange = React.useCallback((val: string) => {
        setCode(val);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--theme-panel)', borderLeft: '1px solid var(--theme-border)' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--theme-bg)', display: 'flex', gap: '10px', borderBottom: '1px solid var(--theme-border)' }}>
                <button 
                    onClick={() => onRunCode(code)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--theme-accent)',
                        color: 'var(--theme-bg)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}
                >
                    ▶ Run
                </button>
                <button 
                    onClick={() => setCode('')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--theme-border)',
                        color: 'var(--theme-text)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Clear
                </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                <CodeMirror
                    value={code}
                    height="100%"
                    theme={oneDark}
                    extensions={[javascript({ jsx: true })]}
                    onChange={onChange}
                    style={{ fontSize: '14px' }}
                />
            </div>
        </div>
    );
};

export default Editor;
