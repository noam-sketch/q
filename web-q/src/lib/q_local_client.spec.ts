import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QLocalClient } from './q_local_client.js';

describe('QLocal Client', () => {
    let client: QLocalClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messageCallback: any = null;

    beforeEach(() => {
        vi.clearAllMocks();
        messageCallback = null;
        
        class MockWS {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;
            
            public readyState = 1;

            send = vi.fn((data: string) => {
                const parsed = JSON.parse(data);
                if (messageCallback) {
                   if (parsed.payload === 'echo test') {
                       messageCallback({ data: JSON.stringify({ id: parsed.id, type: 'COMMAND_SUCCESS', payload: 'test output' }) });
                   } else if (parsed.payload === 'bad_cmd') {
                       messageCallback({ data: JSON.stringify({ id: parsed.id, type: 'ERROR', error: 'command failed' }) });
                   }
                }
            });

            close = vi.fn();
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            addEventListener = vi.fn((event: string, callback: (e?: any) => void) => {
                if (event === 'message') messageCallback = callback;
                if (event === 'open') callback();
            });
        }
        
        vi.stubGlobal('WebSocket', MockWS);
        client = new QLocalClient();
    });

    it('should initialize connected after timeout', async () => {
        await new Promise(r => setTimeout(r, 1500));
        expect(client.isConnected()).toBe(true);
    });

    it('should resolve command execution correctly', async () => {
        await new Promise(r => setTimeout(r, 1100));
        const result = await client.executeCommand('echo test');
        expect(result).toBe('test output');
    });

    it('should reject command execution on error', async () => {
        await new Promise(r => setTimeout(r, 1100));
        await expect(client.executeCommand('bad_cmd')).rejects.toThrow('command failed');
    });
});