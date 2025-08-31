import React from 'react';
import type { ActiveTab, User } from '../types';
import { Icon } from './common/Icon';
import { login, logout } from '../services/authService';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, user }) => {
  const navItems: { id: ActiveTab; label: string; icon: JSX.Element }[] = [
    { id: 'chat', label: 'Chat', icon: <Icon name="chat" /> },
    { id: 'image', label: 'Image Gen', icon: <Icon name="image" /> },
    { id: 'video', label: 'Video Gen', icon: <Icon name="video" /> },
    { id: 'sheets', label: 'Sheets', icon: <Icon name="sheets" /> },
    { id: 'history', label: 'History', icon: <Icon name="history" /> },
  ];

  return (
    <aside className="w-20 sm:w-64 bg-gray-800 p-2 sm:p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-center sm:justify-start mb-10">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Icon name="logo" />
          </div>
          <h1 className="text-xl font-bold ml-3 hidden sm:block">Creator AI</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-center sm:justify-start space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                activeTab === item.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              aria-label={item.label}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        {user ? (
          <div className="flex items-center justify-center sm:justify-between">
            <div className="flex items-center min-w-0">
              <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full" />
              <div className="ml-3 hidden sm:block min-w-0">
                <p className="font-semibold truncate">{user.displayName}</p>
                <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">
                  Logout
                </button>
              </div>
            </div>
             <button onClick={logout} className="text-gray-400 hover:text-white sm:hidden" aria-label="Logout">
                <Icon name="logout" />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="w-full flex items-center justify-center sm:justify-start space-x-3 p-3 rounded-lg transition-colors duration-200 bg-gray-700 hover:bg-gray-600"
          >
            <Icon name="google" />
            <span className="hidden sm:inline font-semibold">Sign in with Google</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
