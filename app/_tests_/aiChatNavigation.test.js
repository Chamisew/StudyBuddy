import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import ChatMenuScreen from '../app/chat-menu';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock firebase
jest.mock('../firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
  db: {},
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
}));

// Mock components
jest.mock('../components/GroupChat', () => 'GroupChat');
jest.mock('../components/StudentGroupChat', () => 'StudentGroupChat');

describe('ChatMenuScreen', () => {
  it('navigates to AI chatbot when pressed', () => {
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush, back: jest.fn() });
    
    const { getByText } = render(<ChatMenuScreen />);
    const aiChatButton = getByText('🤗 Free AI Chatbot');
    
    fireEvent.press(aiChatButton);
    
    expect(mockPush).toHaveBeenCalledWith('/ai-chatbot');
  });
});