import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { uploadImageAsset, UploadEndpointKey } from '../lib/uploadService';

interface ImageUploaderProps {
  endpoint?: UploadEndpointKey;
  currentImageUrl?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'banner';
  label?: string;
  placeholderText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  endpoint = 'generalImage',
  currentImageUrl,
  onUploadSuccess,
  onUploadError,
  className = '',
  aspectRatio = 'video',
  label = 'Upload Image',
  placeholderText = 'Drag & drop image file or click to browse'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync incoming external URL changes
  React.useEffect(() => {
    if (currentImageUrl !== undefined) {
      setPreviewUrl(currentImageUrl || null);
    }
  }, [currentImageUrl]);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-[240px]'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4] max-w-[280px]'
      : aspectRatio === 'banner'
      ? 'aspect-[21/9] w-full'
      : 'aspect-video w-full';

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const err = new Error('Please upload a valid image file (PNG, JPG, WEBP, GIF).');
      setErrorMessage(err.message);
      onUploadError?.(err);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Step animation progress
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 150);

      const permanentCdnUrl = await uploadImageAsset(file, endpoint);

      clearInterval(progressTimer);
      setUploadProgress(100);
      setPreviewUrl(permanentCdnUrl);
      setIsSuccess(true);
      setIsUploading(false);
      onUploadSuccess(permanentCdnUrl);

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setIsUploading(false);
      const errObj = err instanceof Error ? err : new Error(err?.message || 'Upload failed');
      setErrorMessage(errObj.message);
      onUploadError?.(errObj);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setIsSuccess(false);
    setErrorMessage(null);
    onUploadSuccess('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">
            {endpoint === 'avatar' ? 'Max 2MB • Images Only' : 'Max 4MB • Fast CDN'}
          </span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Upload & Preview Card */}
      <div className="relative group">
        {previewUrl ? (
          <div
            className={`relative ${aspectClass} rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl transition-all group-hover:border-pink-500/50`}
          >
            <img
              src={previewUrl}
              alt="Uploaded Asset Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Quick Change / Remove Floating Overlay Buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-950/80 hover:bg-pink-950 text-zinc-300 hover:text-pink-300 border border-zinc-700/80 hover:border-pink-500/50 text-[11px] font-bold shadow-lg backdrop-blur-md flex items-center gap-1 transition"
                title="Change Image"
              >
                <Upload className="w-3 h-3 text-pink-400" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-xl bg-zinc-950/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-700/80 hover:border-rose-700/60 shadow-lg backdrop-blur-md transition"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isSuccess && (
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Uploaded to UploadThing CDN</span>
              </div>
            )}
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragOver
                ? 'border-pink-500 bg-pink-950/20 scale-[1.01]'
                : 'border-zinc-800 bg-zinc-950/60 hover:border-pink-500/60 hover:bg-zinc-900/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-pink-400 group-hover:scale-110 group-hover:border-pink-500/50 transition">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200 group-hover:text-pink-400 transition">
                {placeholderText}
              </p>
              <p className="text-[10px] text-zinc-500">
                Supports PNG, JPG, WebP, GIF • Automatically optimized & CDN hosted
              </p>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold transition shadow"
            >
              Select File from PC
            </button>
          </div>
        )}

        {/* Uploading Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 rounded-2xl bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 border border-pink-500/40 z-20">
            <Loader2 className="w-7 h-7 text-pink-500 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-white">Uploading to UploadThing...</p>
              <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">{uploadProgress}% complete</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
