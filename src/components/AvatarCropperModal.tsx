import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, Crop, AlertCircle, Loader2 } from 'lucide-react';

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  isOpen,
  imageSrc,
  fileName,
  onClose,
  onCropComplete
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [exportError, setExportError] = useState<string | null>(null);

  // Safe image handling to prevent canvas tainting (SecurityError on toDataURL)
  const [safeImageSrc, setSafeImageSrc] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  const createdObjectUrlRef = useRef<string | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport crop diameter in pixels
  const CROP_SIZE = 220;

  // Resolve and sanitize imageSrc into a local, untainted memory representation
  useEffect(() => {
    let isMounted = true;

    // Revoke previous blob URL if created
    if (createdObjectUrlRef.current) {
      URL.revokeObjectURL(createdObjectUrlRef.current);
      createdObjectUrlRef.current = null;
    }

    if (!isOpen || !imageSrc) {
      setSafeImageSrc(null);
      setIsLoadingImage(false);
      return;
    }

    // Reset crop state
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setImageLoaded(false);
    setExportError(null);

    // If it's already a raster Base64 data URL, it's strictly local memory and cannot taint canvas
    if (
      imageSrc.startsWith('data:image/jpeg') ||
      imageSrc.startsWith('data:image/png') ||
      imageSrc.startsWith('data:image/webp')
    ) {
      setSafeImageSrc(imageSrc);
      setIsLoadingImage(false);
      return;
    }

    // If it's already a local blob URL, it's safe
    if (imageSrc.startsWith('blob:')) {
      setSafeImageSrc(imageSrc);
      setIsLoadingImage(false);
      return;
    }

    // Remote HTTP/HTTPS or external URL: Fetch and convert to local data URL to completely prevent tainted canvas
    setIsLoadingImage(true);

    const resolveToSafeDataUrl = async () => {
      try {
        let blob: Blob | null = null;

        // 1. Attempt direct CORS fetch first with cache buster
        try {
          const bustUrl = imageSrc + (imageSrc.includes('?') ? '&' : '?') + 'reflect_cors=' + Date.now();
          const directRes = await fetch(bustUrl, {
            mode: 'cors',
            credentials: 'omit'
          });
          if (directRes.ok) {
            blob = await directRes.blob();
          }
        } catch {
          // Direct fetch failed (likely CORS restriction on remote server)
        }

        // 2. If direct fetch didn't succeed and it's an HTTP/HTTPS URL, try our secure server image proxy
        if (!blob && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
          try {
            const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageSrc)}`);
            if (proxyRes.ok) {
              blob = await proxyRes.blob();
            }
          } catch (proxyErr) {
            console.warn('Proxy image fetch failed:', proxyErr);
          }
        }

        if (!isMounted) return;

        if (blob) {
          // Convert to Base64 Data URL so drawing onto canvas is 100% immune to canvas tainting
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted) {
              setSafeImageSrc(reader.result as string);
              setIsLoadingImage(false);
            }
          };
          reader.onerror = () => {
            if (isMounted) {
              const objUrl = URL.createObjectURL(blob!);
              createdObjectUrlRef.current = objUrl;
              setSafeImageSrc(objUrl);
              setIsLoadingImage(false);
            }
          };
          reader.readAsDataURL(blob);
        } else {
          // Fallback to original imageSrc
          setSafeImageSrc(imageSrc);
          setIsLoadingImage(false);
        }
      } catch (err) {
        console.error('Failed to prepare safe image for cropper:', err);
        if (isMounted) {
          setSafeImageSrc(imageSrc);
          setIsLoadingImage(false);
        }
      }
    };

    resolveToSafeDataUrl();

    return () => {
      isMounted = false;
      if (createdObjectUrlRef.current) {
        URL.revokeObjectURL(createdObjectUrlRef.current);
        createdObjectUrlRef.current = null;
      }
    };
  }, [isOpen, imageSrc]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
    setOffset({ x: 0, y: 0 });
    setZoom(1.0);
  };

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Perform High-Quality Crop & Compression with Tainted Canvas Resilience
  const handleApplyCrop = useCallback(async () => {
    if (!imageRef.current || !imageLoaded) return;
    setExportError(null);

    try {
      const img = imageRef.current;
      const OUTPUT_SIZE = 256; // 256x256 retina avatar
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Base scaling factor between natural image dimensions and display box (CROP_SIZE)
      const isRotatedSideways = rotation === 90 || rotation === 270;
      const effectiveImgWidth = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
      const effectiveImgHeight = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

      // Fit the image naturally into the crop container
      const baseScale = Math.max(CROP_SIZE / effectiveImgWidth, CROP_SIZE / effectiveImgHeight);
      const totalDisplayScale = baseScale * zoom;

      // Center the canvas drawing transform
      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

      // Apply offset scaled to output canvas resolution
      const scaleMultiplier = OUTPUT_SIZE / CROP_SIZE;
      ctx.translate(offset.x * scaleMultiplier, offset.y * scaleMultiplier);

      // Rotate around center
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw image scaled
      const drawWidth = img.naturalWidth * totalDisplayScale * scaleMultiplier;
      const drawHeight = img.naturalHeight * totalDisplayScale * scaleMultiplier;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Compress to high-grade JPEG (0.88 quality yields ~20-30KB, well under 1MB with zero perceptual loss)
      let compressedDataUrl: string;
      try {
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      } catch (toDataUrlErr) {
        console.warn('Direct canvas.toDataURL failed, attempting toBlob export fallback:', toDataUrlErr);
        // Fallback: Use canvas.toBlob in case toDataURL encounters engine-specific restrictions
        compressedDataUrl = await new Promise<string>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas export produced null output'));
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.88);
        });
      }

      onCropComplete(compressedDataUrl);
      onClose();
    } catch (err: any) {
      console.error('Cropping failure:', err);
      setExportError('Unable to process this image. You can also upload a photo file from your device.');
    }
  }, [imageLoaded, zoom, rotation, offset, onClose, onCropComplete]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card-elevated)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)'
              }}
            >
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight font-serif">
                Crop & Position Avatar
              </h3>
              <p className="text-[11px] truncate max-w-[220px]" style={{ color: 'var(--text-muted)' }}>
                {fileName || 'Adjust your photo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="avatar-crop-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Cancel cropping"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Interactive Cropping Stage */}
        <div className="p-5 flex flex-col items-center space-y-4">
          {exportError && (
            <div className="w-full p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {exportError}
            </div>
          )}

          {/* Interactive Crop Stage Container */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            style={{
              width: CROP_SIZE + 40,
              height: CROP_SIZE + 40,
              backgroundColor: '#0A0E17',
              touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Loading Overlay */}
            {isLoadingImage && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 text-white gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-[var(--accent)]" />
                <span className="text-xs font-medium tracking-wide">Preparing photo...</span>
              </div>
            )}

            {/* The Image being transformed */}
            {safeImageSrc ? (
              <img
                ref={imageRef}
                src={safeImageSrc}
                alt="Crop source"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onLoad={handleImageLoad}
                draggable={false}
                className="max-w-none transition-transform duration-75 pointer-events-none"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxHeight: imageLoaded ? `${CROP_SIZE * 1.5}px` : 'auto',
                  maxWidth: imageLoaded ? `${CROP_SIZE * 1.5}px` : 'auto',
                  opacity: imageLoaded ? 1 : 0
                }}
              />
            ) : null}

            {/* Circular Crop Mask Overlay with Darkened Outer Ring */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={CROP_SIZE + 40}
              height={CROP_SIZE + 40}
              viewBox={`0 0 ${CROP_SIZE + 40} ${CROP_SIZE + 40}`}
            >
              <defs>
                <mask id="crop-circle-mask">
                  <rect width={CROP_SIZE + 40} height={CROP_SIZE + 40} fill="white" />
                  <circle
                    cx={(CROP_SIZE + 40) / 2}
                    cy={(CROP_SIZE + 40) / 2}
                    r={CROP_SIZE / 2}
                    fill="black"
                  />
                </mask>
              </defs>
              {/* Darkened area outside the crop circle */}
              <rect
                width={CROP_SIZE + 40}
                height={CROP_SIZE + 40}
                fill="rgba(0, 0, 0, 0.65)"
                mask="url(#crop-circle-mask)"
              />
              {/* Clean glowing circle guide border */}
              <circle
                cx={(CROP_SIZE + 40) / 2}
                cy={(CROP_SIZE + 40) / 2}
                r={CROP_SIZE / 2}
                fill="none"
                stroke="var(--accent, #14B8A6)"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.9"
              />
            </svg>

            {/* Subtle Pan Hint overlay */}
            <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-white/80 font-sans tracking-wide">
                Drag photo to position
              </span>
            </div>
          </div>

          {/* Controls: Zoom & Rotate */}
          <div className="w-full space-y-3 pt-1">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1.0, +(z - 0.1).toFixed(2)))}
                className="p-1.5 rounded-lg border transition hover:opacity-100 opacity-75 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  style={{ backgroundColor: 'var(--border-color)' }}
                  aria-label="Zoom photo"
                />
                <span className="text-[10px] font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.1).toFixed(2)))}
                className="p-1.5 rounded-lg border transition hover:opacity-100 opacity-75 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Secondary Tools: Rotate & Reset */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 opacity-80 hover:opacity-100 transition cursor-pointer text-xs"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Rotate 90°
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 opacity-80 hover:opacity-100 transition cursor-pointer text-xs"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>

              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Auto-compressed &lt;50KB
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card-elevated)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            id="avatar-crop-apply-btn"
            onClick={handleApplyCrop}
            disabled={isLoadingImage || !imageLoaded}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#FFFFFF'
            }}
          >
            <Check className="w-3.5 h-3.5" />
            Set as Avatar
          </button>
        </div>
      </div>
    </div>
  );
};
