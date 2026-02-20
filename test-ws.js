import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:1984');

ws.on('open', () => {
    ws.send(JSON.stringify({ id: 'test_1', type: 'EXECUTE_COMMAND', payload: 'whoami' }));
});

ws.on('message', (data) => {
    console.log(data.toString());
    process.exit(0);
});
