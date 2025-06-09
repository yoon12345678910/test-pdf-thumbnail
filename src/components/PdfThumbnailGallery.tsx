// src/components/PdfThumbnailGallery.tsx
import React, { useEffect, useState, useRef } from 'react';
import { getPdfjs } from '../utils/pdfLoader';

interface Props {
  file: File;
  scale?: number;
  maxThumbWidth?: number;
  onPageRendered?: (ms: number, isTotal?: boolean) => void;
  onFirstVisible?: (ms: number) => void;
  parallel?: boolean;
}

// 최적의 동시 렌더링 수를 시스템에 맞게 자동 조정하거나 기본값으로 4 사용
const getOptimalConcurrency = () => {
  const cores = navigator.hardwareConcurrency || 4;
  return Math.max(2, Math.min(cores - 1, 6)); // 2~6 사이로 제한
};

const CONCURRENCY_LIMIT = getOptimalConcurrency();

export default function PdfThumbnailGallery({
  file,
  scale = 0.2, // 해상도 더 낮춤
  maxThumbWidth = 80,
  onPageRendered,
  onFirstVisible,
  parallel = true,
}: Props) {
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  const renderedCountRef = useRef(0);
  const startAllRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const revokeObjectUrls = () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };

    const renderAllPages = async () => {
      revokeObjectUrls();
      startAllRef.current = performance.now();
      const pdfjsLib = await getPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const worker = new pdfjsLib.PDFWorker({ name: 'pdf-worker' });
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        worker,
      }).promise;

      const pageCount = pdf.numPages;
      const results: (string | null)[] = Array(pageCount).fill(null);
      setThumbnails(results);

      const renderPage = async (i: number) => {
        try {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) return;

          ctx.imageSmoothingEnabled = false;

          const start = performance.now();
          await page.render({ canvasContext: ctx, viewport }).promise;

          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => b && resolve(b), 'image/webp', 0.2) // 품질 더 낮춤
          );

          canvas.width = 0;
          canvas.height = 0;
          canvas.remove();

          const url = URL.createObjectURL(blob);
          objectUrlsRef.current[i] = url;

          const end = performance.now();

          if (i === 0) {
            const firstVisible = performance.now();
            onFirstVisible?.(firstVisible - startAllRef.current);
          }

          onPageRendered?.(end - start, false);

          if (!cancelled) {
            setThumbnails((prev) => {
              const updated = [...prev];
              updated[i] = url;
              return updated;
            });
          }

          renderedCountRef.current++;
          if (renderedCountRef.current === pageCount) {
            const endAll = performance.now();
            onPageRendered?.(endAll - startAllRef.current, true);
          }
        } catch (e) {
          console.error(`페이지 ${i + 1} 렌더링 실패`, e);
        }
      };

      if (parallel) {
        const queue: Promise<any>[] = [];
        for (let i = 0; i < pageCount; i++) {
          const task = renderPage(i);
          queue.push(task);
          if (queue.length >= CONCURRENCY_LIMIT) {
            await Promise.race(queue);
            queue.splice(0, 1);
          }
        }
        await Promise.allSettled(queue);
      } else {
        for (let i = 0; i < pageCount; i++) {
          await renderPage(i);
        }
      }

      await worker.destroy();
    };

    renderAllPages();

    return () => {
      cancelled = true;
      revokeObjectUrls();
    };
  }, [file, scale, parallel]);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '12px',
      }}
    >
      {thumbnails.map((src, index) => (
        <div
          key={index}
          style={{
            width: `${maxThumbWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: `${Math.round(maxThumbWidth * 1.4)}px`,
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {src ? (
              <img
                src={src}
                alt={`page-${index + 1}`}
                loading="lazy"
                decoding="async"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: '12px',
                  color: '#bbb',
                }}
              >
                Loading Page {index + 1}...
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
            Page {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
} // End PdfThumbnailGallery
