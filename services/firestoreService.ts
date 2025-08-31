import type { User, GeneratedMedia, Sheet, ChatMessage } from '../types';

// In-memory store to simulate Firestore. Data persists for the session.
const db: {
    history: { [userId: string]: GeneratedMedia[] };
    sheets: { [userId: string]: Sheet[] };
    chats: { [userId: string]: ChatMessage[] };
} = {
    history: {},
    sheets: {},
    chats: {},
};

const simulateLatency = (delay = 200) => new Promise(res => setTimeout(res, delay));

export const getHistory = async (userId: string): Promise<GeneratedMedia[]> => {
    await simulateLatency();
    if (!db.history[userId]) {
        db.history[userId] = [];
    }
    // Return a deep copy to prevent mutation issues, sorted by newest first
    return [...db.history[userId]].sort((a, b) => b.timestamp - a.timestamp);
};

export const addToHistory = async (userId: string, itemData: Omit<GeneratedMedia, 'id' | 'timestamp'>): Promise<GeneratedMedia> => {
    await simulateLatency(50);
    if (!db.history[userId]) {
        db.history[userId] = [];
    }
    const newItem: GeneratedMedia = {
        ...itemData,
        id: `media-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
    };
    db.history[userId].push(newItem);
    return newItem;
};

export const deleteFromHistory = async (userId: string, itemId: string): Promise<void> => {
    await simulateLatency();
    if (db.history[userId]) {
        db.history[userId] = db.history[userId].filter(item => item.id !== itemId);
    }
};

export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
    await simulateLatency(150);
    if (!db.chats[userId]) {
        db.chats[userId] = [];
    }
    return JSON.parse(JSON.stringify(db.chats[userId])); // Deep copy
};

export const saveChatHistory = async (userId: string, messages: ChatMessage[]): Promise<void> => {
    await simulateLatency(50);
    db.chats[userId] = messages;
};

export const clearChatHistory = async (userId: string): Promise<void> => {
    await simulateLatency(50);
    db.chats[userId] = [];
};

export const getSheets = async (userId: string): Promise<Sheet[]> => {
    await simulateLatency();
    if (!db.sheets[userId]) {
        db.sheets[userId] = [];
    }
    return JSON.parse(JSON.stringify(db.sheets[userId])); // Deep copy
};

export const saveSheet = async (userId: string, sheetToSave: Sheet): Promise<Sheet> => {
    await simulateLatency(100);
     if (!db.sheets[userId]) {
        db.sheets[userId] = [];
    }
    const sheetIndex = db.sheets[userId].findIndex(s => s.id === sheetToSave.id);
    if (sheetIndex > -1) {
        db.sheets[userId][sheetIndex] = sheetToSave;
    } else {
        db.sheets[userId].push(sheetToSave);
    }
    return sheetToSave;
};