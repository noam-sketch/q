#!/usr/bin/env node
import { QLocalServer } from './server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 1984;

console.log('Booting Q-Local Host Agent...');
const server = new QLocalServer(PORT);
server.start();

process.on('SIGINT', () => {
    console.log('Shutting down Q-Local...');
    server.stop();
    process.exit(0);
});