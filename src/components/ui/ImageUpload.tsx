import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

interface ImageUploadProps {
  value?: string;
  onChange: (relativePath: string | undefined) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
}

export function ImageUpload({ value, onChange, label, placeholder, compact = false }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [imageError, setImageError] = useState(false);

  const handleSelectImage = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'Image',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        // Copy the image to the app's assets folder
        const relativePath = await invoke<string>('copy_image_to_assets', {
          sourcePath: selected,
        });

        // Get the data URL for preview
        const dataUrl = await invoke<string>('read_image_as_data_url', {
          relativePath,
        });

        onChange(relativePath);
        setPreviewUrl(dataUrl);
        setImageError(false);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setImageError(true);
    }
  };

  const handleRemoveImage = () => {
    onChange(undefined);
    setPreviewUrl(undefined);
    setImageError(false);
  };

  // Update preview when value changes externally
  useEffect(() => {
    const updatePreview = async () => {
      if (value) {
        try {
          const dataUrl = await invoke<string>('read_image_as_data_url', {
            relativePath: value,
          });
          setPreviewUrl(dataUrl);
          setImageError(false);
        } catch (error) {
          console.error('Error loading image preview:', error);
          setImageError(true);
        }
      } else {
        setPreviewUrl(undefined);
        setImageError(false);
      }
    };

    updatePreview();
  }, [value]);

  // Compact mode - just a toggle button
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {previewUrl && !imageError ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-16 h-16 object-cover rounded border border-border"
              onError={() => {
                console.error('Failed to load image:', previewUrl);
                setImageError(true);
              }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs px-2 py-1 rounded bg-accent-red text-white hover:bg-opacity-80"
              title="Remove image"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSelectImage}
            className="text-xs px-3 py-1 rounded border border-border hover:border-accent-blue hover:bg-bg-tertiary transition-colors flex items-center gap-1"
            title={placeholder || 'Add image'}
          >
            <ImageIcon size={14} />
            <span>Add Image</span>
          </button>
        )}
      </div>
    );
  }

  // Full mode - large drag-and-drop area
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      {previewUrl && !imageError ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-48 rounded-lg border border-border"
            onError={() => {
              console.error('Failed to load image:', previewUrl);
              setImageError(true);
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 rounded-full bg-accent-red text-white hover:bg-opacity-80 transition-opacity"
            title="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : imageError ? (
        <div className="p-4 border-2 border-dashed border-accent-red rounded-lg bg-accent-red/10">
          <p className="text-sm text-accent-red text-center mb-2">Failed to load image</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleSelectImage}
              className="text-xs px-3 py-1 rounded bg-accent-blue text-white hover:bg-opacity-80"
            >
              Select New Image
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs px-3 py-1 rounded bg-accent-red text-white hover:bg-opacity-80"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSelectImage}
          className="w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-accent-blue hover:bg-bg-tertiary transition-colors flex flex-col items-center gap-2 text-text-secondary"
        >
          <ImageIcon size={32} className="text-text-tertiary" />
          <span className="text-sm font-medium">
            {placeholder || 'Click to select image'}
          </span>
          <span className="text-xs text-text-tertiary">
            PNG, JPG, GIF, WebP, or SVG
          </span>
        </button>
      )}
    </div>
  );
}
