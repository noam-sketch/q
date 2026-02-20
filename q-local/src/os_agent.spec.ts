import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from './os_agent.js';
import { exec } from 'child_process';

vi.mock('child_process');

describe('OS Agent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should resolve stdout on successful command execution', async () => {
        const mockStdout = 'test output\\n';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(exec).mockImplementation((_cmd: any, callback: any) => {
            if (typeof callback === 'function') callback(null, mockStdout, '');
            return {} as import('child_process').ChildProcess;
        });

        const result = await executeCommand('echo "test output"');
        expect(result).toBe(mockStdout);
        expect(exec).toHaveBeenCalledWith('echo "test output"', expect.any(Function));
    });

    it('should reject with stderr on command failure', async () => {
        const mockStderr = 'command not found';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(exec).mockImplementation((_cmd: any, callback: any) => {
            if (typeof callback === 'function') callback(new Error('Failed'), '', mockStderr);
            return {} as import('child_process').ChildProcess;
        });

        await expect(executeCommand('invalid_cmd')).rejects.toThrow('command not found');
    });

    it('should fallback to error message if stderr is empty', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(exec).mockImplementation((_cmd: any, callback: any) => {
            if (typeof callback === 'function') callback(new Error('Process killed'), '', '');
            return {} as import('child_process').ChildProcess;
        });

        await expect(executeCommand('kill_cmd')).rejects.toThrow('Process killed');
    });
});