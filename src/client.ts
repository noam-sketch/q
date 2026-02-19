import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { loadConfig } from './config.js';

// Load environment variables
dotenv.config();

export const getClient = (): Anthropic => {
  const config = loadConfig();
  
  // Prioritize config apiKey, fallback to env var
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error(chalk.red('Error: API Key not found.'));
    console.log(chalk.yellow('Please set ANTHROPIC_API_KEY in .env or configure it via "antropiqcli config".'));
    process.exit(1);
  }

  const clientOptions: any = { apiKey };
  
  if (config.baseURL) {
    clientOptions.baseURL = config.baseURL;
  }

  return new Anthropic(clientOptions);
};
