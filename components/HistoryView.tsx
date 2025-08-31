import React, { useState, useEffect, useMemo } from 'react';
import type { User, GeneratedMedia } from '../types';
import { getHistory, deleteFromHistory } from '../services/firestoreService';
import { Icon } from './common/Icon';
import LoadingSpinner from './common/LoadingSpinner';

interface HistoryViewProps {
  user: User;
}

const HistoryView: React.FC<HistoryViewProps> = ({ user }) => {
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const userHistory = await getHistory(user.uid);
        setHistory(userHistory);
      } catch (e) {
        console.error(e);
        setError('Failed to load history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user.uid]);

  const handleDelete = async (itemId: string) => {
    // Optimistic UI update
    const originalHistory = [...history];
    setHistory(history.filter(item => item.id !== itemId));
    
    try {
      await deleteFromHistory(user.uid, itemId);
    } catch (e) {
      console.error('Failed to delete item:', e);
      // Revert if deletion fails
      setHistory(originalHistory);
      setError('Could not delete item. Please try again.');
    }
  };

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter(item => item.type === filter);
  }, [history, filter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
        <span className="ml-3 text-lg">Loading History...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Generation History</h2>
        <p className="text-gray-400 mt-1">Review your previously created images and videos.</p>
      </div>

      <div className="flex space-x-2 p-1 bg-gray-800/50 rounded-lg w-fit">
        {(['all', 'image', 'video'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              filter === f ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}s
          </button>
        ))}
      </div>
      
      {error && <div className="p-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}

      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/50 rounded-lg">
          <Icon name="history" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400">No History Found</h3>
          <p className="text-gray-500">Your generated content will appear here once you create some.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHistory.map(item => (
            <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden group relative animate-fade-in">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.prompt} className="w-full h-56 object-cover" />
              ) : (
                <video src={item.url} controls loop className="w-full h-56 object-cover" />
              )}
              <div className="p-4 space-y-2">
                 <p className="text-xs text-gray-400 font-mono truncate" title={item.prompt}>{item.prompt}</p>
                 <p className="text-gray-300 text-sm h-16 overflow-y-auto">{item.caption}</p>
                 <p className="text-xs text-gray-500 pt-1">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                aria-label="Delete item"
              >
                <Icon name="trash" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
