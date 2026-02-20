import { runCLI } from './dist/index.js';
console.log("Loading CLI...");
runCLI(['node', 'dist/index.js', 'chat']).catch(console.error);
