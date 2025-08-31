import { GoogleGenAI } from "@google/genai";
import { addToHistory } from './firestoreService';
import type { GeneratedMedia } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImagesAndCaptions = async (
  prompt: string,
  textOverlay: string,
  variations: number,
  userId?: string
): Promise<Omit<GeneratedMedia, 'id' | 'timestamp' | 'type' | 'prompt'>[]> => {
    const fullPrompt = textOverlay
        ? `${prompt}, with the text "${textOverlay}" clearly visible and elegantly integrated.`
        : prompt;

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: variations,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    const generatedImages = await Promise.all(
        imageResponse.generatedImages.map(async (img) => {
            const imageUrl = `data:image/jpeg;base64,${img.image.imageBytes}`;
            const captionPrompt = `Generate a short, catchy social media caption for an image about: "${prompt}". Include 3-5 relevant hashtags.`;
            
            const captionResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: captionPrompt,
            });

            const result = {
                url: imageUrl,
                caption: captionResponse.text,
            };

            if (userId) {
                addToHistory(userId, { ...result, prompt, type: 'image' });
            }

            return result;
        })
    );

    return generatedImages;
};

export const generateVideoAndCaption = async (
  prompt: string,
  musicSuggestion: string,
  onProgress: (message: string) => void,
  userId?: string
): Promise<Omit<GeneratedMedia, 'id' | 'timestamp' | 'type' | 'prompt'>> => {
    onProgress('Crafting your video prompt...');
    const fullPrompt = `${prompt}. The video should have a background music vibe of: ${musicSuggestion}. The video should be high-quality and suitable for social media.`;

    onProgress('Sending request to video model... this can take a few minutes.');
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: fullPrompt,
        config: { numberOfVideos: 1 }
    });

    const progressMessages = [
        'Warming up the pixels...',
        'Directing the digital actors...',
        'Composing the visual symphony...',
        'Rendering final scenes...',
        'Almost there, adding the final touches!'
    ];
    let messageIndex = 0;

    while (!operation.done) {
        onProgress(progressMessages[messageIndex % progressMessages.length]);
        messageIndex++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress('Video generation complete! Fetching the file...');
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation failed or returned no link.');
    }
    
    const videoDataResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoDataResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    onProgress('Generating a catchy caption...');
    const captionPrompt = `Generate a short, engaging social media caption for a video about: "${prompt}". Include 3-5 relevant hashtags.`;
    const captionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: captionPrompt,
    });
    
    onProgress('Done!');

    const result = {
        url: videoUrl,
        caption: captionResponse.text,
    };
    
    if (userId) {
      addToHistory(userId, { ...result, prompt, type: 'video' });
    }

    return result;
};