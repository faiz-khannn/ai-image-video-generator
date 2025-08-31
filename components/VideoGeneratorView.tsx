import React, { useState, useCallback } from 'react';
import { generateVideoAndCaption } from '../services/geminiService';
import type { User, GeneratedMedia } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import { Icon } from './common/Icon';

interface VideoGeneratorViewProps {
  user: User | null;
}

const VideoGeneratorView: React.FC<VideoGeneratorViewProps> = ({ user }) => {
  const [prompt, setPrompt] = useState('A dramatic time-lapse of a flower blooming in vibrant, neon colors');
  const [musicSuggestion, setMusicSuggestion] = useState('Uplifting cinematic orchestra');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<Omit<GeneratedMedia, 'id' | 'timestamp' | 'type' | 'prompt'> | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);
  
  const handleProgress = useCallback((message: string) => {
    setLoadingMessage(message);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    try {
      const video = await generateVideoAndCaption(prompt, musicSuggestion, handleProgress, user?.uid);
      setGeneratedVideo(video);
    } catch (e) {
      console.error(e);
      setError('Failed to generate video. Please check your API key and network connection.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, musicSuggestion, handleProgress, user]);

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    setCopiedCaption(caption);
    setTimeout(() => setCopiedCaption(null), 2000);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Video Generation</h2>
        <p className="text-gray-400 mt-1">Bring your ideas to life with AI-generated short videos.</p>
      </div>

      <div className="p-6 bg-gray-800/50 rounded-lg space-y-6">
        <div>
          <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">Video Prompt</label>
          <textarea
            id="video-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A time-lapse of a futuristic city being built"
            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <div>
          <label htmlFor="music" className="block text-sm font-medium text-gray-300 mb-2">Music Suggestion <span className="text-gray-500">(Optional)</span></label>
          <input
            id="music"
            type="text"
            value={musicSuggestion}
            onChange={(e) => setMusicSuggestion(e.target.value)}
            placeholder="e.g., 'Epic orchestral score' or 'Lo-fi hip hop beat'"
            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full sm:w-auto py-3 px-6 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : <><Icon name="generate" className="mr-2" /> Generate Video</>}
        </button>
      </div>

      {error && <div className="p-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}
      
      {isLoading && (
        <div className="text-center p-8 bg-gray-800/50 rounded-lg animate-fade-in">
            <LoadingSpinner/>
            <p className="text-lg mt-4 mb-2">Generating your video... this may take several minutes.</p>
            <p className="text-purple-400 font-medium">{loadingMessage}</p>
        </div>
      )}

      {generatedVideo && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
          <div className="lg:col-span-3 bg-gray-800 rounded-lg overflow-hidden">
             <video src={generatedVideo.url} controls autoPlay loop className="w-full h-auto object-cover aspect-video" />
          </div>
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-3">Your Video is Ready!</h3>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm h-32 overflow-y-auto border border-gray-700 p-3 rounded-md bg-gray-900/50">{generatedVideo.caption}</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleCopyCaption(generatedVideo.caption)} 
                  className="w-full py-2 px-3 bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  <Icon name={copiedCaption === generatedVideo.caption ? 'check' : 'copy'} className="mr-2 w-4 h-4" />
                  {copiedCaption === generatedVideo.caption ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => handleDownload(generatedVideo.url, 'creator-ai-video.mp4')}
                  className="w-full py-2 px-3 bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  <Icon name="download" className="mr-2 w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGeneratorView;