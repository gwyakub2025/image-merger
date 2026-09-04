import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UploadedImage, 
  BatchConfig, 
  BatchSet, 
  ProcessingProgress, 
  OutputFormat,
  ImageFilterType 
} from './types';
import { optimizeImageFile, createSampleImages } from './utils/imageOptimizer';
import { renderBatchToCanvas } from './utils/a4Renderer';
import { 
  exportAllBatchesAsPdf, 
  exportAllBatchesAsZip, 
  downloadDataUrl 
} from './utils/exportUtils';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { PromptInputBar } from './components/PromptInputBar';
import { UploadZone } from './components/UploadZone';
import { OptimizationStats } from './components/OptimizationStats';
import { BatchGrid } from './components/BatchGrid';
import { BatchPromptModal } from './components/BatchPromptModal';
import { BatchSheetModal } from './components/BatchSheetModal';
import { ImagePreviewMenuModal } from './components/ImagePreviewMenuModal';
import { CreateImageModal } from './components/CreateImageModal';
import { Footer } from './components/Footer';
import { CheckCircle2 } from 'lucide-react';

const DEFAULT_CONFIG: BatchConfig = {
  imagesPerPage: 2,
  orientation: 'portrait',
  fitMode: 'contain',
  layout3Style: 'featured-top',
  quality: 0.82,
  maxDimension: 1920,
  showCaptions: true,
  showPageNumbers: true,
  pageHeaderTitle: 'Gulf Way Group',
  outputFormat: 'pdf',
  backgroundColor: '#FFFFFF',
  marginMm: 12,
  spacingMm: 8,
};

export default function App() {
  const [config, setConfig] = useState<BatchConfig>(DEFAULT_CONFIG);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [batches, setBatches] = useState<BatchSet[]>([]);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(true);
  const [isInitialPrompt, setIsInitialPrompt] = useState(true);
  const [isCreateImageModalOpen, setIsCreateImageModalOpen] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);
  const [previewImageData, setPreviewImageData] = useState<{
    image: UploadedImage;
    batchIndex: number;
    slotIndex: number;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [progress, setProgress] = useState<ProcessingProgress>({
    total: 0,
    current: 0,
    statusText: '',
    isProcessing: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Calculate memory footprint for high density footer telemetry
  const totalMemoryBytes = useMemo(() => {
    const imagesMem = images.reduce((acc, img) => acc + img.compressedSize, 0);
    const batchesMem = batches.reduce((acc, b) => acc + (b.renderedBlob?.size || 0), 0);
    return imagesMem + batchesMem;
  }, [images, batches]);

  // Render batches whenever images or layout/config change
  const renderAllBatches = useCallback(
    async (imageList: UploadedImage[], currentConfig: BatchConfig) => {
      if (imageList.length === 0) {
        setBatches([]);
        return;
      }

      const chunkSize = currentConfig.imagesPerPage;
      const chunks: UploadedImage[][] = [];
      for (let i = 0; i < imageList.length; i += chunkSize) {
        chunks.push(imageList.slice(i, i + chunkSize));
      }

      setProgress({
        total: chunks.length,
        current: 0,
        statusText: `Generating ${chunks.length} A4 sheets (${chunkSize} images/page)...`,
        isProcessing: true,
      });

      const newBatches: BatchSet[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setProgress({
          total: chunks.length,
          current: i + 1,
          statusText: `Rendering A4 Batch Sheet ${i + 1} of ${chunks.length}...`,
          isProcessing: true,
        });

        try {
          const { dataUrl, blob } = await renderBatchToCanvas(
            chunks[i],
            i,
            chunks.length,
            currentConfig
          );

          newBatches.push({
            id: `batch-${i}-${Date.now()}`,
            batchIndex: i,
            images: chunks[i],
            renderedJpgUrl: dataUrl,
            renderedBlob: blob,
          });
        } catch (err) {
          console.error(`Failed to render batch ${i}:`, err);
        }
      }

      setBatches(newBatches);
      setProgress({ total: 0, current: 0, statusText: '', isProcessing: false });
    },
    []
  );

  // Handle new uploaded files
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setProgress({
      total: files.length,
      current: 0,
      statusText: `Optimizing ${files.length} images for web performance...`,
      isProcessing: true,
    });

    const optimizedList: UploadedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({
        total: files.length,
        current: i + 1,
        statusText: `Compressing "${file.name}" (${i + 1}/${files.length})...`,
        isProcessing: true,
      });

      try {
        const optimized = await optimizeImageFile(
          file,
          config.quality,
          config.maxDimension
        );
        optimizedList.push(optimized);
      } catch (err) {
        console.error('Optimization error:', err);
      }
    }

    const updatedImages = [...images, ...optimizedList];
    setImages(updatedImages);
    await renderAllBatches(updatedImages, config);
    showToast(`Processed ${optimizedList.length} assets into A4 queue.`);
  };

  // Load sample demo photos
  const handleLoadSamples = async () => {
    setProgress({
      total: 6,
      current: 1,
      statusText: 'Generating sample photography dataset...',
      isProcessing: true,
    });

    try {
      const sampleFiles = await createSampleImages();
      await handleFilesSelected(sampleFiles);
    } catch (err) {
      console.error('Failed to load sample images:', err);
      setProgress({ total: 0, current: 0, statusText: '', isProcessing: false });
    }
  };

  // Update batch configuration
  const handleSaveConfig = async (newConfig: BatchConfig) => {
    setConfig(newConfig);
    setIsInitialPrompt(false);
    if (images.length > 0) {
      await renderAllBatches(images, newConfig);
      showToast(`Batch layout updated: Max ${newConfig.imagesPerPage} images/A4 sheet.`);
    }
  };

  // Partial update from sidebar toggles
  const handlePartialConfigUpdate = async (partial: Partial<BatchConfig>) => {
    const newConfig = { ...config, ...partial };
    setConfig(newConfig);
    if (images.length > 0) {
      await renderAllBatches(images, newConfig);
    }
  };

  // Natural language prompt interpreter for the PromptInputBar
  const handleNaturalLanguagePrompt = async (promptText: string) => {
    const lower = promptText.toLowerCase();
    const updated: Partial<BatchConfig> = {};

    if (lower.includes('3 image') || lower.includes('3 per') || lower.includes('max 3')) {
      updated.imagesPerPage = 3;
    } else if (lower.includes('2 image') || lower.includes('2 per') || lower.includes('max 2')) {
      updated.imagesPerPage = 2;
    }

    if (lower.includes('landscape')) {
      updated.orientation = 'landscape';
    } else if (lower.includes('portrait')) {
      updated.orientation = 'portrait';
    }

    if (lower.includes('pdf')) {
      updated.outputFormat = 'pdf';
    } else if (lower.includes('jpg') || lower.includes('jpeg')) {
      updated.outputFormat = 'jpg';
    } else if (lower.includes('both') || lower.includes('zip')) {
      updated.outputFormat = 'both';
    }

    if (lower.includes('sample') || lower.includes('demo')) {
      await handleLoadSamples();
      return;
    }

    if (lower.includes('create image') || lower.includes('generate image') || lower.includes('ai image') || lower.includes('make image')) {
      setIsCreateImageModalOpen(true);
      return;
    }

    const newConfig = { ...config, ...updated };
    setConfig(newConfig);
    if (images.length > 0) {
      await renderAllBatches(images, newConfig);
    }
    showToast(`Prompt applied: Max ${newConfig.imagesPerPage} per sheet, ${newConfig.orientation}, ${newConfig.outputFormat.toUpperCase()}`);
  };

  // Remove individual image
  const handleRemoveImage = async (imageId: string) => {
    const updated = images.filter((img) => img.id !== imageId);
    setImages(updated);
    await renderAllBatches(updated, config);
    showToast('Asset removed from queue.');
  };

  // Move image position
  const handleMoveImage = async (imageId: string, direction: 'up' | 'down') => {
    const idx = images.findIndex((img) => img.id === imageId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === images.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newImages = [...images];
    const [moved] = newImages.splice(idx, 1);
    newImages.splice(targetIdx, 0, moved);

    setImages(newImages);
    await renderAllBatches(newImages, config);
  };

  // Update individual image filter (Grayscale, Sepia, High Contrast, None)
  const handleUpdateImageFilter = async (imageId: string, filter: ImageFilterType) => {
    const updated = images.map((img) => (img.id === imageId ? { ...img, filter } : img));
    setImages(updated);

    if (previewImageData && previewImageData.image.id === imageId) {
      const current = updated.find((img) => img.id === imageId);
      if (current) {
        setPreviewImageData((prev) => (prev ? { ...prev, image: current } : null));
      }
    }

    await renderAllBatches(updated, config);
    const filterLabel = filter === 'none' ? 'ORIGINAL' : filter.toUpperCase();
    showToast(`Applied ${filterLabel} filter to asset.`);
  };

  // Apply filter to all images on a specific A4 sheet batch
  const handleApplyFilterToBatch = async (batchIndex: number, filter: ImageFilterType) => {
    if (!batches[batchIndex]) return;
    const targetIds = new Set(batches[batchIndex].images.map((img) => img.id));
    const updated = images.map((img) => (targetIds.has(img.id) ? { ...img, filter } : img));
    setImages(updated);

    if (previewImageData && targetIds.has(previewImageData.image.id)) {
      const current = updated.find((img) => img.id === previewImageData.image.id);
      if (current) {
        setPreviewImageData((prev) => (prev ? { ...prev, image: current } : null));
      }
    }

    await renderAllBatches(updated, config);
    const filterLabel = filter === 'none' ? 'ORIGINAL' : filter.toUpperCase();
    showToast(`Applied ${filterLabel} filter to Batch #${batchIndex + 1}.`);
  };

  // Apply filter across all images in the queue
  const handleApplyFilterToAll = async (filter: ImageFilterType) => {
    const updated = images.map((img) => ({ ...img, filter }));
    setImages(updated);

    if (previewImageData) {
      const current = updated.find((img) => img.id === previewImageData.image.id);
      if (current) {
        setPreviewImageData((prev) => (prev ? { ...prev, image: current } : null));
      }
    }

    await renderAllBatches(updated, config);
    const filterLabel = filter === 'none' ? 'ORIGINAL' : filter.toUpperCase();
    showToast(`Applied ${filterLabel} filter to all ${images.length} images.`);
  };

  // Add AI-generated image directly into queue
  const handleAddGeneratedImage = async (newImage: UploadedImage) => {
    const updated = [...images, newImage];
    setImages(updated);
    await renderAllBatches(updated, config);
    showToast('AI-generated image added to batch queue.');
  };

  // Replace existing image with AI-edited version
  const handleReplaceImage = async (oldImageId: string, newImage: UploadedImage) => {
    const updated = images.map((img) => (img.id === oldImageId ? newImage : img));
    setImages(updated);

    if (previewImageData && previewImageData.image.id === oldImageId) {
      setPreviewImageData((prev) => (prev ? { ...prev, image: newImage } : null));
    }

    await renderAllBatches(updated, config);
    showToast('Image replaced with AI edited version.');
  };

  // Clear all images
  const handleClearAll = () => {
    if (window.confirm('Reset queue and clear all uploaded images?')) {
      setImages([]);
      setBatches([]);
      setActivePreviewIndex(null);
      showToast('Engine queue cleared.');
    }
  };

  // Handle Export All
  const handleExportAll = async (formatOverride?: OutputFormat) => {
    if (batches.length === 0) return;

    const format = formatOverride || config.outputFormat;
    setIsExporting(true);

    try {
      if (format === 'pdf') {
        await exportAllBatchesAsPdf(batches, config, `A4_Batch_${batches.length}_Pages.pdf`);
        showToast(`Multipage A4 PDF (${batches.length} pages) downloaded.`);
      } else if (format === 'jpg') {
        if (batches.length === 1 && batches[0].renderedJpgUrl) {
          downloadDataUrl(batches[0].renderedJpgUrl, 'Batch_Set_001.jpg');
          showToast('Batch_Set_001.jpg downloaded.');
        } else {
          await exportAllBatchesAsZip(batches, config, false);
          showToast(`Archive with all ${batches.length} A4 JPG sheets downloaded.`);
        }
      } else if (format === 'both') {
        await exportAllBatchesAsZip(batches, config, true);
        showToast(`Complete package (A4 JPGs + Multipage PDF) downloaded.`);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export files. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col md:flex-row overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* High Density Left Sidebar (Desktop & Mobile Drawer) */}
      <div className={`fixed inset-y-0 left-0 z-50 md:static md:flex transform transition-transform duration-200 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <Sidebar
          config={config}
          onUpdateConfig={handlePartialConfigUpdate}
          onOpenModal={() => {
            setIsInitialPrompt(false);
            setIsPromptModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onOpenCreateImageModal={() => {
            setIsCreateImageModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          totalBatches={batches.length}
          totalImages={images.length}
        />
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-2xs"
        />
      )}

      {/* Main High Density Workbench Section */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#f8fafc]">
        {/* Top Header */}
        <Toolbar
          config={config}
          batches={batches}
          totalImagesCount={images.length}
          onOpenPromptModal={() => {
            setIsInitialPrompt(false);
            setIsPromptModalOpen(true);
          }}
          onOpenCreateImageModal={() => setIsCreateImageModalOpen(true)}
          onExportAll={handleExportAll}
          onClearAll={handleClearAll}
          isExporting={isExporting}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Scrollable Workbench Body */}
        <section className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Prompt Input Upload Bar */}
          <PromptInputBar
            config={config}
            onApplyPrompt={handleNaturalLanguagePrompt}
            onOpenCreateImageModal={() => setIsCreateImageModalOpen(true)}
            totalBatches={batches.length}
            totalImages={images.length}
          />

          {/* Bulk Upload Zone */}
          <UploadZone
            onFilesSelected={handleFilesSelected}
            onLoadSamples={handleLoadSamples}
            onOpenCreateImageModal={() => setIsCreateImageModalOpen(true)}
            progress={progress}
            totalImagesCount={images.length}
            maxImagesPerPage={config.imagesPerPage}
          />

          {/* Web Performance & Compression Telemetry Stats */}
          <OptimizationStats
            images={images}
            batches={batches}
            maxImagesPerPage={config.imagesPerPage}
          />

          {/* Active A4 Batch Sheets Grid */}
          <BatchGrid
            batches={batches}
            config={config}
            onPreviewBatch={(idx) => setActivePreviewIndex(idx)}
            onRemoveImage={handleRemoveImage}
            onMoveImage={handleMoveImage}
            onUploadMore={() => {
              const input = document.getElementById('bulk-file-input') as HTMLInputElement;
              input?.click();
            }}
            onPreviewImage={(image, batchIndex, slotIndex) => {
              setPreviewImageData({ image, batchIndex, slotIndex });
            }}
            onUpdateFilter={handleUpdateImageFilter}
            onApplyFilterToBatch={handleApplyFilterToBatch}
          />
        </section>

        {/* High Density Telemetry Footer */}
        <Footer
          totalImages={images.length}
          totalBatches={batches.length}
          totalMemoryBytes={totalMemoryBytes}
          config={config}
        />
      </main>

      {/* Individual Image Preview & Filters Menu Modal */}
      {previewImageData && (
        <ImagePreviewMenuModal
          image={previewImageData.image}
          isOpen={!!previewImageData}
          onClose={() => setPreviewImageData(null)}
          onApplyFilter={handleUpdateImageFilter}
          onApplyFilterToBatch={(filter) => handleApplyFilterToBatch(previewImageData.batchIndex, filter)}
          onApplyFilterToAll={handleApplyFilterToAll}
          onReplaceImage={handleReplaceImage}
          onAddImage={handleAddGeneratedImage}
          allImages={images}
          onSelectImage={(newImg) => {
            const bIdx = batches.findIndex((b) => b.images.some((img) => img.id === newImg.id));
            const sIdx = bIdx !== -1 ? batches[bIdx].images.findIndex((img) => img.id === newImg.id) : 0;
            setPreviewImageData({ image: newImg, batchIndex: bIdx !== -1 ? bIdx : 0, slotIndex: sIdx });
          }}
          batchIndex={previewImageData.batchIndex}
          slotIndex={previewImageData.slotIndex}
        />
      )}

      {/* AI Image Generation Modal */}
      <CreateImageModal
        isOpen={isCreateImageModalOpen}
        onClose={() => setIsCreateImageModalOpen(false)}
        onAddImageToQueue={handleAddGeneratedImage}
      />

      {/* Initial Batch Prompt & Rules Modal */}
      <BatchPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setIsInitialPrompt(false);
        }}
        config={config}
        onSaveConfig={handleSaveConfig}
        isInitialPrompt={isInitialPrompt}
      />

      {/* Full Resolution A4 Sheet Lightbox Preview */}
      {activePreviewIndex !== null && batches[activePreviewIndex] && (
        <BatchSheetModal
          batch={batches[activePreviewIndex]}
          totalBatches={batches.length}
          config={config}
          onClose={() => setActivePreviewIndex(null)}
          onSelectBatch={(idx) => setActivePreviewIndex(idx)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast-notification"
          className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white text-xs font-mono font-medium px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
