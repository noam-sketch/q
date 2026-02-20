import { exec } from 'child_process';

/**
 * Executes a shell command on the host OS and returns stdout or throws stderr.
 */
export const executeCommand = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Prefer stderr if available, otherwise fallback to error message
                reject(new Error(stderr || error.message));
                return;
            }
            resolve(stdout);
        });
    });
};