import type { User } from '../types';

let authStateChangeCallback: ((user: User | null) => void) | null = null;
let currentUser: User | null = null;
let isInitialized = false;

// This function allows React components to subscribe to auth changes.
export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  authStateChangeCallback = callback;
  
  // Simulate initial state check after a short delay
  if (!isInitialized) {
      setTimeout(() => {
          callback(currentUser);
          isInitialized = true;
      }, 50);
  } else {
      callback(currentUser);
  }

  // Return an unsubscribe function
  return () => {
    authStateChangeCallback = null;
  };
};

export const login = (): void => {
  if (currentUser) return;

  const mockUser: User = {
    uid: 'mock-user-123',
    displayName: 'Alex Doe',
    photoURL: `https://api.dicebear.com/8.x/avataaars/svg?seed=alex`,
  };
  
  currentUser = mockUser;

  if (authStateChangeCallback) {
    authStateChangeCallback(currentUser);
  }
};

export const logout = (): void => {
  currentUser = null;
  if (authStateChangeCallback) {
    authStateChangeCallback(null);
  }
};
