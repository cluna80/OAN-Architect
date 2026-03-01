import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageDropZoneProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
  entityName: string;
}

export const ImageDropZone: React.FC<ImageDropZoneProps> = ({
  currentImage,
  onImageChange,
  entityName
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onImageChange(objectUrl);
      
      // In production, you'd upload to server here
      // For now, we're using local object URLs
    }
  }, [onImageChange]);

  const handleUrlInput = (url: string) => {
    setPreview(url);
    onImageChange(url);
  };

  const clearImage = () => {
    setPreview('');
    onImageChange('');
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
          dragActive 
            ? 'border-[#22d3ee] bg-[#22d3ee]/10' 
            : 'border-white/20 bg-white/5 hover:border-white/40'
        }`}
      >
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt={entityName}
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 mx-auto mb-3 text-white/40" />
            <p className="text-sm text-white/60 mb-2">
              Drag & drop robot image here
            </p>
            <p className="text-xs text-white/40">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-xs text-white/60 uppercase tracking-wider">
          Or enter image URL
        </label>
        <input
          type="text"
          value={preview}
          onChange={(e) => handleUrlInput(e.target.value)}
          placeholder="https://example.com/robot.png"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#22d3ee] outline-none transition-all"
        />
      </div>
    </div>
  );
};
