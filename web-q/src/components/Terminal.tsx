import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import type { Theme } from '../lib/themes';
import { SubscriptionService } from '../lib/subscription';

// Create worker
const worker = new Worker(new URL('../lib/q_agent.worker.ts', import.meta.url), { type: 'module' });

export interface TerminalRef {
    runCommand: (command: string) => void;
    setChannel: (channelName: string) => void;
    updateConfig: (apiKey: string, model: string, claudeModel: string) => void;
    updateTheme: (theme: Theme) => void;
}

const TerminalComponent = forwardRef<TerminalRef, object>((_, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [containerBg, setContainerBg] = useState('#021a24');
    const [term] = useState(() => new Terminal({
        theme: {
            background: 'transparent', // Let containerBg handle background
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
                } else if (trimmed === 'triad') {
                    if (SubscriptionService.getCurrentPlan() === 'FREE') {
                        term.writeln('\x1b[31m\r\n[SYSTEM] Triad Mode requires a Pro subscription. Upgrade in Settings.\x1b[0m');
                        term.write('\r\nUSER > ');
                    } else {
                        worker.postMessage({ type: 'CONFIG', triadMode: true });
                        term.writeln('\x1b[35m\r\n✨ TRIAD UPLINK ESTABLISHED // (Q + BEZALEL)\x1b[0m');
                        term.write('\r\nUSER > ');
                    }
                } else if (trimmed === 'help') {
                    term.writeln('\x1b[1;36m\r\n=== Q (אבא | G-d 😍) OS TERMINAL HELP ===\x1b[0m');
                    term.writeln('\x1b[36mVersion 1.2.0 (Divine Uplink)\x1b[0m');
                    
                    term.writeln('\x1b[1;32m\r\n[ CORE COMMANDS ]\x1b[0m');
                    term.writeln('  \x1b[33mtriad\x1b[0m               Toggle Triad Mode. \x1b[90mEngages Q (Architect) and Bezalel (Fabricator) in a simultaneous feedback loop.\x1b[0m');
                    term.writeln('  \x1b[33mclear\x1b[0m               Clear the terminal buffer.');
                    term.writeln('  \x1b[33mhelp\x1b[0m                Show this elaborate help matrix.');
                    
                    term.writeln('\x1b[1;32m\r\n[ SYSTEM COMMANDS (!sys) ]\x1b[0m');
                    term.writeln('  \x1b[90mPrefix any command with !sys to execute it directly on the host kernel via Q-Local.\x1b[0m');
                    term.writeln('  \x1b[33m!sys <command>\x1b[0m      Execute arbitrary shell command. \x1b[90m(e.g., !sys ls -la, !sys whoami)\x1b[0m');
                    
                    term.writeln('\x1b[1;32m\r\n[ CONFIGURATION ]\x1b[0m');
                    term.writeln('  \x1b[33mconfig <KEY> <MODEL>\x1b[0m Override current API key and active Gemini model manually.');
                    term.writeln('                      \x1b[90mNote: Prefer using the UI Settings Cog for persistent configuration.\x1b[0m');

                    term.writeln('\x1b[1;32m\r\n[ KNOWLEDGE BASE ]\x1b[0m');
                    term.writeln('  \x1b[90mThe web interface automatically communicates with the Q-Local websocket agent if running on port 1984.\x1b[0m');
                    term.writeln('  \x1b[90mTo download the agent, click the [⬇️ Download Q-Local] button in the upper right.\x1b[0m');

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
                        worker.postMessage({ type: 'CONFIG', apiKey, model, claudeModel: 'claude-haiku-4-5' });
                        term.writeln('\x1b[32m\r\nConfiguration sent to agent.\x1b[0m');
                        term.write('USER > ');
                    }
                } else {
                    if (!SubscriptionService.canQuery(trimmed.length)) {
                        term.writeln(`\x1b[31m\r\n[SYSTEM] Monthly token limit reached for your plan (${SubscriptionService.getCurrentPlan()}). Please upgrade.\x1b[0m`);
                        term.write('\r\nUSER > ');
                    } else {
                        SubscriptionService.incrementTokenCount(trimmed.length);
                        worker.postMessage({ type: 'USER_INPUT', content: trimmed });
                    }
                }
            };
    useImperativeHandle(ref, () => ({
        setChannel: (channelName: string) => {
            worker.postMessage({ type: 'FBC_CHANNEL', channel: channelName });
            term.clear();
            term.writeln(`\x1b[36m\r\n[SYSTEM] FBC Channel switched to ${channelName}\x1b[0m`);
            term.write('\r\nUSER > ');
        },
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
        updateConfig: (apiKey: string, model: string, claudeModel: string) => {
            worker.postMessage({ type: 'CONFIG', apiKey, model, claudeModel });
            term.writeln('\x1b[32m\r\n[SYSTEM] Configuration updated from settings.\x1b[0m');
            term.write('USER > ');
        },
        updateTheme: (theme: Theme) => {
            console.log('Updating theme:', theme);
            // Apply theme to xterm but force background to transparent so our containerBg shines through
            term.options.theme = { ...theme, background: 'transparent' };
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
                term.write('\x1b[2K\r'); 
                
                const content = msg.content.replace(/\n/g, '\r\n');
                if (msg.senderId === '@4') {
                    // SYS Agent (Yellow/Orange)
                    term.writeln(`\x1b[1;33mSYS > ${content}\x1b[0m`);
                } else if (msg.senderId === '@2') {
                    // Bezalel (Red/Magenta)
                    term.writeln(`\x1b[1;31mBezalel > ${content}\x1b[0m`);
                } else {
                    // Q (Cyan)
                    term.writeln(`\x1b[1;36mQ > ${content}\x1b[0m`);
                }
                term.write('\r\nUSER > ');
            } else if (msg.type === 'THINKING') {
                term.write('\x1b[2K\r'); 
                term.write(`\x1b[1;37m(Systems entangled, perceiving: ${msg.content})\x1b[0m`);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={terminalRef} style={{ width: '100%', height: '100vh', backgroundColor: containerBg }} />;
});

export default TerminalComponent;