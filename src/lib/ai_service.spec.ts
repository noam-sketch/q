import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClient, generateResponse, AIClientWrapper } from './ai_service.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the dependencies
vi.mock('@google/generative-ai');

describe('AI Service', () => {
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClient', () => {
    it('should return a Google client for gemini models', () => {
      const config = { model: 'gemini-1.5-pro', apiKey: mockApiKey };
      const result = getClient(config);
      
      expect(result.type).toBe('google');
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey);
    });

    it('should throw an error if API key is missing', () => {
        const config = { model: 'gemini-1.5-pro', apiKey: '' };
        expect(() => getClient(config)).toThrow('API_KEY not found');
    });
  });

  describe('generateResponse', () => {
      it('should call Google Generative AI for google clients', async () => {
          const mockGenerateContent = vi.fn().mockResolvedValue({
              response: { text: () => 'Google response' }
          });
          const mockGetGenerativeModel = vi.fn().mockReturnValue({
              generateContent: mockGenerateContent
          });
          
          const clientWrapper: AIClientWrapper = {
              type: 'google',
              client: {
                  getGenerativeModel: mockGetGenerativeModel
              } as unknown as GoogleGenerativeAI
          };

          const history = [{ role: 'user', content: 'Hello' }];
          const systemPrompt = 'System';
          const modelName = 'gemini-3.1-pro-preview';

          const response = await generateResponse(clientWrapper, history, systemPrompt, modelName);

          expect(response).toBe('Google response');
          expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: modelName });
          expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('System'));
          expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('USER: Hello'));
      });
  });
});
