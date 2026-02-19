import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

export type ClientType = 'google' | 'anthropic';

export interface AIClientWrapper {
  type: ClientType;
  client: GoogleGenerativeAI | Anthropic;
}

export interface ClientConfig {
  model: string;
  apiKey?: string;
}

export const getClient = (config: ClientConfig): AIClientWrapper => {
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error('API_KEY not found');
  }

  if (config.model.startsWith('gemini')) {
      return {
          type: 'google',
          client: new GoogleGenerativeAI(apiKey)
      };
  } else {
      return {
          type: 'anthropic',
          client: new Anthropic({ apiKey })
      };
  }
};

export const generateResponse = async (
  clientWrapper: AIClientWrapper, 
  history: {role: string, content: string}[], 
  systemPrompt: string, 
  modelName: string
): Promise<string> => {
    if (clientWrapper.type === 'google') {
        const genAI = clientWrapper.client as GoogleGenerativeAI;
        // Construct prompt with system instructions + history
        let fullPrompt = systemPrompt + "\n\n";
        history.forEach(msg => {
            fullPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
        });
        fullPrompt += "ASSISTANT:";

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } else {
        const anthropic = clientWrapper.client as Anthropic;
        // Map history to Anthropic format
        const anthropicHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })) as Anthropic.MessageParam[];

        const response = await anthropic.messages.create({
            model: modelName,
            max_tokens: 1024,
            system: systemPrompt,
            messages: anthropicHistory,
        });
        
        if (response.content[0].type === 'text') {
            return response.content[0].text;
        }
        return '';
    }
};
