import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { getChatHistory, saveChatHistory, clearChatHistory } from '../services/firestoreService';
import type { ChatMessage, User } from '../types';
import { Icon } from './common/Icon';
import AddToSheetModal from './common/AddToSheetModal';

interface ChatViewProps {
  user: User | null;
}

const parsePromptsFromJson = (text: string): string[] | null => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);
  if (!match || !match[1]) return null;
  
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string' && item.length > 0)) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse JSON prompts:", e);
    return null;
  }
  return null;
};


const ChatView: React.FC<ChatViewProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [showAddToSheetModal, setShowAddToSheetModal] = useState(false);
  const [promptsToAdd, setPromptsToAdd] = useState<string[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY! }), []);
  
  const chat = useMemo(() => {
    const chatHistory = user ? messages.map(msg => ({
        role: msg.role,
        parts: msg.parts,
    })) : [];

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory,
    });
  }, [ai, messages, user]);

  // Load history on user change
  useEffect(() => {
    if (user) {
      setIsHistoryLoading(true);
      getChatHistory(user.uid).then(history => {
        setMessages(history);
        setIsHistoryLoading(false);
      });
    } else {
      setMessages([]);
      setIsHistoryLoading(false);
    }
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user', parts: [{ text: input }], timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: input });
      
      let modelResponse = '';
      const modelMessage: ChatMessage = {
        role: 'model', parts: [{ text: '' }], timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, modelMessage]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages(prev => prev.map(msg =>
          msg.timestamp === modelMessage.timestamp ? { ...msg, parts: [{ text: modelResponse }] } : msg
        ));
      }

      const detectedPrompts = parsePromptsFromJson(modelResponse);
      setMessages(prev => {
        const finalMessages = prev.map(msg =>
          msg.timestamp === modelMessage.timestamp
            ? { ...msg, parts: [{ text: modelResponse }], prompts: detectedPrompts ?? undefined }
            : msg
        );
        if (user) {
          saveChatHistory(user.uid, finalMessages);
        }
        return finalMessages;
      });

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = useCallback(() => {
    if (confirm('Are you sure you want to start a new chat? Your current conversation will be cleared.')) {
        setMessages([]);
        if (user) {
            clearChatHistory(user.uid);
        }
    }
  }, [user]);
  
  const handleAddToSheetClick = (prompts: string[]) => {
    setPromptsToAdd(prompts);
    setShowAddToSheetModal(true);
  };

  return (
    <>
    {showAddToSheetModal && user && (
        <AddToSheetModal
            user={user}
            prompts={promptsToAdd}
            onClose={() => setShowAddToSheetModal(false)}
        />
    )}
    <div className="flex flex-col h-full bg-gray-800/50 rounded-lg">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Chat</h2>
          <p className="text-gray-400 text-sm">
            {user ? 'Your conversation is saved automatically.' : 'Sign in to save chat history.'}
          </p>
        </div>
        {user && (
            <button onClick={handleNewChat} className="flex items-center space-x-2 py-2 px-3 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Icon name="add" className="w-5 h-5" />
                <span>New Chat</span>
            </button>
        )}
      </div>

      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-6">
        {isHistoryLoading ? (
            <div className="flex justify-center items-center h-full"><p>Loading chat history...</p></div>
        ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 pt-16">
                <Icon name="chat" className="w-16 h-16 mx-auto mb-4"/>
                <h3 className="text-xl font-semibold">Start a Conversation</h3>
                <p>Ask anything, or brainstorm ideas for your next creation.</p>
            </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.timestamp} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                 {msg.role === 'model' && msg.prompts && user && (
                    <button
                        onClick={() => handleAddToSheetClick(msg.prompts!)}
                        className="mt-3 flex items-center gap-2 text-sm py-1.5 px-3 bg-purple-500/50 hover:bg-purple-500/80 rounded-md transition-colors font-semibold"
                    >
                        <Icon name="add" className="w-4 h-4" />
                        Add to Sheet
                    </button>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-xl p-3 rounded-lg bg-gray-700">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
             </div>
           </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-purple-600 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
          >
            <Icon name="send" />
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center mt-2 px-2">
            Pro Tip: Ask for prompts "as a JSON array" to add them directly to a sheet.
        </p>
      </div>
    </div>
    </>
  );
};

export default ChatView;