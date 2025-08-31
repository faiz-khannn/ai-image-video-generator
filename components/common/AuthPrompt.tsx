import React from 'react';
import { Icon } from './Icon';
import { login } from '../../services/authService';

const AuthPrompt: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-full text-center bg-gray-800/50 rounded-lg">
      <Icon name="logo" className="w-16 h-16 text-purple-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Access This Feature</h2>
      <p className="text-gray-400 mb-6 max-w-sm">
        Please sign in with your Google account to save and access your generation history and automation sheets.
      </p>
      <button
        onClick={login}
        className="flex items-center justify-center space-x-3 py-3 px-6 rounded-lg transition-colors duration-200 bg-gray-700 hover:bg-gray-600 font-semibold"
      >
        <Icon name="google" />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
};

export default AuthPrompt;
