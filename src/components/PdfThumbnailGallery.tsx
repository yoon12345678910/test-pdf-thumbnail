// src/components/PdfThumbnailGallery.tsx
import React, { useEffect, useState } from 'react';
import { getPdfjs } from '../utils/pdfLoader';

interface Props {
  file?: File;
  url?: string;
  scale?: number;
  maxThumbWidth?: number;
  onPageRendered?: (ms: number) => void;
}

export default function PdfThumbnailGallery({
  file,
  url,
  scale = 1.5,
  maxThumbWidth = 180,
  onPageRendered,
}: Props) {
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);

  useEffect(() => {
    const renderAllPages = async () => {
      const pdfjsLib = await getPdfjs();

      let data: Uint8Array | ArrayBuffer;
      if (file) {
        data = await file.arrayBuffer();
      } else if (url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('PDF URL 요청 실패');
        data = await res.arrayBuffer();
      } else {
        return;
      }

      const pdf = await pdfjsLib.getDocument({
        data
      }).promise;

      const pageCount = pdf.numPages;
      const results: (string | null)[] = Array(pageCount).fill(null);
      setThumbnails(results);

      for (let i = 0; i < pageCount; i++) {
        try {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          const start = performance.now();
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');
          const end = performance.now();

          onPageRendered?.(end - start);

          setThumbnails((prev) => {
            const updated = [...prev];
            updated[i] = dataUrl;
            return updated;
          });
        } catch (e) {
          console.error(`페이지 ${i + 1} 렌더링 실패`, e);
        }
      }
    };

    renderAllPages();
  }, [file, url, scale]);

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
      {thumbnails.map((src, index) =>
        src ? (
          <div
            key={index}
            style={{
              width: `${maxThumbWidth}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img
              src={src}
              alt={`page-${index + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            />
            <span style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
              Page {index + 1}
            </span>
          </div>
        ) : (
          <div
            key={index}
            style={{
              width: `${maxThumbWidth}px`,
              height: `${Math.round(maxThumbWidth * 1.4)}px`,
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#bbb',
              border: '1px dashed #ccc',
              borderRadius: '4px',
            }}
          >
            Loading Page {index + 1}...
          </div>
        )
      )}
    </div>
  );
}
