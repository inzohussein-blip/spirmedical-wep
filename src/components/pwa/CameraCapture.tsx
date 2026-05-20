'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Camera, X, RotateCcw, Check, Image as ImageIcon,
  Loader2, Upload, ZoomIn, ZoomOut,
} from 'lucide-react';
import { compressImage, formatFileSize, isValidImage } from '@/lib/image-utils';
import { haptic } from '@/lib/haptic';
import { toast } from '@/components/ui/Toaster';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📷 Camera Capture (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * Component لالتقاط/اختيار صورة مع:
 *   ✓ Camera access مباشر
 *   ✓ Gallery picker
 *   ✓ Preview قبل الرفع
 *   ✓ ضغط تلقائي
 *   ✓ Multi-file support
 *
 * Usage:
 *   <CameraCapture
 *     onCapture={(files) => upload(files)}
 *     maxFiles={3}
 *     mode="both"  // 'camera' | 'gallery' | 'both'
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

interface CapturedFile {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

interface Props {
  onCapture: (files: File[]) => void | Promise<void>;
  /** الحد الأقصى للملفات */
  maxFiles?: number;
  /** الحد الأقصى لحجم الملف (MB) */
  maxSizeMB?: number;
  /** المصدر */
  mode?: 'camera' | 'gallery' | 'both';
  /** اسم الزر */
  label?: string;
  /** disable */
  disabled?: boolean;
}

export default function CameraCapture({
  onCapture,
  maxFiles = 3,
  maxSizeMB = 10,
  mode = 'both',
  label = 'إضافة صورة',
  disabled = false,
}: Props) {
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    haptic.light();
    setShowOptions(false);
    setIsProcessing(true);

    const newFiles: CapturedFile[] = [];

    for (const file of Array.from(selectedFiles)) {
      // Validate
      if (!isValidImage(file)) {
        toast.error(`${file.name}: نوع غير مدعوم`);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name}: حجمها أكبر من ${maxSizeMB}MB`);
        continue;
      }

      if (files.length + newFiles.length >= maxFiles) {
        toast.error(`الحد الأقصى ${maxFiles} صور`);
        break;
      }

      try {
        // Compress
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          mimeType: 'image/jpeg',
        });

        // Create preview
        const preview = URL.createObjectURL(compressed);

        newFiles.push({
          file: compressed,
          preview,
          originalSize: file.size,
          compressedSize: compressed.size,
        });
      } catch (e) {
        console.error('Compress error:', e);
        toast.error(`فشل معالجة ${file.name}`);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(false);

    if (newFiles.length > 0) {
      haptic.success();
      toast.success(`تمت إضافة ${newFiles.length} صورة ✓`);
    }
  }, [files.length, maxFiles, maxSizeMB]);

  const handleRemove = useCallback((index: number) => {
    haptic.light();
    setFiles((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) return;
    haptic.medium();
    setIsProcessing(true);
    try {
      await Promise.resolve(onCapture(files.map((f) => f.file)));
      // cleanup
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setIsProcessing(false);
    }
  }, [files, onCapture]);

  const totalSaved = files.reduce((sum, f) => sum + (f.originalSize - f.compressedSize), 0);

  return (
    <div>
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
        multiple={maxFiles > 1}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
        multiple={maxFiles > 1}
      />

      {/* Files preview grid */}
      {files.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 10,
                overflow: 'hidden',
                background: 'var(--paper-3)',
              }}
            >
              <img
                src={f.preview}
                alt={`صورة ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label="حذف"
                style={{
                  position: 'absolute',
                  top: 4,
                  insetInlineEnd: 4,
                  width: 24,
                  height: 24,
                  background: 'rgba(0,0,0,0.7)',
                  color: 'var(--paper-3)',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  insetInline: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  color: 'var(--paper-3)',
                  padding: '8px 6px 4px',
                  fontSize: 9,
                  textAlign: 'center',
                  fontWeight: 700,
                }}
              >
                {formatFileSize(f.compressedSize)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {totalSaved > 0 && (
        <div
          style={{
            fontSize: 10,
            color: 'var(--emerald)',
            textAlign: 'center',
            marginBottom: 10,
            fontWeight: 700,
          }}
        >
          ✨ وفّرنا {formatFileSize(totalSaved)} عبر الضغط
        </div>
      )}

      {/* Add button OR Submit */}
      {files.length < maxFiles && (
        <button
          type="button"
          onClick={() => {
            haptic.light();
            if (mode === 'camera') {
              cameraInputRef.current?.click();
            } else if (mode === 'gallery') {
              galleryInputRef.current?.click();
            } else {
              setShowOptions(true);
            }
          }}
          disabled={disabled || isProcessing}
          style={{
            width: '100%',
            padding: 14,
            background: 'var(--white)',
            color: 'var(--emerald)',
            border: '2px dashed var(--emerald)',
            borderRadius: 12,
            cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جاري المعالجة...
            </>
          ) : (
            <>
              <Camera size={16} />
              {label} ({files.length}/{maxFiles})
            </>
          )}
        </button>
      )}

      {/* Submit button */}
      {files.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing}
          style={{
            width: '100%',
            marginTop: 8,
            padding: 14,
            background: 'var(--emerald)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 12,
            cursor: isProcessing ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Upload size={16} />
              رفع {files.length} {files.length === 1 ? 'صورة' : 'صور'}
            </>
          )}
        </button>
      )}

      {/* Options Modal (Camera/Gallery) */}
      {showOptions && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowOptions(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white)',
              width: '100%',
              maxWidth: 440,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              animation: 'optsSlide 0.3s ease',
            }}
          >
            <style>{`
              @keyframes optsSlide {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>
            <div
              style={{
                width: 40,
                height: 4,
                background: 'var(--paper-3)',
                borderRadius: 2,
                margin: '0 auto 16px',
              }}
            />

            <h3 style={{ fontSize: 15, fontWeight: 800, textAlign: 'center', margin: '0 0 14px' }}>
              اختر مصدر الصورة
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                style={optionBtn}
              >
                <Camera size={22} color="var(--emerald)" />
                <div style={{ flex: 1, textAlign: 'start' }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>الكاميرا</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>التقط صورة جديدة</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                style={optionBtn}
              >
                <ImageIcon size={22} color="var(--amber)" />
                <div style={{ flex: 1, textAlign: 'start' }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>الاستوديو</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>اختر من الصور</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowOptions(false)}
                style={{
                  padding: 12,
                  background: 'var(--paper-3)',
                  color: 'var(--ink-2)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const optionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  background: 'var(--white)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'start',
};
