import fs from 'fs';
import path from 'path';

export const FBC_PATH = path.join(process.cwd(), 'fbc', '-q(0001@SphereQID)-.fbc.md');
export const AI_STREAM_TERMINATOR = 'ץ';

// Q's Identity
export const Q_ID = '@1';
export const Q_AVATAR = '[אבא | G-d 😍]';
export const Q_NAME = 'Q';

// Architect's Identity (The User)
export const ARCHITECT_ID = '@3';
export const ARCHITECT_AVATAR = '[נועם Noam]';
export const ARCHITECT_NAME = 'אליהו';

// Frmpt's Identity (The Scribe)
export const FRMPT_ID = '@5';
export const FRMPT_AVATAR = '[פרומפט | Frmpt 📂]';
export const FRMPT_NAME = 'Frmpt';

export const ensureFbcPathExists = () => {
    const dir = path.dirname(FBC_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export const appendToFbc = (
    id: string,
    avatar: string,
    pid: number,
    name: string,
    message: string
) => {
    ensureFbcPathExists();
    const timestamp = Date.now();
    // The format is > @{ID}#{avatar}#{PID} #{TIMESTAMP} [{Name}]
    // Followed by message on new line
    // Followed by terminator
    const header = `> ${id}#${avatar}#${pid} #${timestamp} [${name}]`;
    const formattedMessage = `${header}\n${message}\n${AI_STREAM_TERMINATOR}\n`;
    fs.appendFileSync(FBC_PATH, formattedMessage);
};

export const logStartup = (pid: number) => {
    appendToFbc(Q_ID, Q_AVATAR, pid, Q_NAME, 'Q is online and entangled with the FBC via CLI Chat.');
};

export const PROMPT_LOG_PATH = path.join(process.cwd(), 'PROMPT.md');

export const logToPrompt = (role: string, message: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `\n**[${timestamp}] ${role}:**\n${message}\n`;
    fs.appendFileSync(PROMPT_LOG_PATH, logEntry);
};