// src/components/PerformanceTest.tsx
import React, { useEffect, useRef, useState } from 'react';
import PdfThumbnailGallery, { type Props } from './PdfThumbnailGallery';

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

function getMemoryUsage() {
  if (performance.memory) {
    const mem = performance.memory;
    return {
      usedMB: +(mem.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: +(mem.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: +(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
    };
  }
  return null;
}

export default function PerformanceTest(props: Props) {
  const {file, parallel = true, scale = 0.2 } = props;

  const [fps, setFps] = useState(0);
  const [renderTimes, setRenderTimes] = useState<number[]>([]);
  const [totalRenderTime, setTotalRenderTime] = useState<number | null>(null);
  const [firstVisibleTime, setFirstVisibleTime] = useState<number | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<string>('');
  const [memoryColor, setMemoryColor] = useState<string>('gray');
  const [memoryDelta, setMemoryDelta] = useState<number | null>(null);

  const initialMemoryRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const lastRef = useRef(performance.now());

  useEffect(() => {
    setRenderTimes([]);
    setTotalRenderTime(null);
    setFirstVisibleTime(null);
    const mem = getMemoryUsage();
    if (mem) initialMemoryRef.current = mem.usedMB;
  }, [file]);

  useEffect(() => {
    const update = (time: number) => {
      const delta = time - lastRef.current;
      if (delta >= 1000) {
        setFps(frameRef.current);
        frameRef.current = 0;
        lastRef.current = time;
        const mem = getMemoryUsage();
        if (mem) {
          setMemoryUsage(`${mem.usedMB} MB`);

          if (mem.usedMB < 150) setMemoryColor('green');
          else if (mem.usedMB < 300) setMemoryColor('orange');
          else setMemoryColor('red');

          if (initialMemoryRef.current !== null) {
            setMemoryDelta(+(mem.usedMB - initialMemoryRef.current).toFixed(2));
          }
        }
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
        <strong>평균 페이지 렌더링:</strong>{' '}
        {renderTimes.length
          ? `${(
              renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
            ).toFixed(2)}ms`
          : '측정 중...'}
        <br />
        <strong>첫 썸네일 표시 시간:</strong>{' '}
        {firstVisibleTime ? `${firstVisibleTime.toFixed(2)}ms` : '측정 중...'}
        <br />
        <strong>총 렌더링 시간:</strong>{' '}
        {totalRenderTime ? `${totalRenderTime.toFixed(2)}ms` : '측정 중...'}
        <br />
        <strong>JS Heap 사용량:</strong>{' '}
        <span style={{ color: memoryColor }}>{memoryUsage || '측정 중...'}</span>
        <br />
        {memoryDelta !== null && (
          <span style={{ fontSize: '13px' }}>
            (변화량: {memoryDelta > 0 ? '+' : ''}{memoryDelta} MB)
          </span>
        )}
      </div>
      <PdfThumbnailGallery
        file={file}
        parallel={parallel}
        scale={scale}
        onPageRendered={(ms, isTotal) => {
          if (isTotal) {
            setTotalRenderTime(ms);
          } else {
            setRenderTimes((prev) => [...prev.slice(-30), ms]);
          }
        }}
        onFirstVisible={(ms) => {
          setFirstVisibleTime(ms);
        }}
      />
    </div>
  );
}
