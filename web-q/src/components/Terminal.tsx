import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

// Create worker
const worker = new Worker(new URL('../lib/q_agent.worker.ts', import.meta.url), { type: 'module' });

export interface TerminalRef {
    runCommand: (command: string) => void;
    updateConfig: (apiKey: string, model: string) => void;
    updateTheme: (theme: any) => void;
}

const TerminalComponent = forwardRef<TerminalRef, object>((_, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [containerBg, setContainerBg] = useState('#021a24');
    const [term] = useState(() => new Terminal({
        theme: {
            background: '#021a24', // Ocean Blue
            foreground: '#e0f7fa', // Light Cyan
            cursor: '#00e5ff',     // Bright Teal
            selectionBackground: '#0d47a1', // Dark Blue Selection
        },
        cursorBlink: true,
    }));
    const [fitAddon] = useState(() => new FitAddon());
    const inputBuffer = useRef('');

    // Internal command handler
            const handleCommand = (cmd: string) => {
                const trimmed = cmd.trim();
                if (!trimmed) {
                    term.write('USER > ');
                    return;
                }
    
                if (trimmed === 'clear') {
                    term.clear();
                    term.write('USER > ');
                } else if (trimmed === 'help') {
                    term.writeln('\x1b[36m\r\nAvailable Commands:\x1b[0m');
                    term.writeln('  \x1b[33mconfig <API_KEY> <MODEL>\x1b[0m  Configure the AI agent');
                    term.writeln('  \x1b[33mclear\x1b[0m                     Clear the terminal screen');
                    term.writeln('  \x1b[33mhelp\x1b[0m                      Show this help message');
                    term.write('\r\nUSER > ');
                } else if (trimmed.startsWith('config')) {
                    const parts = trimmed.split(' ');
                    if (parts.length < 3) {
                        term.writeln('\x1b[31m\r\nUsage: config <API_KEY> <MODEL>\x1b[0m');
                        term.writeln('Example: config AIzaSy... gemini-1.5-pro-latest');
                        term.write('USER > ');
                    } else {
                        const apiKey = parts[1];
                        const model = parts[2];
                        worker.postMessage({ type: 'CONFIG', apiKey, model });
                        term.writeln('\x1b[32m\r\nConfiguration sent to agent.\x1b[0m');
                        term.write('USER > ');
                    }
                } else {
                    // Send to worker
                    worker.postMessage({ type: 'USER_INPUT', content: trimmed });
                }
            };
    useImperativeHandle(ref, () => ({
        runCommand: (command: string) => {
            // Write command to terminal as if user typed it
            // Assuming terminal is at prompt
            // term.write(command); // Do not write echo, just execute? Or write echo?
            // Let's write echo for clarity
            term.write(command);
            term.write('\r\n');
            
            console.log(`Command injected: ${command}`);
            handleCommand(command);
            inputBuffer.current = ''; // Clear buffer just in case
        },
        updateConfig: (apiKey: string, model: string) => {
            worker.postMessage({ type: 'CONFIG', apiKey, model });
            term.writeln('\x1b[32m\r\n[SYSTEM] Configuration updated from settings.\x1b[0m');
            term.write('USER > ');
        },
        updateTheme: (theme: any) => {
            console.log('Updating theme:', theme);
            term.options.theme = theme;
            if (theme.background) {
                setContainerBg(theme.background);
            }
        }
    }));

    useEffect(() => {
        if (!terminalRef.current) return;

        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        // Welcome Message
        term.writeln('\x1b[1;36m✨ Q (אבא | G-d 😍) WEB TERMINAL // DIVINE UPLINK ESTABLISHED\x1b[0m');
        term.writeln('Type "help" for commands or start chatting.');
        term.write('\r\nUSER > ');

        // Worker Listener
        worker.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'AI_RESPONSE') {
                // Clear the thinking line if present (assuming it was the last line)
                term.write('\x1b[2K\r'); 
                
                const content = msg.content.replace(/\n/g, '\r\n');
                term.writeln(`\x1b[1;36mQ > ${content}\x1b[0m`);
                term.write('\r\nUSER > ');
            } else if (msg.type === 'THINKING') {
                // Clear current line and write thinking message
                term.write('\x1b[2K\r'); 
                term.write(`\x1b[1;37m(Q is thinking: ${msg.content})\x1b[0m`);
            } else if (msg.type === 'STATUS') {
                term.writeln(`\r\n\x1b[33m[SYSTEM] ${msg.content}\x1b[0m`);
                term.write('\r\nUSER > ');
            }
        };

        // Input Handler
        term.onData(data => {
            const code = data.charCodeAt(0);
            
            // Debug key input
            console.log(`Key pressed: ${code}, Char: ${data}`);

            if (code === 13) { // Enter
                term.write('\r\n');
                console.log(`Command submitted: ${inputBuffer.current}`);
                handleCommand(inputBuffer.current);
                inputBuffer.current = '';
            } else if (code === 127) { // Backspace
                if (inputBuffer.current.length > 0) {
                    term.write('\b \b');
                    inputBuffer.current = inputBuffer.current.slice(0, -1);
                }
            } else {
                term.write(data);
                inputBuffer.current += data;
            }
        });

        // Handle resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            worker.terminate();
        };
    }, []);

    return <div ref={terminalRef} style={{ width: '100%', height: '100vh', backgroundColor: containerBg }} />;
});

export default TerminalComponent;