// src/utils/pdfLoader.ts
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import PdfWorker from 'pdfjs-dist/build/pdf.worker.entry?worker';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export async function getPdfjs() {
  return pdfjsLib;
}
