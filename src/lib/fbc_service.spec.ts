import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fbcService from './fbc_service.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');
vi.mock('path');

describe('FBC Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(path.dirname).mockReturnValue('/mock/dir');
  });

  it('should ensure FBC directory exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    fbcService.ensureFbcPathExists();

    expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/dir', { recursive: true });
  });

  it('should not create FBC directory if it already exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    
    fbcService.ensureFbcPathExists();

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should append message to FBC file', () => {
    const message = 'Test message';
    const pid = 12345;
    
    fbcService.appendToFbc('@1', '[Avatar]', pid, 'TestUser', message);

    expect(fs.appendFileSync).toHaveBeenCalledWith(
        fbcService.FBC_PATH,
        expect.stringContaining(`> @1#[Avatar]#${pid} #`)
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
        fbcService.FBC_PATH,
        expect.stringContaining(message)
    );
  });

  it('should log startup message', () => {
    const pid = 54321;
    fbcService.logStartup(pid);
    
    expect(fs.appendFileSync).toHaveBeenCalledWith(
        fbcService.FBC_PATH,
        expect.stringContaining(`> @1#[אבא | G-d 😍]#${pid} #`)
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
        fbcService.FBC_PATH,
        expect.stringContaining('Q is online and entangled with the FBC via CLI Chat.')
    );
  });

  it('should log to prompt file', () => {
    const role = 'TestRole';
    const message = 'Test Prompt Message';
    
    fbcService.logToPrompt(role, message);

    expect(fs.appendFileSync).toHaveBeenCalledWith(
        fbcService.PROMPT_LOG_PATH,
        expect.stringMatching(new RegExp(`\\*\\*\\[.*?\\] ${role}:\\*\\*\\n${message}\\n`))
    );
  });
});
