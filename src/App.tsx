import React, { useState } from 'react';
import PerformanceTest from './components/PerformanceTest';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');


  return (
    <div style={{ padding: '20px' }}>
      <h2>📄 PDF 썸네일 뷰어 (파일)</h2>

      <div style={{ marginBottom: 16 }}>
        <label>PDF 파일 선택: </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
              setUrl('');
            }
          }}
        />
      </div>
      <h3>무료 파일 다운로드 사이트</h3>
      <ul>
        <li>
          <a href="https://www.learningcontainer.com/sample-pdf-files-for-testing">https://www.learningcontainer.com/sample-pdf-files-for-testing</a>
        </li>
        <li>
          <a href="https://testfile.org/">https://testfile.org/</a>
        </li>
      </ul>

      {file && <PerformanceTest file={file} />}
    </div>
  );
}
