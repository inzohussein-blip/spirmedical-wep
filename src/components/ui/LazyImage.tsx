'use client';

import { useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════
 * ⚡ Lazy Image (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * صورة بـ:
 *   ✓ Lazy loading (يحمّل فقط عند الظهور)
 *   ✓ Blur placeholder
 *   ✓ Fade-in animation
 *   ✓ Error fallback
 *   ✓ يستخدم IntersectionObserver
 *
 * Usage:
 *   <LazyImage src="/photo.jpg" alt="..." />
 * ═══════════════════════════════════════════════════════════════
 */

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  /** صورة احتياطية عند الفشل */
  fallback?: string;
  /** placeholder color */
  placeholderColor?: string;
  /** Aspect ratio (مثل "16/9") */
  aspectRatio?: string;
}

export default function LazyImage({
  src,
  alt,
  fallback,
  placeholderColor = 'var(--paper-3)',
  aspectRatio,
  style,
  ...props
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !imgRef.current) return;

    // IntersectionObserver للـ lazy load
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',  // ابدأ التحميل قبل 200px من الظهور
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const finalSrc = hasError && fallback ? fallback : src;
  const showImage = isInView && !hasError;

  return (
    <div
      ref={imgRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: placeholderColor,
        ...(aspectRatio ? { aspectRatio } : {}),
        ...style,
      }}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, ${placeholderColor} 0%, rgba(255,255,255,0.5) 50%, ${placeholderColor} 100%)`,
            backgroundSize: '200% 100%',
            animation: 'lazy-img-shimmer 1.5s infinite',
          }}
        />
      )}

      {/* Image */}
      {showImage && (
        <img
          {...props}
          src={finalSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            display: 'block',
          }}
        />
      )}

      {/* Error fallback */}
      {hasError && !fallback && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            opacity: 0.4,
          }}
        >
          🖼️
        </div>
      )}

      <style>{`
        @keyframes lazy-img-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
