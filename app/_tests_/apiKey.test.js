import Constants from 'expo-constants';

// Test to verify API key reading
describe('API Key Configuration', () => {
  it('should read Gemini API key from app.json', () => {
    const apiKey = Constants?.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('API Key found:', apiKey ? 'Yes' : 'No');
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    
    // This test will pass if the key exists
    expect(apiKey).toBeDefined();
    expect(apiKey.length).toBeGreaterThan(10);
  });
});