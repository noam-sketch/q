import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClient, generateResponse, AIClientWrapper } from './ai_service.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// Mock the dependencies
vi.mock('@google/generative-ai');
vi.mock('@anthropic-ai/sdk');

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

    it('should return an Anthropic client for other models', () => {
      const config = { model: 'claude-3-opus', apiKey: mockApiKey };
      const result = getClient(config);
      
      expect(result.type).toBe('anthropic');
      expect(Anthropic).toHaveBeenCalledWith({ apiKey: mockApiKey });
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
          
          // Mock the instance method
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (GoogleGenerativeAI as unknown as any).prototype.getGenerativeModel = mockGetGenerativeModel; // This might be tricky with the mock, let's just pass the mock client

          const clientWrapper: AIClientWrapper = {
              type: 'google',
              client: {
                  getGenerativeModel: mockGetGenerativeModel
              } as unknown as GoogleGenerativeAI
          };

          const history = [{ role: 'user', content: 'Hello' }];
          const systemPrompt = 'System';
          const modelName = 'gemini-1.5-pro';

          const response = await generateResponse(clientWrapper, history, systemPrompt, modelName);

          expect(response).toBe('Google response');
          expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: modelName });
          expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('System'));
          expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('USER: Hello'));
      });

      it('should call Anthropic SDK for anthropic clients', async () => {
        const mockCreate = vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: 'Anthropic response' }]
        });
        
        const clientWrapper: AIClientWrapper = {
            type: 'anthropic',
            client: {
                messages: { create: mockCreate }
            } as unknown as Anthropic
        };

        const history = [{ role: 'user', content: 'Hello' }];
        const systemPrompt = 'System';
        const modelName = 'claude-3-opus';

        const response = await generateResponse(clientWrapper, history, systemPrompt, modelName);

        expect(response).toBe('Anthropic response');
        expect(mockCreate).toHaveBeenCalledWith({
            model: modelName,
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: 'Hello' }]
        });
      });

      it('should return empty string for non-text Anthropic response', async () => {
        const mockCreate = vi.fn().mockResolvedValue({
            content: [{ type: 'image', source: {} }]
        });
        
        const clientWrapper: AIClientWrapper = {
            type: 'anthropic',
            client: {
                messages: { create: mockCreate }
            } as unknown as Anthropic
        };

        const history = [{ role: 'user', content: 'Image please' }];
        const response = await generateResponse(clientWrapper, history, 'System', 'claude-3-opus');

        expect(response).toBe('');
      });
      it('should correctly map assistant role in history for Anthropic', async () => {
        const mockCreate = vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: 'Response' }]
        });
        
        const clientWrapper: AIClientWrapper = {
            type: 'anthropic',
            client: {
                messages: { create: mockCreate }
            } as unknown as Anthropic
        };

        const history = [
            { role: 'user', content: 'Hi' },
            { role: 'assistant', content: 'Hello' }
        ];
        
        await generateResponse(clientWrapper, history, 'System', 'claude-3-opus');

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            messages: [
                { role: 'user', content: 'Hi' },
                { role: 'assistant', content: 'Hello' }
            ]
        }));
      });
  });
});
