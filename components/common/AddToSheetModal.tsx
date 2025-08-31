import React, { useState, useEffect, useCallback } from 'react';
import { getSheets, saveSheet } from '../../services/firestoreService';
import type { User, Sheet, SheetPrompt } from '../../types';
import { Icon } from './Icon';
import LoadingSpinner from './LoadingSpinner';

interface AddToSheetModalProps {
  user: User;
  prompts: string[];
  onClose: () => void;
}

const AddToSheetModal: React.FC<AddToSheetModalProps> = ({ user, prompts, onClose }) => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetType, setNewSheetType] = useState<'image' | 'video'>('image');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSheets = async () => {
      setIsLoading(true);
      const userSheets = await getSheets(user.uid);
      setSheets(userSheets);
      if (userSheets.length > 0) {
        setSelectedSheetId(userSheets[0].id);
      } else {
        setIsCreatingNew(true);
      }
      setIsLoading(false);
    };
    fetchSheets();
  }, [user.uid]);

  const handleAddPrompts = useCallback(async () => {
    setIsSaving(true);
    const newSheetPrompts: SheetPrompt[] = prompts.map(p => ({
      id: `prompt-${Date.now()}-${Math.random()}`,
      prompt: p,
      status: 'pending',
    }));

    if (isCreatingNew) {
      if (!newSheetName.trim()) {
        alert('Please enter a name for the new sheet.');
        setIsSaving(false);
        return;
      }
      const newSheet: Sheet = {
        id: `sheet-${Date.now()}`,
        name: newSheetName,
        type: newSheetType,
        prompts: newSheetPrompts,
      };
      await saveSheet(user.uid, newSheet);
    } else {
      const targetSheet = sheets.find(s => s.id === selectedSheetId);
      if (targetSheet) {
        const updatedSheet = {
          ...targetSheet,
          prompts: [...targetSheet.prompts, ...newSheetPrompts],
        };
        await saveSheet(user.uid, updatedSheet);
      }
    }
    setIsSaving(false);
    onClose();
  }, [isCreatingNew, newSheetName, newSheetType, selectedSheetId, sheets, prompts, user.uid, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 animate-fade-in">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <Icon name="close" />
        </button>
        <h2 className="text-2xl font-bold">Add Prompts to Sheet</h2>
        <p className="text-sm text-gray-400">Adding {prompts.length} new prompt(s) to a sheet.</p>

        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {!isCreatingNew && sheets.length > 0 && (
                <div>
                    <label htmlFor="sheet-select" className="block text-sm font-medium text-gray-300 mb-2">Select an existing sheet</label>
                    <select
                        id="sheet-select"
                        value={selectedSheetId}
                        onChange={e => setSelectedSheetId(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {sheets.map(sheet => (
                            <option key={sheet.id} value={sheet.id}>{sheet.name} ({sheet.type})</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <div>
                <button onClick={() => setIsCreatingNew(!isCreatingNew)} className="text-purple-400 hover:text-purple-300 w-full text-left font-semibold">
                    {isCreatingNew ? '▼ Cancel New Sheet' : '▶ Create a New Sheet'}
                </button>
                {isCreatingNew && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-900/50 rounded-lg animate-fade-in">
                        <input
                            type="text"
                            value={newSheetName}
                            onChange={e => setNewSheetName(e.target.value)}
                            placeholder="New sheet name..."
                            className="w-full p-2 bg-gray-700 rounded-md"
                        />
                        <select
                            value={newSheetType}
                            onChange={e => setNewSheetType(e.target.value as 'image' | 'video')}
                            className="w-full p-2 bg-gray-700 rounded-md"
                        >
                            <option value="image">Image Sheet</option>
                            <option value="video">Video Sheet</option>
                        </select>
                    </div>
                )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4">
            <button onClick={onClose} className="py-2 px-4 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
            <button onClick={handleAddPrompts} disabled={isSaving || isLoading || (isCreatingNew && !newSheetName.trim())} className="py-2 px-4 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center">
                {isSaving && <LoadingSpinner />}
                <span className={isSaving ? 'ml-2' : ''}>Add Prompts</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddToSheetModal;
