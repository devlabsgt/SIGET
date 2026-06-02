"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ManualPdfMobileViewerProps {
  url: string;
}

export default function ManualPdfMobileViewer({ url }: ManualPdfMobileViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

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

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y"
    >
      <Document
        file={url}
        onLoadSuccess={({ numPages: total }) => setNumPages(total)}
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
        {pageWidth > 0 &&
          Array.from({ length: numPages }, (_, index) => (
            <Page
              key={`page-${index + 1}`}
              pageNumber={index + 1}
              width={pageWidth - 16}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-md"
              loading={
                <div
                  className="flex items-center justify-center bg-white dark:bg-zinc-800"
                  style={{ width: pageWidth - 16, height: (pageWidth - 16) * 1.414 }}
                >
                  <Loader2 className="size-6 animate-spin text-celeste-trifinio" />
                </div>
              }
            />
          ))}
      </Document>
    </div>
  );
}
