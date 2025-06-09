import React, { useEffect, useRef, useState } from 'react';
import PdfThumbnailGallery from './PdfThumbnailGallery';

export default function PerformanceTest({ file, url }: { file?: File; url?: string }) {
  const [fps, setFps] = useState(0);
  const [renderTimes, setRenderTimes] = useState<number[]>([]);
  const frameRef = useRef(0);
  const lastRef = useRef(performance.now());

  useEffect(() => {
    const update = (time: number) => {
      const delta = time - lastRef.current;
      if (delta >= 1000) {
        setFps(frameRef.current);
        frameRef.current = 0;
        lastRef.current = time;
      } else {
        frameRef.current++;
      }
      requestAnimationFrame(update);
    };
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📈 PDF 렌더링 성능 테스트</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>FPS:</strong> {fps} fps <br />
        <strong>평균 썸네일 렌더링 시간:</strong>{' '}
        {renderTimes.length
          ? `${(
              renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
            ).toFixed(2)}ms`
          : '측정 중...'}
      </div>
      <PdfThumbnailGallery
        file={file}
        url={url}
        onPageRendered={(ms) =>
          setRenderTimes((prev) => [...prev.slice(-30), ms])
        }
      />
    </div>
  );
}
