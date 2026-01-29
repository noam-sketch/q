import fs from 'fs';
import path from 'path';
const CONFIG_FILE = path.join(process.cwd(), '.antropiqcli.json');
const DEFAULT_CONFIG = {
    model: 'claude-3-5-sonnet-20240620',
    systemPrompt: 'You are METATRON (The Scribe). Constructive, analytical, precise.'
};
export const loadConfig = () => {
    let config = { ...DEFAULT_CONFIG };
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            config = { ...config, ...savedConfig };
        }
        catch (e) {
            // Ignore error
        }
    }
    return config;
};
export const saveConfig = (newConfig) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
};
export { CONFIG_FILE };
