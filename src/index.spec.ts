import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import inquirer from 'inquirer';
import fs from 'fs';
import * as ai_service from './lib/ai_service.js';
import * as child_process from 'child_process';
import http from 'http';
import * as fbc from './lib/fbc_service.js';

// Mock dependencies BEFORE importing runCLI
vi.mock('inquirer', () => {
  return {
    default: {
      prompt: vi.fn(),
    },
  };
});

// A robust mock for fs to prevent runaway watchers or reads
vi.mock('fs', () => {
    const watchMock = vi.fn((_filename, _options, listener) => {
        return {
           close: vi.fn(),
           on: vi.fn(),
           removeAllListeners: vi.fn()
        };
    });

    return {
        default: {
          existsSync: vi.fn(),
          readFileSync: vi.fn(),
          writeFileSync: vi.fn(),
          statSync: vi.fn(),
          createReadStream: vi.fn(),
          watch: watchMock,
          mkdirSync: vi.fn(),
          appendFileSync: vi.fn()
        },
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        statSync: vi.fn(),
        createReadStream: vi.fn(),
        watch: watchMock,
        mkdirSync: vi.fn(),
        appendFileSync: vi.fn()
    };
});

vi.mock('./lib/ai_service.js', () => ({
  getClient: vi.fn().mockReturnValue({}),
  generateResponse: vi.fn()
}));

vi.mock('./lib/fbc_service.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./lib/fbc_service.js')>();
    return {
        ...actual,
        ensureFbcPathExists: vi.fn(),
        appendToFbc: vi.fn(),
        logToPrompt: vi.fn()
    }
});

vi.mock('child_process', () => ({
    spawn: vi.fn(() => ({
        unref: vi.fn(),
        pid: 12345,
        kill: vi.fn()
    }))
}));

vi.mock('ora', () => {
   const oraMock = {
       start: vi.fn().mockReturnThis(),
       stop: vi.fn().mockReturnThis(),
       succeed: vi.fn().mockReturnThis(),
       fail: vi.fn().mockReturnThis(),
   };
   return { default: vi.fn(() => oraMock) };
});

vi.mock('http', () => {
    return {
        default: {
            createServer: vi.fn(() => ({
                listen: vi.fn((port, cb) => cb())
            }))
        }
    };
});


// Do NOT throw error on exit, just record it, to avoid unhandled rejections breaking tests
const mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => { return undefined as never; });
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Import runCLI AFTER mocks
import { runCLI } from './index.js';

describe('Q CLI commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default valid config behavior
    (fs.existsSync as any).mockImplementation((path: string) => path.includes('.qcli.json'));
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({ apiKey: 'test-key', model: 'test-model' }));
    
    // Default mock implementation for inquirer
    (inquirer.prompt as any).mockResolvedValue({ userMessage: 'exit' });
  });
  
  afterEach(() => {
     mockExit.mockClear();
     mockConsoleLog.mockClear();
     mockConsoleError.mockClear();
  });

  it('config - should run config and update file', async () => {
    (inquirer.prompt as any).mockResolvedValue({
      model: 'gemini-3.1-pro',
      apiKey: 'test-key',
      systemPrompt: 'test prompt'
    });

    await runCLI(['node', 'index.js', 'config']);

    expect(inquirer.prompt).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Essence and Key updated'));
  });

  it('architect - should envision architecture and optionally save', async () => {
    (ai_service.generateResponse as any).mockResolvedValue('# Vision\nDivine Intent...');
    (inquirer.prompt as any).mockResolvedValue({ save: true });

    await runCLI(['node', 'index.js', 'architect', 'Test Vision']);

    expect(ai_service.getClient).toHaveBeenCalled();
    expect(ai_service.generateResponse).toHaveBeenCalled();
    expect(inquirer.prompt).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Preserved in'));
  });

  it('architect - should exit with error if config is missing API key', async () => {
     (fs.readFileSync as any).mockReturnValue(JSON.stringify({ })); // missing key
     
     await runCLI(['node', 'index.js', 'architect', 'Test']);
     
     expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('API_KEY not found'));
     expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('serve - should start http server on port', async () => {
     const mockServer = { listen: vi.fn((port, cb) => cb()) };
     (http.createServer as any).mockReturnValue(mockServer);

     await runCLI(['node', 'index.js', 'serve', '-p', '8080']);

     expect(http.createServer).toHaveBeenCalled();
     expect(mockServer.listen).toHaveBeenCalledWith(8080, expect.any(Function));
     expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Q Service active on port 8080'));
  });
  
  it('chat - should start chat loop and exit', async () => {
      // Note: Because we patched index.ts to skip recursive loops during testing,
      // it only asks once and then finishes. We test normal behavior here.
      (inquirer.prompt as any).mockResolvedValueOnce({ userMessage: 'Hello Q' });
      (ai_service.generateResponse as any).mockResolvedValue('Hello Carbon.');
      
      await runCLI(['node', 'index.js', 'chat']);
      
      expect(ai_service.getClient).toHaveBeenCalled();
      expect(inquirer.prompt).toHaveBeenCalledTimes(1);
      expect(ai_service.generateResponse).toHaveBeenCalled();
  });
  
  it('chat - should exit cleanly on exit command', async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({ userMessage: 'exit' });
      
      await runCLI(['node', 'index.js', 'chat']);
      
      expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('chat - should initiate Triad Mode', async () => {
      (inquirer.prompt as any).mockResolvedValue({ userMessage: 'exit' });
      await runCLI(['node', 'index.js', 'chat', '-t']);
      
      expect(child_process.spawn).toHaveBeenCalledTimes(2); // Q and Claude background watchers
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('TRIAD UPLINK ESTABLISHED'));
      expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('fbc - should entangle and begin watching file', async () => {
      await runCLI(['node', 'index.js', 'fbc']);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('entangled with the FBC'));
      expect(fs.watch).toHaveBeenCalled();
  });
});
