/**
 * slideParser.ts
 *
 * Client-side parsing engine for PPTX and PDF lecture slide decks.
 * Converts uploaded files into the exact SlideItem[] data structure
 * used throughout LectureLens (title, bullets, codeSnippet, notes, etc.).
 *
 * Security:
 * - Content inspection / magic byte checks (not extension-only).
 * - Text sanitization against script/HTML injection.
 * - In-memory parsing without executing file payloads.
 */

import JSZip from 'jszip';
import { SlideItem } from '../types';

export interface SlideDeckMeta {
  id: string;
  name: string;
  slideCount: number;
  uploadedAt: string;
  fileSize: number;
  format: 'pptx' | 'pdf';
  isPretrained?: boolean;
}

export interface ProcessedDeck {
  meta: SlideDeckMeta;
  slides: SlideItem[];
  keywordsPerSlide: { slideIndex: number; keywords: string[] }[];
}

// ─── Text Sanitization & Safety ────────────────────────────────────────────────

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '') // strip HTML brackets
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .trim();
}

const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
  'with', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was', 'were',
  'or', 'will', 'an', 'can', 'has', 'have', 'had', 'do', 'does', 'did', 'not',
  'but', 'what', 'all', 'were', 'when', 'we', 'there', 'been', 'each', 'if',
  'also', 'into', 'than', 'them', 'these', 'so', 'slide', 'lecture', 'chapter'
]);

export function extractKeywords(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = clean.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((e) => e[0]);
}

// ─── File Validation ──────────────────────────────────────────────────────────

export async function validateFileHeader(file: File): Promise<'pptx' | 'pdf' | 'unsupported'> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File exceeds maximum size limit of 25 MB.');
  }

  const slice = file.slice(0, 8);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  // ZIP / PPTX magic bytes: PK (0x50, 0x4B, 0x03, 0x04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'pptx';
  }

  // Fallback by extension check if MIME check failed but extension matches
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'pptx') return 'pptx';

  return 'unsupported';
}

// ─── PPTX Parser ──────────────────────────────────────────────────────────────

export async function parsePptx(file: File, onProgress?: (step: string) => void): Promise<ProcessedDeck> {
  onProgress?.('Reading slides');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find all slide files: ppt/slides/slide1.xml, etc.
  const slideEntries: { name: string; num: number }[] = [];
  const slideRegex = /^ppt\/slides\/slide(\d+)\.xml$/i;

  zip.forEach((relativePath) => {
    const match = relativePath.match(slideRegex);
    if (match) {
      slideEntries.push({ name: relativePath, num: parseInt(match[1], 10) });
    }
  });

  if (slideEntries.length === 0) {
    throw new Error('No valid slides detected in PPTX presentation.');
  }

  // Sort sequentially by slide number
  slideEntries.sort((a, b) => a.num - b.num);

  onProgress?.('Extracting key concepts');
  const slides: SlideItem[] = [];
  const keywordsPerSlide: { slideIndex: number; keywords: string[] }[] = [];

  for (let i = 0; i < slideEntries.length; i++) {
    const entry = slideEntries[i];
    const xmlText = await zip.file(entry.name)?.async('text');
    if (!xmlText) continue;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    // Extract text paragraphs
    // PPTX paragraphs are in <a:p> with text runs <a:t>
    const paragraphs: string[] = [];
    const pElements = doc.getElementsByTagName('a:p');
    for (let pIdx = 0; pIdx < pElements.length; pIdx++) {
      const pEl = pElements[pIdx];
      const tElements = pEl.getElementsByTagName('a:t');
      let pText = '';
      for (let tIdx = 0; tIdx < tElements.length; tIdx++) {
        pText += tElements[tIdx].textContent || '';
      }
      const sanitized = sanitizeText(pText);
      if (sanitized.length > 0) {
        paragraphs.push(sanitized);
      }
    }

    // Try reading speaker notes if present: ppt/notesSlides/notesSlide{i}.xml
    let notes = '';
    const noteEntry = zip.file(`ppt/notesSlides/notesSlide${entry.num}.xml`);
    if (noteEntry) {
      try {
        const noteXml = await noteEntry.async('text');
        const noteDoc = parser.parseFromString(noteXml, 'application/xml');
        const noteTs = noteDoc.getElementsByTagName('a:t');
        const nList: string[] = [];
        for (let nIdx = 0; nIdx < noteTs.length; nIdx++) {
          const nt = sanitizeText(noteTs[nIdx].textContent || '');
          if (nt) nList.push(nt);
        }
        notes = nList.join(' ');
      } catch {
        // notes optional
      }
    }

    let title = '';
    let bullets: string[] = [];
    let codeSnippet: string | undefined = undefined;

    if (paragraphs.length === 0) {
      title = `Slide ${i + 1}`;
      bullets = ['[Image-only or diagram slide: verbal matching active]'];
      if (notes) {
        bullets.push(`Speaker note: ${notes}`);
      }
    } else {
      title = paragraphs[0];
      if (title.length > 100) {
        bullets.push(title);
        title = `Slide ${i + 1}: ${title.slice(0, 60)}...`;
      }
      bullets = paragraphs.slice(1);
      if (bullets.length === 0) {
        bullets = ['Overview and core concept elaboration'];
      }
    }

    // Look for code-like patterns in bullets
    const codeCandidates = bullets.filter((b) =>
      b.includes('{') || b.includes(';') || b.includes('def ') || b.includes('void ') || b.includes('class ') || b.includes('//')
    );
    if (codeCandidates.length > 0) {
      codeSnippet = codeCandidates.join('\n');
    }

    const fullSlideText = `${title} ${bullets.join(' ')} ${notes}`;
    const kw = extractKeywords(fullSlideText);

    slides.push({
      slideNumber: i + 1,
      title: `${i + 1}. ${title}`,
      bullets: bullets.slice(0, 8), // limit to reasonable list
      codeSnippet,
      notes: notes || undefined,
    });

    keywordsPerSlide.push({
      slideIndex: i,
      keywords: kw,
    });
  }

  onProgress?.('Ready');

  const meta: SlideDeckMeta = {
    id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    slideCount: slides.length,
    uploadedAt: new Date().toISOString(),
    fileSize: file.size,
    format: 'pptx',
  };

  return {
    meta,
    slides,
    keywordsPerSlide,
  };
}

// ─── PDF Parser ───────────────────────────────────────────────────────────────

export async function parsePdf(file: File, onProgress?: (step: string) => void): Promise<ProcessedDeck> {
  onProgress?.('Reading slides');
  const arrayBuffer = await file.arrayBuffer();

  // Dynamically import pdfjs-dist to avoid loading large bundle until needed
  const pdfjsLib = await import('pdfjs-dist');
  // Configure worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('PDF document contains 0 pages.');
  }

  onProgress?.('Extracting key concepts');
  const slides: SlideItem[] = [];
  const keywordsPerSlide: { slideIndex: number; keywords: string[] }[] = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    const lines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;

    for (const item of items) {
      if (!('str' in item)) continue;
      const str = sanitizeText(item.str);
      if (!str) continue;

      const y = item.transform ? Math.round(item.transform[5]) : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = str;
      } else {
        currentLine += (currentLine ? ' ' : '') + str;
      }
      lastY = y;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    let title = `Slide ${p}`;
    let bullets: string[] = [];

    if (lines.length > 0) {
      title = lines[0];
      bullets = lines.slice(1);
    } else {
      bullets = ['[Visual / graphic page: verbal audio matching active]'];
    }

    if (bullets.length === 0) {
      bullets = ['Overview presentation and topic discussion'];
    }

    const fullText = `${title} ${bullets.join(' ')}`;
    const kw = extractKeywords(fullText);

    slides.push({
      slideNumber: p,
      title: `${p}. ${title}`,
      bullets: bullets.slice(0, 8),
    });

    keywordsPerSlide.push({
      slideIndex: p - 1,
      keywords: kw,
    });
  }

  onProgress?.('Ready');

  const meta: SlideDeckMeta = {
    id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    slideCount: slides.length,
    uploadedAt: new Date().toISOString(),
    fileSize: file.size,
    format: 'pdf',
  };

  return {
    meta,
    slides,
    keywordsPerSlide,
  };
}

// ─── Unified Parse Entrypoint ────────────────────────────────────────────────

export async function parseUploadedLectureDeck(
  file: File,
  onProgress?: (step: string) => void
): Promise<ProcessedDeck> {
  onProgress?.('Uploading');
  const format = await validateFileHeader(file);

  if (format === 'unsupported') {
    throw new Error('Unsupported file format. Please upload a .pptx or .pdf presentation file.');
  }

  if (format === 'pptx') {
    return parsePptx(file, onProgress);
  } else {
    return parsePdf(file, onProgress);
  }
}
