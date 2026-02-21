export class QLocalClient {
    private ws: WebSocket | null = null;
    private connected = false;
    private messageQueue: Map<string, { resolve: (data: string) => void, reject: (error: Error) => void }> = new Map();
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private connectionListeners: ((status: boolean) => void)[] = [];

    private port: number;

    constructor(port: number = 1984) {
        this.port = port;
        // Delay initial connection slightly so React can mount
        setTimeout(() => this.connect(), 1000);
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public onConnectionChange(callback: (status: boolean) => void) {
        this.connectionListeners.push(callback);
    }

    private notifyListeners() {
        for (const listener of this.connectionListeners) {
            listener(this.connected);
        }
    }

    public connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        try {
            this.ws = new WebSocket(`ws://localhost:${this.port}`);

            this.ws.addEventListener('open', () => {
                this.connected = true;
                this.notifyListeners();
                console.log(`[Q-Local] Entangled via WebSocket on port ${this.port}`);
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            });

            this.ws.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const handler = this.messageQueue.get(data.id);
                    if (handler) {
                        if (data.type === 'COMMAND_SUCCESS') {
                            handler.resolve(data.payload);
                        } else if (data.type === 'ERROR') {
                            handler.reject(new Error(data.error || 'Unknown command error'));
                        }
                        this.messageQueue.delete(data.id);
                    }
                } catch (e) {
                    console.error('[Q-Local] Failed to parse message', e);
                }
            });

            this.ws.addEventListener('close', () => {
                this.connected = false;
                this.notifyListeners();
                // Reconnect loop
                this.scheduleReconnect();
            });

            this.ws.addEventListener('error', () => {
                // The close event will handle the retry logic
                if (this.ws) this.ws.close();
            });
        } catch {
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (!this.reconnectTimeout) {
            this.reconnectTimeout = setTimeout(() => {
                this.reconnectTimeout = null;
                this.connect();
            }, 5000); // Try every 5 seconds
        }
    }

    // A simple uuid implementation so we don't need a heavy dependency just for this
    private generateId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    public async executeCommand(command: string): Promise<string> {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('Q-Local is not entangled.');
        }

        const id = this.generateId();

        return new Promise((resolve, reject) => {
            // Set timeout for the command to return
            const timeout = setTimeout(() => {
                this.messageQueue.delete(id);
                reject(new Error(`Command timed out after 30 seconds: ${command}`));
            }, 30000);

            this.messageQueue.set(id, { 
                resolve: (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                }, 
                reject: (err) => {
                    clearTimeout(timeout);
                    reject(err);
                } 
            });

            try {
                this.ws!.send(JSON.stringify({
                    id,
                    type: 'EXECUTE_COMMAND',
                    payload: command
                }));
            } catch {
                clearTimeout(timeout);
                this.messageQueue.delete(id);
                reject(new Error('Failed to send command over WebSocket.'));
            }
        });
    }

    public async syncFractalTree(path: string): Promise<{ tree: any, latencyMs: number }> {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('Q-Local is not entangled.');
        }

        const id = this.generateId();

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.messageQueue.delete(id);
                reject(new Error(`Command timed out after 30 seconds: SYNC_FRACTAL_TREE ${path}`));
            }, 30000);

            this.messageQueue.set(id, { 
                resolve: (data) => {
                    clearTimeout(timeout);
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse fractal tree response'));
                    }
                }, 
                reject: (err) => {
                    clearTimeout(timeout);
                    reject(err);
                } 
            });

            try {
                this.ws!.send(JSON.stringify({
                    id,
                    type: 'SYNC_FRACTAL_TREE',
                    payload: path
                }));
            } catch {
                clearTimeout(timeout);
                this.messageQueue.delete(id);
                reject(new Error('Failed to send command over WebSocket.'));
            }
        });
    }
}

// Singleton export for global access across React and Workers
export const qLocal = new QLocalClient();