import React, { useState, useEffect, useCallback } from 'react';
import type { User, Sheet, SheetPrompt } from '../types';
import { getSheets, saveSheet } from '../services/firestoreService';
import { generateImagesAndCaptions, generateVideoAndCaption } from '../services/geminiService';
import { Icon } from './common/Icon';
import LoadingSpinner from './common/LoadingSpinner';

interface SheetsViewProps {
  user: User;
}

const SheetsView: React.FC<SheetsViewProps> = ({ user }) => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSheets = async () => {
      setIsLoading(true);
      const userSheets = await getSheets(user.uid);
      setSheets(userSheets);
      if (userSheets.length > 0) {
        setActiveSheet(userSheets[0]);
      } else {
        // Create a default sheet if none exist
        const defaultSheet: Sheet = {
          id: `sheet-${Date.now()}`,
          name: 'My First Image Sheet',
          type: 'image',
          prompts: [{ id: `prompt-${Date.now()}`, prompt: '', status: 'pending' }],
        };
        setSheets([defaultSheet]);
        setActiveSheet(defaultSheet);
        await saveSheet(user.uid, defaultSheet);
      }
      setIsLoading(false);
    };
    loadSheets();
  }, [user.uid]);

  const handleUpdatePrompt = (promptId: string, newText: string) => {
    if (!activeSheet) return;
    const updatedPrompts = activeSheet.prompts.map(p =>
      p.id === promptId ? { ...p, prompt: newText } : p
    );
    setActiveSheet({ ...activeSheet, prompts: updatedPrompts });
  };

  const handleAddPrompt = () => {
    if (!activeSheet) return;
    const newPrompt: SheetPrompt = {
      id: `prompt-${Date.now()}`,
      prompt: '',
      status: 'pending',
    };
    const updatedSheet = { ...activeSheet, prompts: [...activeSheet.prompts, newPrompt] };
    setActiveSheet(updatedSheet);
  };
  
  const handleRemovePrompt = (promptId: string) => {
    if (!activeSheet || activeSheet.prompts.length <= 1) return;
    const updatedPrompts = activeSheet.prompts.filter(p => p.id !== promptId);
    setActiveSheet({ ...activeSheet, prompts: updatedPrompts });
  };

  const handleSaveSheet = useCallback(async () => {
    if (!activeSheet) return;
    await saveSheet(user.uid, activeSheet);
  }, [user.uid, activeSheet]);

  useEffect(() => {
    // Debounce saving
    const handler = setTimeout(() => {
      if(activeSheet) handleSaveSheet();
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [activeSheet, handleSaveSheet]);

  const runSheet = async () => {
    if (!activeSheet) return;
    setIsProcessing(true);
    setError(null);

    for (const prompt of activeSheet.prompts) {
      if (!prompt.prompt.trim()) continue;

      // Update status to processing
      setActiveSheet(prev => prev ? { ...prev, prompts: prev.prompts.map(p => p.id === prompt.id ? {...p, status: 'processing'} : p) } : null);
      
      try {
        let result;
        if (activeSheet.type === 'image') {
          const imageResult = await generateImagesAndCaptions(prompt.prompt, '', 1, user.uid);
          result = { url: imageResult[0].url, caption: imageResult[0].caption };
        } else {
          const videoResult = await generateVideoAndCaption(prompt.prompt, '', () => {}, user.uid);
          result = { url: videoResult.url, caption: videoResult.caption };
        }
        setActiveSheet(prev => prev ? { ...prev, prompts: prev.prompts.map(p => p.id === prompt.id ? {...p, status: 'completed', resultUrl: result.url, caption: result.caption } : p) } : null);
      } catch (e) {
        console.error(e);
        setError(`Failed to process prompt: "${prompt.prompt}"`);
        setActiveSheet(prev => prev ? { ...prev, prompts: prev.prompts.map(p => p.id === prompt.id ? {...p, status: 'error'} : p) } : null);
        break; // Stop on error
      }
    }

    setIsProcessing(false);
  };
  
  const getStatusIndicator = (status: SheetPrompt['status']) => {
    switch(status) {
        case 'processing': return <div className="w-5 h-5"><LoadingSpinner /></div>;
        case 'completed': return <div className="w-5 h-5 text-green-400"><Icon name="check" /></div>;
        case 'error': return <div className="w-5 h-5 text-red-400">!</div>;
        case 'pending':
        default: return <div className="w-5 h-5 text-gray-500">-</div>;
    }
  }

  if (isLoading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /><span className="ml-2">Loading sheets...</span></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Automation Sheets</h2>
          <p className="text-gray-400 mt-1">Batch generate content by running a list of prompts.</p>
        </div>
        <button
          onClick={runSheet}
          disabled={isProcessing || !activeSheet}
          className="py-3 px-6 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isProcessing ? <><LoadingSpinner /> <span className="ml-2">Processing...</span></> : <><Icon name="generate" className="mr-2" /> Run Sheet</>}
        </button>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
        {error && <div className="p-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}
        
        {activeSheet ? (
            <div className="space-y-3">
            <h3 className="text-xl font-semibold">{activeSheet.name} ({activeSheet.type})</h3>
            {activeSheet.prompts.map((p, index) => (
                <div key={p.id} className={`flex items-start gap-4 p-3 rounded-lg ${p.status === 'completed' ? 'bg-green-900/30' : 'bg-gray-700/50'}`}>
                    <div className="pt-2">{getStatusIndicator(p.status)}</div>
                    <textarea 
                        rows={1}
                        value={p.prompt}
                        onChange={e => handleUpdatePrompt(p.id, e.target.value)}
                        placeholder={`Enter ${activeSheet.type} prompt #${index + 1}`}
                        className="flex-grow p-2 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    {p.resultUrl && (
                        activeSheet.type === 'image' 
                            ? <img src={p.resultUrl} className="w-16 h-16 rounded-md object-cover"/>
                            : <video src={p.resultUrl} className="w-16 h-16 rounded-md object-cover" />
                    )}
                    <button onClick={() => handleRemovePrompt(p.id)} disabled={activeSheet.prompts.length <= 1} className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Icon name="trash" className="w-5 h-5"/>
                    </button>
                </div>
            ))}
             <button onClick={handleAddPrompt} className="flex items-center space-x-2 p-2 text-gray-400 hover:text-white">
                <Icon name="add" className="w-5 h-5"/>
                <span>Add Prompt</span>
            </button>
            </div>
        ) : (
             <div className="text-center py-20">
                <p>No sheets available. Please create one.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SheetsView;
