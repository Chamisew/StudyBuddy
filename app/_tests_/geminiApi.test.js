import { readGeminiKey } from '../app/ai-chatbot';

// Mock Constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        EXPO_PUBLIC_GEMINI_API_KEY: 'AIzaSyBzwclXSR0V-l5oJby--6_Ad9FeoPceMnU'
      }
    }
  }
}));

describe('Gemini API Key Reading', () => {
  it('should read the Gemini API key correctly', () => {
    const apiKey = readGeminiKey();
    expect(apiKey).toBe('AIzaSyBzwclXSR0V-l5oJby--6_Ad9FeoPceMnU');
  });
});