import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIClientWrapper {
  type: 'google';
  client: GoogleGenerativeAI;
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

  return {
      type: 'google',
      client: new GoogleGenerativeAI(apiKey)
  };
};

export const generateResponse = async (
  clientWrapper: AIClientWrapper, 
  history: {role: string, content: string}[], 
  systemPrompt: string, 
  modelName: string
): Promise<string> => {
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
};
