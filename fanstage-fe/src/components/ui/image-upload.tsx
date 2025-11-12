import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { ipfsService } from '@/services/ipfs';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  id?: string; // for unique file inputs
  compact?: boolean; // smaller size for tier images
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  accept = 'image/*',
  maxSize = 5, // 5MB default
  id = 'image-input',
  compact = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        return 'Please select a valid image file (JPG, PNG, GIF, WebP, etc.)';
      }

      // Check file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size must be less than ${maxSize}MB. Current file is ${(
          file.size /
          1024 /
          1024
        ).toFixed(2)}MB`;
      }

      return null;
    },
    [maxSize]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      setIsUploading(true);
      try {
        const result = await ipfsService.uploadFile(file);
        onChange(result.gatewayUrl);
        toast.success('Image uploaded successfully!');
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, onChange]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleUrlSubmit = useCallback(() => {
    const url = urlInputValue.trim();
    if (url) {
      onChange(url);
      setUrlInputValue('');
      setShowUrlInput(false);
      toast.success('Image URL added!');
    }
  }, [urlInputValue, onChange]);

  const hasImage = value && value.trim().length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {hasImage ? (
        // Image preview with remove option
        <div className={`relative group rounded-lg border border-border overflow-hidden bg-muted ${compact ? 'aspect-square' : 'aspect-video'}`}>
          <img
            src={value}
            alt="Cover image"
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, show placeholder
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Failed to load image</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={handleRemoveImage}
              disabled={disabled || isUploading}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Upload area
        <div
          className={`
            relative rounded-lg border-2 border-dashed transition-colors
            ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={`flex flex-col items-center justify-center text-center ${compact ? 'p-4' : 'p-8'}`}>
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Uploading image to IPFS...</p>
              </>
            ) : (
              <>
                <Upload className={`text-muted-foreground mb-4 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`} />
                {!compact && <p className="text-sm font-medium mb-2">Drop image here or click to browse</p>}
                <p className={`text-muted-foreground mb-4 ${compact ? 'text-xs' : 'text-xs'}`}>
                  {compact ? `Upload image (max ${maxSize}MB)` : `Supports JPG, PNG, GIF, WebP up to ${maxSize}MB`}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={disabled || isUploading}
                    onClick={() => document.getElementById(id)?.click()}
                    className="rounded-lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                  
                </div>
              </>
            )}
          </div>
          
          <input
            id={id}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* URL input option */}
      {showUrlInput && !hasImage && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            disabled={disabled || isUploading}
            className="rounded-lg"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={disabled || isUploading || !urlInputValue.trim()}
            className="rounded-lg whitespace-nowrap"
          >
            Add URL
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setShowUrlInput(false);
              setUrlInputValue('');
            }}
            disabled={disabled || isUploading}
            className="rounded-lg"
          >
            Cancel
          </Button>
        </div>
      )}

      {hasImage && (
        <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted p-2 rounded">
          <span>Image uploaded to IPFS:</span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline max-w-xs truncate"
          >
            View Image
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;