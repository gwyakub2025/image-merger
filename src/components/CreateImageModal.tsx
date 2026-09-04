import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Download, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { UploadedImage } from '../types';
import { generateImageWithGemini, convertDataUrlToUploadedImage } from '../utils/geminiImageApi';

interface CreateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImageToQueue: (image: UploadedImage) => void;
}

const PROMPT_SUGGESTIONS = [
  {
    label: 'Modern Architecture',
    prompt: 'A sleek minimalist concrete and glass museum pavilion surrounded by serene shallow water reflecting soft morning light, architectural photography, ultra-detailed',
  },
  {
    label: 'Alpine Sunset',
    prompt: 'Golden hour dramatic mountain range with jagged peaks, glowing warm sunset clouds, and an alpine lake with pine trees, photorealistic landscape',
  },
  {
    label: 'Botanical Still Life',
    prompt: 'Elegant botanical still life with monstera leaves, eucalyptus, and white peonies in a ceramic vase against a clean warm neutral backdrop, soft studio lighting',
  },
  {
    label: 'Minimalist Interior',
    prompt: 'Bright Scandinavian living room with natural oak furniture, linen sofa, potted fiddle leaf fig, large sunlit window with sheer curtains, photorealistic',
  },
  {
    label: 'Watercolor Art',
    prompt: 'Artistic watercolor painting of a European coastal village with colorful houses, gentle harbor waves, and subtle color bleed textures, fine art print',
  },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', desc: 'Equal sides' },
  { id: '3:4', label: '3:4 Portrait', desc: 'Ideal for A4 vertical' },
  { id: '4:3', label: '4:3 Standard', desc: 'Classic photo ratio' },
  { id: '16:9', label: '16:9 Wide', desc: 'Landscape banner' },
];

export const CreateImageModal: React.FC<CreateImageModalProps> = ({
  isOpen,
  onClose,
  onAddImageToQueue,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    dataUrl: string;
    modelUsed: string;
    promptUsed: string;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setAddedSuccess(false);

    try {
      const res = await generateImageWithGemini(prompt.trim(), aspectRatio);
      setGeneratedResult({
        dataUrl: res.dataUrl,
        modelUsed: res.modelUsed,
        promptUsed: prompt.trim(),
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate image. Please check your API key or network connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToBatch = async () => {
    if (!generatedResult || isAdding) return;
    setIsAdding(true);
    try {
      const filename = `gemini-${Date.now().toString().slice(-4)}.jpg`;
      const uploadedImg = await convertDataUrlToUploadedImage(generatedResult.dataUrl, filename);
      onAddImageToQueue(uploadedImg);
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 2500);
    } catch (err: any) {
      setError(`Failed to prepare image for batch: ${err?.message || err}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      id="create-image-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                  Gulf Way Group
                </span>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Create Image with Text Prompt
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md border border-indigo-200">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Generate high-resolution photography and illustrations directly into your A4 batch queue
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-create-image-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Prompt Form */}
          <form onSubmit={handleGenerate} className="space-y-3">
            <div>
              <label 
                htmlFor="gemini-create-prompt-input" 
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Image Description Prompt
              </label>
              <textarea
                id="gemini-create-prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your desired image in detail (subject, lighting, composition, style, color palette)..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all font-sans"
              />
            </div>

            {/* Suggestions Chips */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Inspiration Suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(sug.prompt)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-600 transition-colors"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Options */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      aspectRatio === ar.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{ar.label}</div>
                    <div className="text-[10px] text-slate-400">{ar.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit / Generate Button */}
            <div className="pt-1">
              <button
                type="submit"
                id="submit-generate-image-btn"
                disabled={!prompt.trim() || isGenerating}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs ${
                  !prompt.trim() || isGenerating
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating with Gemini 3.1 Flash Image Preview...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error display */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold">Generation Error</div>
                <div className="mt-0.5 text-rose-700">{error}</div>
              </div>
            </div>
          )}

          {/* Result preview */}
          {generatedResult && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>Generated Preview</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                    READY
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Model: {generatedResult.modelUsed}
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[260px] max-h-[400px]">
                <img
                  src={generatedResult.dataUrl}
                  alt={generatedResult.promptUsed}
                  className="max-h-[380px] w-auto object-contain"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  id="add-generated-to-batch-btn"
                  onClick={handleAddToBatch}
                  disabled={isAdding}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs ${
                    addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : addedSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    {addedSuccess ? 'Added to Batch Queue!' : 'Add to A4 Batch Queue'}
                  </span>
                </button>

                <a
                  href={generatedResult.dataUrl}
                  download={`gemini-${Date.now()}.png`}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Download Standalone</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
