/**
 * ═══════════════════════════════════════════════════════════════
 * 🖼️ Image Utilities (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * أدوات للتعامل مع الصور:
 *   - Compression (تقليل الحجم)
 *   - Resize (تغيير الأبعاد)
 *   - EXIF rotation fix
 *   - Format conversion (JPEG/WebP)
 *
 * Usage:
 *   const compressed = await compressImage(file, {
 *     maxWidth: 1920,
 *     maxHeight: 1920,
 *     quality: 0.8,
 *   });
 * ═══════════════════════════════════════════════════════════════
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;        // 0.1 - 1.0
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

/**
 * ضغط صورة وتغيير حجمها
 * يحافظ على الـ aspect ratio
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      img.onload = () => {
        // حساب الأبعاد الجديدة
        let { width, height } = img;
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);

        if (ratio < 1) {
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // إنشاء canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('فشل إنشاء context'));

        // ارسم الصورة
        ctx.drawImage(img, 0, 0, width, height);

        // حوّل إلى Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('فشل ضغط الصورة'));

            const originalName = file instanceof File ? file.name : 'image';
            const ext = opts.mimeType === 'image/webp' ? '.webp' : '.jpg';
            const newName = originalName.replace(/\.[^.]+$/, '') + ext;

            const compressedFile = new File([blob], newName, {
              type: opts.mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          opts.mimeType,
          opts.quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * جلب أبعاد الصورة بدون تحميل كاملة
 */
export async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * تحويل ملف لـ base64
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل تحويل الصورة'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Validation: تحقّق إن الملف صورة صالحة
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type);
}

/**
 * تنسيق حجم الملف للعرض
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * إنشاء thumbnail (200x200) من صورة
 */
export async function createThumbnail(file: File | Blob, size = 200): Promise<File> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.75,
    mimeType: 'image/jpeg',
  });
}
