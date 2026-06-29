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

// Detects HEIC/HEIF by extension, MIME type, and magic bytes.
// iOS often saves HEIC files with a .jpg extension, so magic bytes are the reliable check.
async function detectHeic(file: File): Promise<boolean> {
  const name = file.name.toLowerCase();
  if (
    name.endsWith('.heic') || name.endsWith('.heif') ||
    file.type === 'image/heic' || file.type === 'image/heif'
  ) {
    return true;
  }

  // Read first 16 bytes to check for ISOBMFF 'ftyp' box (HEIC container)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      if (
        arr.length >= 12 &&
        arr[4] === 0x66 && arr[5] === 0x74 && arr[6] === 0x79 && arr[7] === 0x70
      ) {
        const brand = String.fromCharCode(arr[8], arr[9], arr[10], arr[11]);
        const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];
        resolve(heicBrands.some(b => brand.startsWith(b)));
      } else {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

async function convertHeicToBlob(file: File): Promise<Blob> {
  try {
    const heic2anyModule = await import('heic2any');
    const converter = heic2anyModule.default as typeof heic2any;
    const result = await converter({
      blob: file,
      toType: 'image/jpeg',
      quality: WHATSAPP_HD_SETTINGS.quality,
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (err) {
    const msg = err instanceof Error
      ? err.message
      : (typeof err === 'object' ? JSON.stringify(err) : String(err));
    throw new Error(`HEIC conversion failed: ${msg || 'unknown error'}`);
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

  if (typeof window !== 'undefined') {
    const isHeic = await detectHeic(file);
    if (isHeic) {
      // Throw if conversion fails — browsers cannot render HEIC on canvas
      const convertedBlob = await convertHeicToBlob(file);
      const baseName = file.name.replace(/\.(heic|heif)$/i, '') || file.name;
      sourceFile = new File([convertedBlob], `${baseName}.jpg`, { type: 'image/jpeg' });
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
            const compressedFile = new File(
              [blob],
              `${originalName}_compressed.${extension}`,
              { type: format, lastModified: Date.now() }
            );

            resolve(compressedFile);
          },
          format,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
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
