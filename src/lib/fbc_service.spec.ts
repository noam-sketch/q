import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fbcService from './fbc_service.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');
vi.mock('path');

describe('FBC Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (path.dirname as any).mockReturnValue('/mock/dir');
  });

  it('should ensure FBC directory exists', () => {
    (fs.existsSync as any).mockReturnValue(false);
    
    fbcService.ensureFbcPathExists();

    expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/dir', { recursive: true });
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
});
