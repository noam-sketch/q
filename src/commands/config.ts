import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadConfig, saveConfig } from '../config.js';

export const configCommand = async () => {
  const config = loadConfig();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: 'Select Model:',
      choices: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307', 'gemini-3-pro'],
      default: config.model
    },
    {
      type: 'input',
      name: 'systemPrompt',
      message: 'System Persona:',
      default: config.systemPrompt
    },
    {
      type: 'input',
      name: 'baseURL',
      message: 'API Base URL (Optional, for proxies):',
      default: config.baseURL || ''
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API Key (Optional, overrides env var):',
      default: config.apiKey || '',
      mask: '*'
    }
  ]);

  // Clean up empty strings
  if (!answers.baseURL) delete answers.baseURL;
  if (!answers.apiKey) delete answers.apiKey;

  saveConfig(answers);
  console.log(chalk.green('Configuration saved to .antropiqcli.json'));
};
