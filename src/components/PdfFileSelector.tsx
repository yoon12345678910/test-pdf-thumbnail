// src/components/PdfFileSelector.tsx
import React from 'react';

export default function PdfFileSelector({
  onSelect,
}: {
  onSelect: (file: File | null) => void;
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onSelect(file);
        }}
      />
    </div>
  );
}
