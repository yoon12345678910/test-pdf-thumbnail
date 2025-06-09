import React, { useState } from 'react';
import PdfThumbnailGallery from './components/PdfThumbnailGallery';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(0.2);
  const [parallel, setParallel] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2>PDF 썸네일 뷰어</h2>

      <div style={{ marginBottom: '12px' }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ marginRight: '8px' }}>
          썸네일 스케일: {scale.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={parallel}
            onChange={(e) => setParallel(e.target.checked)}
          />
          {' '}병렬 렌더링 활성화
        </label>
      </div>

      {file && (
        <PdfThumbnailGallery
          file={file}
          scale={scale}
          parallel={parallel}
        />
      )}
    </div>
  );
}
