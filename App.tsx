import React, { useState, useRef } from 'react';
import { generateImage } from './services/geminiService';
import { GeneratedImage, GenerationSettings, ReferenceImage } from './types';
import { SparklesIcon, UploadIcon, DownloadIcon, TrashIcon, HistoryIcon } from './components/Icons';

function App() {
  // State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: "1:1",
    imageSize: "4K",
    style: "Photorealistic"
  });
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract base64 data only (remove data:image/jpeg;base64,)
        const base64Data = base64String.split(',')[1];
        
        const newRef: ReferenceImage = {
          id: Date.now().toString(),
          data: base64Data,
          mimeType: file.type
        };
        setReferenceImages(prev => [...prev, newRef]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReference = (id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const handleGenerate = async () => {
    if (!prompt && referenceImages.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const imageDataUrl = await generateImage(prompt, referenceImages, settings);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageDataUrl,
        prompt: prompt,
        timestamp: Date.now(),
        width: settings.imageSize === "4K" ? 4096 : settings.imageSize === "2K" ? 2048 : 1024,
        height: settings.imageSize === "4K" ? 4096 : settings.imageSize === "2K" ? 2048 : 1024, // simplified for 1:1
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setSelectedImage(newImage); // Auto select new image
    } catch (err: any) {
      console.error("Failed to generate image", err);
      let errorMessage = "Connection failed. Please check your internet.";
      if (err.message) errorMessage = err.message;
      if (err.toString().includes("API Key")) errorMessage = "System Error: API Configuration Missing.";
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hyper-black text-gray-200 font-sans selection:bg-hyper-purple/40 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.1),transparent_40%)] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-hyper-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-2 h-8 bg-hyper-purple rounded-full shadow-[0_0_10px_#7c3aed]"></div>
             <span className="font-display font-bold text-xl tracking-widest text-white">HYPERREAL</span>
          </div>
          <div className="flex gap-4">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${error ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                <span className={`text-xs font-mono ${error ? 'text-red-400' : 'text-gray-400'}`}>
                  {error ? 'SYSTEM OFF-LINE' : 'SYSTEM ONLINE'}
                </span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Prompt Section */}
          <div className="bg-hyper-surface border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-hyper-purple/5 to-transparent pointer-events-none group-hover:from-hyper-purple/10 transition-all"></div>
            <label className="block text-sm font-medium text-hyper-glow mb-2 uppercase tracking-wider">Prompt Interface</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision in extreme detail..."
              className="w-full bg-black/50 border border-white/10 rounded-lg p-4 h-40 text-sm focus:outline-none focus:border-hyper-purple focus:ring-1 focus:ring-hyper-purple transition-all resize-none placeholder-gray-600"
            />
          </div>

          {/* Reference Images */}
          <div className="bg-hyper-surface border border-white/5 rounded-xl p-6 shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-hyper-glow uppercase tracking-wider">Reference Inputs</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  <UploadIcon className="w-3 h-3" /> Upload
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
             </div>
             
             {referenceImages.length === 0 ? (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="h-24 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:border-hyper-purple/50 hover:bg-hyper-purple/5 transition-all"
               >
                 <span className="text-xs text-gray-500">Drop images here or click to upload</span>
               </div>
             ) : (
               <div className="grid grid-cols-3 gap-2">
                 {referenceImages.map((ref) => (
                   <div key={ref.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                      <img src={`data:${ref.mimeType};base64,${ref.data}`} alt="Reference" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeReference(ref.id)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <TrashIcon className="w-5 h-5 text-red-500" />
                      </button>
                   </div>
                 ))}
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5 transition-all"
                 >
                   <span className="text-xl text-gray-500">+</span>
                 </div>
               </div>
             )}
          </div>

          {/* Settings */}
          <div className="bg-hyper-surface border border-white/5 rounded-xl p-6 shadow-xl grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 uppercase mb-1">Style Engine</label>
              <select 
                value={settings.style}
                onChange={(e) => setSettings({...settings, style: e.target.value as any})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-gray-300 focus:border-hyper-purple outline-none"
              >
                {["Photorealistic", "Cinematic", "Anime", "Cyberpunk", "Surreal", "3D Render", "Oil Painting"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Resolution</label>
              <select 
                value={settings.imageSize}
                onChange={(e) => setSettings({...settings, imageSize: e.target.value as any})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-gray-300 focus:border-hyper-purple outline-none"
              >
                <option value="1K">1K (Fast)</option>
                <option value="2K">2K (High)</option>
                <option value="4K">4K (Ultra)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Aspect Ratio</label>
              <select 
                value={settings.aspectRatio}
                onChange={(e) => setSettings({...settings, aspectRatio: e.target.value as any})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-gray-300 focus:border-hyper-purple outline-none"
              >
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="3:4">3:4 Vertical</option>
                <option value="4:3">4:3 Standard</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || (!prompt && referenceImages.length === 0)}
            className={`w-full py-4 rounded-xl font-bold font-display tracking-widest uppercase transition-all flex items-center justify-center gap-3
              ${loading 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-hyper-purple to-violet-600 text-white hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:scale-[1.02]'
              }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                PROCESSING...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                INITIATE RENDER
              </>
            )}
          </button>

        </div>

        {/* Right Panel: Display & Gallery */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-[calc(100vh-8rem)]">
          
          {/* Main Display */}
          <div className="flex-1 bg-hyper-surface border border-white/5 rounded-xl shadow-2xl relative flex items-center justify-center overflow-hidden group">
            {selectedImage ? (
              <>
                 <img 
                    src={selectedImage.url} 
                    alt={selectedImage.prompt} 
                    className="max-w-full max-h-full object-contain shadow-2xl" 
                 />
                 {/* Overlay Actions */}
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a 
                      href={selectedImage.url} 
                      download={`hyperreal-${selectedImage.id}.png`}
                      className="p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-hyper-purple transition-colors"
                      title="Download Full Res"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </a>
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-gray-300 text-sm line-clamp-2">{selectedImage.prompt}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 font-mono">
                      <span>{selectedImage.width}x{selectedImage.height}</span>
                      <span>HYPERREAL ENGINE</span>
                    </div>
                 </div>
              </>
            ) : (
              <div className="text-center space-y-4 opacity-50 relative z-10 p-6">
                 {error ? (
                    <div className="flex flex-col items-center text-red-400 gap-4">
                       <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <span className="text-3xl">!</span>
                       </div>
                       <div>
                         <h3 className="font-display text-lg tracking-widest mb-1">GENERATION FAILED</h3>
                         <p className="text-sm font-mono max-w-md mx-auto">{error}</p>
                       </div>
                    </div>
                 ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center animate-pulse">
                          <SparklesIcon className="w-10 h-10 text-hyper-purple" />
                      </div>
                      <p className="font-display tracking-widest text-gray-500">AWAITING INPUT DATA</p>
                    </>
                 )}
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                 <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-hyper-purple animate-[loading_1.5s_ease-in-out_infinite] w-1/2"></div>
                 </div>
                 <p className="mt-4 font-mono text-hyper-glow animate-pulse">RENDERING ASSETS...</p>
                 <style>{`
                   @keyframes loading {
                     0% { transform: translateX(-100%); }
                     100% { transform: translateX(200%); }
                   }
                 `}</style>
              </div>
            )}
          </div>

          {/* History / Gallery Strip */}
          <div className="h-32 bg-hyper-surface border border-white/5 rounded-xl p-4 overflow-x-auto">
             <div className="flex gap-4 h-full">
                {generatedImages.length === 0 ? (
                  <div className="flex items-center justify-center w-full text-gray-600 text-sm gap-2">
                    <HistoryIcon className="w-4 h-4" /> NO HISTORY
                  </div>
                ) : (
                  generatedImages.map((img) => (
                    <div 
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`relative min-w-[6rem] h-full rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage?.id === img.id ? 'border-hyper-purple shadow-[0_0_10px_#7c3aed]' : 'border-transparent hover:border-white/20'}`}
                    >
                       <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;