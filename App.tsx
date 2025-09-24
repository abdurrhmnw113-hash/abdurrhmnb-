import React, { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { OptionSelector } from './components/OptionSelector';
import { Lightbox } from './components/Lightbox';
import { generateEditedImage } from './services/geminiService';
import { ASPECT_RATIOS, LIGHTING_STYLES, CAMERA_PERSPECTIVES } from './constants';
import type { ImageFile, GeneratedResult } from './types';

const SpinnerIcon: React.FC = () => (
    <svg aria-hidden="true" className="w-6 h-6 text-neutral-700 animate-spin fill-[#EDCB05]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
);

const Header: React.FC = () => (
    <header className="text-center mb-8">
        <img src="https://storage.googleapis.com/generative-ai-pro-is-hackathon-prod/user-file-121650b8-9e55-4089-afb5-b77873528b8a/document-90-28109-source.png" alt="Site Logo" className="w-48 h-auto mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white">Abdulrahman Al-Jabri</h1>
        <p className="text-lg text-gray-400 mt-2">AI-Powered Photo Studio</p>
        <a 
            href="https://t.me/N2BRAS4" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-gray-400 hover:text-[#EDCB05] transition-colors"
            aria-label="Contact on Telegram"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15.91L18.2 17.05c-.24.72-.83.9-1.51.55l-4.22-2.92-2.03 2.07c-.33.33-.61.46-1.1.28z"/>
            </svg>
            <span>Contact on Telegram</span>
        </a>
    </header>
);

const App: React.FC = () => {
    const [productImage, setProductImage] = useState<ImageFile | null>(null);
    const [styleImage, setStyleImage] = useState<ImageFile | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
    const [lightingStyle, setLightingStyle] = useState<string>(LIGHTING_STYLES[0].value);
    const [cameraPerspective, setCameraPerspective] = useState<string>(CAMERA_PERSPECTIVES[0].value);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<GeneratedResult[]>([]);
    const [activeResultIndex, setActiveResultIndex] = useState<number | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    useEffect(() => {
        let prompt = `Create a professional, high-resolution product shot of the subject. The final image should have an aspect ratio of ${aspectRatio}, featuring ${lightingStyle}. The camera angle should be a ${cameraPerspective}.`;
        if (styleImage) {
            prompt += ' Emulate the overall mood, color palette, lighting, and texture of the provided style reference image to create a cohesive and visually appealing result.';
        }
        setGeneratedPrompt(prompt);
    }, [aspectRatio, lightingStyle, cameraPerspective, styleImage]);

    const handleGenerate = useCallback(async () => {
        if (!productImage) {
            setError('Please upload a product photo first.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const result = await generateEditedImage(productImage, styleImage, generatedPrompt, aspectRatio);
            setHistory(prev => [result, ...prev]);
            setActiveResultIndex(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [productImage, styleImage, generatedPrompt, aspectRatio]);
    
    const handleDownload = (imageUrl: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `ai-photo-studio-${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const activeResult = activeResultIndex !== null ? history[activeResultIndex] : null;

    return (
        <>
            {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
            <div className="min-h-screen bg-[#300000] p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Header />
                    <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Controls Panel */}
                        <div className="bg-[#200000] p-6 rounded-lg shadow-lg flex flex-col gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-[#EDCB05] mb-2">1. Upload Product Photo</h3>
                                <ImageUploader 
                                    id="product-uploader"
                                    image={productImage}
                                    onImageUpload={setProductImage}
                                    title="Click to upload product"
                                    description="PNG, JPG, or WEBP"
                                    className="h-80"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-[#EDCB05] mb-2">2. (Optional) Upload Style Reference</h3>
                                    <ImageUploader 
                                        id="style-uploader"
                                        image={styleImage}
                                        onImageUpload={setStyleImage}
                                        title="Upload style reference"
                                        description="Optional image"
                                        className="h-48"
                                    />
                                </div>
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-lg font-semibold text-[#EDCB05]">3. Select Parameters</h3>
                                    <OptionSelector id="aspect-ratio" label="Aspect Ratio" options={ASPECT_RATIOS} value={aspectRatio} onChange={setAspectRatio} />
                                    <OptionSelector id="lighting-style" label="Lighting Style" options={LIGHTING_STYLES} value={lightingStyle} onChange={setLightingStyle} />
                                    <OptionSelector id="camera-perspective" label="Camera Perspective" options={CAMERA_PERSPECTIVES} value={cameraPerspective} onChange={setCameraPerspective} />
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="generated-prompt" className="block mb-2 text-sm font-medium text-gray-300">Generated Prompt</label>
                                <textarea
                                    id="generated-prompt"
                                    readOnly
                                    value={generatedPrompt}
                                    className="bg-[#2c0e0e] border border-[#441c1c] text-gray-300 text-sm rounded-lg block w-full p-2.5 h-32 resize-none"
                                />
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading || !productImage}
                                className="w-full bg-[#EDCB05] text-black font-bold py-3 px-4 rounded-lg hover:bg-[#d4b604] transition-colors disabled:bg-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed flex items-center justify-center text-base"
                            >
                                {isLoading ? <SpinnerIcon /> : null}
                                <span className={isLoading ? 'ml-2' : ''}>{isLoading ? 'Generating...' : 'Generate Image'}</span>
                            </button>
                        </div>

                        {/* Output Panel */}
                        <div className="bg-[#200000] p-6 rounded-lg shadow-lg flex flex-col items-center justify-center min-h-[500px]">
                            {isLoading && (
                                <div className="text-center">
                                    <SpinnerIcon/>
                                    <p className="mt-4 text-gray-400">Generating your image... please wait.</p>
                                </div>
                            )}
                            {error && (
                                <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
                                    <h3 className="font-bold">Error</h3>
                                    <p>{error}</p>
                                </div>
                            )}
                            {!isLoading && !error && activeResult && (
                                 <div className="w-full flex flex-col items-center gap-4">
                                    <h2 className="text-2xl font-bold text-white self-start">Generated Image</h2>
                                    <div className="w-full relative">
                                        <img 
                                          src={activeResult.imageUrl} 
                                          alt="Generated result" 
                                          className="rounded-lg max-w-full max-h-[60vh] object-contain mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => setLightboxImage(activeResult.imageUrl)}
                                        />
                                    </div>
                                    <button onClick={() => handleDownload(activeResult.imageUrl)} className="bg-[#2c0e0e] hover:bg-[#441c1c] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Download Image
                                    </button>
                                    {activeResult.text && (
                                        <div className="w-full bg-[#2c0e0e] p-4 rounded-lg mt-2">
                                          <h3 className="font-semibold text-[#EDCB05] mb-2">Model's Note:</h3>
                                          <p className="text-gray-300 text-sm">{activeResult.text}</p>
                                        </div>
                                    )}

                                    {history.length > 1 && (
                                        <div className="w-full mt-6 border-t border-[#441c1c] pt-4">
                                            <h3 className="text-lg font-semibold text-white mb-3">History</h3>
                                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                                                {history.map((result, index) => (
                                                    <button 
                                                        key={index}
                                                        onClick={() => setActiveResultIndex(index)}
                                                        className={`flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#200000] focus:ring-[#EDCB05] ${activeResultIndex === index ? 'border-[#EDCB05] scale-105' : 'border-[#441c1c] hover:border-[#663333]'}`}
                                                        aria-label={`View generated image ${index + 1}`}
                                                    >
                                                        <img src={result.imageUrl} alt={`History item ${index + 1}`} className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {!isLoading && !error && !activeResult && (
                                <div className="text-center text-gray-500">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m5.5-5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-semibold text-gray-400">Output Area</h3>
                                    <p className="mt-1 text-sm text-gray-500">Your generated image will appear here.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default App;