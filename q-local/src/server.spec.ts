import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QLocalServer } from './server.js';
import { executeCommand } from './os_agent.js';
import { WebSocketServer } from 'ws';

vi.mock('ws', () => {
    return {
        WebSocketServer: vi.fn()
    };
});
vi.mock('./os_agent.js');

describe('QLocal Server', () => {
    let server: QLocalServer;

    beforeEach(() => {
        vi.clearAllMocks();
        server = new QLocalServer(1984);
    });

    afterEach(() => {
        server.stop();
    });

    it('should start WebSocketServer on correct port', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(WebSocketServer).mockImplementation(function(this: any) {
            this.on = vi.fn();
            this.close = vi.fn();
            return this;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        server.start();
        expect(WebSocketServer).toHaveBeenCalledWith({ port: 1984 });
    });

    it('should process EXECUTE_COMMAND messages and return stdout', async () => {
        const mockWs = {
            on: vi.fn(),
            send: vi.fn()
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(WebSocketServer).mockImplementation(function(this: any) {
            this.on = vi.fn((event: string, callback: (ws: unknown) => void) => {
                if (event === 'connection') callback(mockWs);
            });
            this.close = vi.fn();
            return this;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        vi.mocked(executeCommand).mockResolvedValue('test output');

        server.start();

        const messageCall = mockWs.on.mock.calls.find(call => call[0] === 'message');
        if (!messageCall) throw new Error('No handler');
        const messageHandler = messageCall[1];
        await messageHandler(JSON.stringify({
            id: 'req_123',
            type: 'EXECUTE_COMMAND',
            payload: 'echo test'
        }));

        expect(executeCommand).toHaveBeenCalledWith('echo test');
        expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
            id: 'req_123',
            type: 'COMMAND_SUCCESS',
            payload: 'test output'
        }));
    });

    it('should handle EXECUTE_COMMAND failures and return ERROR', async () => {
        const mockWs = {
            on: vi.fn(),
            send: vi.fn()
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(WebSocketServer).mockImplementation(function(this: any) {
            this.on = vi.fn((event: string, callback: (ws: unknown) => void) => {
                if (event === 'connection') callback(mockWs);
            });
            this.close = vi.fn();
            return this;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        vi.mocked(executeCommand).mockRejectedValue(new Error('command failed'));

        server.start();

        const messageCall = mockWs.on.mock.calls.find(call => call[0] === 'message');
        if (!messageCall) throw new Error('No handler');
        const messageHandler = messageCall[1];
        await messageHandler(JSON.stringify({
            id: 'req_456',
            type: 'EXECUTE_COMMAND',
            payload: 'bad_cmd'
        }));

        expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
            id: 'req_456',
            type: 'ERROR',
            error: 'command failed'
        }));
    });
});