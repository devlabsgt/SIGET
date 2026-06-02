"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

interface ManualPdfMobileViewerProps {
  url: string;
}

function getTouchDistance(touches: React.TouchList | TouchList) {
  if (touches.length < 2) return 0;
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

export default function ManualPdfMobileViewer({ url }: ManualPdfMobileViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pinchStartDistance = useRef(0);
  const pinchStartScale = useRef(1);

  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [scale, setScale] = useState(1);

  const clampScale = (value: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      setPageWidth(containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [updateWidth]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStartDistance.current = getTouchDistance(e.touches);
      pinchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || pinchStartDistance.current <= 0) return;

    const distance = getTouchDistance(e.touches);
    const ratio = distance / pinchStartDistance.current;
    setScale(clampScale(pinchStartScale.current * ratio));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDistance.current = 0;
    }
  };

  const scrollToPage = (pageNumber: number) => {
    pageRefs.current.get(pageNumber)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderedWidth = pageWidth > 0 ? (pageWidth - 16) * scale : 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        ref={containerRef}
        className={cn(
          "min-h-0 flex-1 overscroll-contain",
          scale > 1 ? "overflow-auto touch-pan-x touch-pan-y" : "overflow-y-auto overflow-x-hidden touch-pan-y",
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages: total }) => setNumPages(total)}
          onItemClick={({ pageNumber }) => scrollToPage(pageNumber)}
          loading={
            <div className="flex h-full min-h-48 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          }
          error={
            <div className="flex h-full min-h-48 items-center justify-center px-6 text-center">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                No se pudo cargar el manual.
              </p>
            </div>
          }
          className="flex flex-col items-center gap-3 px-2 py-3"
        >
          {renderedWidth > 0 &&
            Array.from({ length: numPages }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <div
                  key={`page-${pageNumber}`}
                  ref={(node) => {
                    if (node) pageRefs.current.set(pageNumber, node);
                    else pageRefs.current.delete(pageNumber);
                  }}
                  className="relative"
                >
                  <Page
                    pageNumber={pageNumber}
                    width={renderedWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer
                    className="shadow-md bg-white"
                    loading={
                      <div
                        className="flex items-center justify-center bg-white dark:bg-zinc-800"
                        style={{ width: renderedWidth, height: renderedWidth * 1.414 }}
                      >
                        <Loader2 className="size-6 animate-spin text-celeste-trifinio" />
                      </div>
                    }
                  />
                </div>
              );
            })}
        </Document>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-zinc-950/95 px-4 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setScale((s) => clampScale(s - SCALE_STEP))}
          disabled={scale <= MIN_SCALE}
          className="flex size-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer active:scale-95"
          aria-label="Alejar"
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-14 text-center text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => clampScale(s + SCALE_STEP))}
          disabled={scale >= MAX_SCALE}
          className="flex size-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer active:scale-95"
          aria-label="Acercar"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setScale(1)}
          disabled={scale === 1}
          className="flex size-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer active:scale-95"
          aria-label="Restablecer zoom"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </div>
  );
}
