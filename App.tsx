import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageGeneratorView from './components/ImageGeneratorView';
import VideoGeneratorView from './components/VideoGeneratorView';
import HistoryView from './components/HistoryView';
import SheetsView from './components/SheetsView';
import AuthPrompt from './components/common/AuthPrompt';
import type { ActiveTab, User } from './types';
import { onAuthStateChanged } from './services/authService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('image');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  const renderContent = () => {
    const isProtectedTab = activeTab === 'history' || activeTab === 'sheets';
    
    if (isProtectedTab && !user) {
      return <AuthPrompt />;
    }

    switch (activeTab) {
      case 'chat':
        return <ChatView user={user} />;
      case 'image':
        return <ImageGeneratorView user={user} />;
      case 'video':
        return <VideoGeneratorView user={user} />;
      case 'history':
        return <HistoryView user={user!} />;
      case 'sheets':
        return <SheetsView user={user!} />;
      default:
        return <ImageGeneratorView user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} user={user} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;