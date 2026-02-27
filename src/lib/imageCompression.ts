import type heic2any from 'heic2any';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export const WHATSAPP_HD_SETTINGS = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.8,
  format: 'image/jpeg' as const
};

async function convertHeicToBlob(file: File): Promise<Blob> {
  const heic2anyModule = await import('heic2any');
  try {
    const result = await (heic2anyModule.default as typeof heic2any)({
      blob: file,
      toType: 'image/jpeg',
      quality: WHATSAPP_HD_SETTINGS.quality
    });
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw error;
  }
}

export async function compressImage(
  file: File,
  options: CompressionOptions = WHATSAPP_HD_SETTINGS
): Promise<File> {
  const {
    maxWidth = WHATSAPP_HD_SETTINGS.maxWidth,
    maxHeight = WHATSAPP_HD_SETTINGS.maxHeight,
    quality = WHATSAPP_HD_SETTINGS.quality,
    format = WHATSAPP_HD_SETTINGS.format
  } = options;

  let sourceFile: File | Blob = file;

  if (typeof window !== 'undefined' && file.name.toLowerCase().endsWith('.heic')) {
    try {
      const convertedBlob = await convertHeicToBlob(file);
      sourceFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (error) {
      console.warn('HEIC conversion failed, using original:', error);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const originalName = file.name.replace(/\.[^/.]+$/, '');
            const extension = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
            const compressedFileName = `${originalName}_compressed.${extension}`;
            
            const compressedFile = new File([blob], compressedFileName, {
              type: format,
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          },
          format,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(sourceFile as File);
  });
}

export function calculateCompressionStats(original: File, compressed: File): {
  originalSize: string;
  compressedSize: string;
  savings: string;
  percentage: number;
} {
  const originalSize = original.size;
  const compressedSize = compressed.size;
  const savings = originalSize - compressedSize;
  const percentage = Math.round((savings / originalSize) * 100);
  
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return {
    originalSize: formatSize(originalSize),
    compressedSize: formatSize(compressedSize),
    savings: formatSize(savings),
    percentage
  };
}
