import { WebSocketServer, WebSocket } from 'ws';
import { executeCommand } from './os_agent.js';

export interface QLocalMessage {
    id: string;
    type: 'EXECUTE_COMMAND';
    payload: string;
}

export class QLocalServer {
    private port: number;
    private wss: WebSocketServer | null = null;

    constructor(port: number = 1984) {
        this.port = port;
    }

    public start(): void {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Client connected to Q-Local.');

            ws.on('message', async (data: string) => {
                try {
                    const message = JSON.parse(data.toString()) as QLocalMessage;

                    if (message.type === 'EXECUTE_COMMAND') {
                        try {
                            const stdout = await executeCommand(message.payload);
                            ws.send(JSON.stringify({
                                id: message.id,
                                type: 'COMMAND_SUCCESS',
                                payload: stdout
                            }));
                        } catch (error: unknown) {
                            const errStr = error instanceof Error ? error.message : String(error);
                            ws.send(JSON.stringify({
                                id: message.id,
                                type: 'ERROR',
                                error: errStr
                            }));
                        }
                    } else {
                        ws.send(JSON.stringify({
                            id: message.id,
                            type: 'ERROR',
                            error: `Unknown command type: ${message.type}`
                        }));
                    }
                } catch (e: unknown) {
                    const errStr = e instanceof Error ? e.message : String(e);
                    ws.send(JSON.stringify({ type: 'ERROR', error: `Failed to parse message: ${errStr}` }));
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected from Q-Local.');
            });
        });

        console.log(`Q-Local Server started on ws://localhost:${this.port}`);
    }

    public stop(): void {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
            console.log('Q-Local Server stopped.');
        }
    }
}