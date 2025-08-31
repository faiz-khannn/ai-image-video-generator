import React, { useState, useCallback } from 'react';
import { generateImagesAndCaptions } from '../services/geminiService';
import type { User } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import { Icon } from './common/Icon';

interface ImageGeneratorViewProps {
  user: User | null;
}

const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({ user }) => {
  const [prompt, setPrompt] = useState('A hyper-realistic photo of a baby panda trying to solve a Rubik\'s cube');
  const [textOverlay, setTextOverlay] = useState('');
  const [variations, setVariations] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{url: string; caption: string}[]>([]);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const images = await generateImagesAndCaptions(prompt, textOverlay, variations, user?.uid);
      setGeneratedImages(images);
    } catch (e) {
      console.error(e);
      setError('Failed to generate images. Please check your API key and network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, textOverlay, variations, user]);

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
        <h2 className="text-3xl font-bold">Image Generation</h2>
        <p className="text-gray-400 mt-1">Create stunning, social-media-ready images with AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 p-6 bg-gray-800/50 rounded-lg flex flex-col space-y-6 h-fit">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A cinematic shot of a robot meditating in a lush forest"
              className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
          <div>
            <label htmlFor="textOverlay" className="block text-sm font-medium text-gray-300 mb-2">Text on Image <span className="text-gray-500">(Optional)</span></label>
            <input
              id="textOverlay"
              type="text"
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="e.g., 'Dream Big'"
              className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
          <div>
            <label htmlFor="variations" className="block text-sm font-medium text-gray-300 mb-2">Variations: {variations}</label>
            <input
              id="variations"
              type="range"
              min="1"
              max="4"
              value={variations}
              onChange={(e) => setVariations(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner /> : <><Icon name="generate" className="mr-2" /> Generate</>}
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2">
          {error && <div className="p-4 mb-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}
          
          {isLoading && (
            <div className="flex justify-center items-center h-64 bg-gray-800/50 rounded-lg">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-lg mt-4">Generating your masterpieces...</p>
                </div>
            </div>
          )}

          {!isLoading && generatedImages.length > 0 && (
            <div className={`grid gap-6 grid-cols-1 ${generatedImages.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {generatedImages.map((image, index) => (
                <div key={index} className="bg-gray-800 rounded-lg overflow-hidden group animate-fade-in">
                  <img src={image.url} alt={`Generated art ${index + 1}`} className="w-full h-auto aspect-square object-cover" />
                  <div className="p-4 space-y-3">
                    <p className="text-gray-300 text-sm h-24 overflow-y-auto p-2 border border-gray-700 rounded-md">{image.caption}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleCopyCaption(image.caption)} 
                        className="w-full py-2 px-3 bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        <Icon name={copiedCaption === image.caption ? 'check' : 'copy'} className="mr-2 w-4 h-4" />
                        {copiedCaption === image.caption ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleDownload(image.url, `creator-ai-image-${index + 1}.jpeg`)}
                        className="w-full py-2 px-3 bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        <Icon name="download" className="mr-2 w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
           {!isLoading && generatedImages.length === 0 && (
                <div className="flex flex-col justify-center items-center h-64 text-center bg-gray-800/50 rounded-lg">
                    <Icon name="image" className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400">Your generated images will appear here</h3>
                    <p className="text-gray-500">Fill out the form and click "Generate"</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorView;