"use client";

import { domToCanvas } from "modern-screenshot";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

const OFICIO_W_MM = 216;
const OFICIO_H_MM = 330;
const MARGIN_MM = 10;
const BLOCK_GAP_MM = 4;
const EXPORT_BLOCK_SELECTOR = "[data-report-export-block]";
const EXPORT_HIDE_SELECTOR = ".report-export-hide";
const DESKTOP_CAPTURE_WIDTH = 1280;
const MOBILE_BREAKPOINT_PX = 1024;

export function isMobileExportViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT_PX;
}

async function nextFrame(times = 2) {
  for (let i = 0; i < times; i++) {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  }
}

/* ──────────────────────────────────────────────────────────────
   Preparación del DOM para exportación
   ────────────────────────────────────────────────────────────── */

function hideExportOnlyElements(root: HTMLElement): () => void {
  const restores: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(EXPORT_HIDE_SELECTOR)) {
    const prev = el.style.display;
    el.style.display = "none";
    restores.push(() => {
      el.style.display = prev;
    });
  }
  return () => restores.forEach((r) => r());
}

function showExportOnlyElements(root: HTMLElement): () => void {
  const restores: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(".report-export-only")) {
    const hadHidden = el.classList.contains("hidden");
    const prevDisplay = el.style.display;
    el.classList.remove("hidden");
    el.style.display = "block";
    restores.push(() => {
      el.style.display = prevDisplay;
      if (hadHidden) el.classList.add("hidden");
    });
  }
  return () => restores.forEach((r) => r());
}

function expandOverflows(root: HTMLElement): () => void {
  const restores: Array<() => void> = [];
  const elements: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  for (const el of elements) {
    const cs = getComputedStyle(el);
    if (
      cs.overflowX === "auto" ||
      cs.overflowX === "scroll" ||
      cs.overflowY === "auto" ||
      cs.overflowY === "scroll"
    ) {
      const prev = {
        overflow: el.style.overflow,
        overflowX: el.style.overflowX,
        overflowY: el.style.overflowY,
        maxHeight: el.style.maxHeight,
      };
      el.style.overflow = "visible";
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
      el.style.maxHeight = "none";
      restores.push(() => {
        el.style.overflow = prev.overflow;
        el.style.overflowX = prev.overflowX;
        el.style.overflowY = prev.overflowY;
        el.style.maxHeight = prev.maxHeight;
      });
    }
  }
  return () => restores.forEach((r) => r());
}

function tightenBlockForCapture(el: HTMLElement): () => void {
  const prev = {
    height: el.style.height,
    minHeight: el.style.minHeight,
    maxHeight: el.style.maxHeight,
    flex: el.style.flex,
  };
  el.style.height = "auto";
  el.style.minHeight = "0";
  el.style.maxHeight = "none";
  el.style.flex = "none";
  return () => {
    el.style.height = prev.height;
    el.style.minHeight = prev.minHeight;
    el.style.maxHeight = prev.maxHeight;
    el.style.flex = prev.flex;
  };
}

function forceDesktopLayoutForCapture(root: HTMLElement): () => void {
  if (!isMobileExportViewport()) return () => {};

  const touched: Array<{
    el: HTMLElement;
    minWidth: string;
    width: string;
    maxWidth: string;
  }> = [];

  let el: HTMLElement | null = root;
  while (el && el !== document.body) {
    touched.push({
      el,
      minWidth: el.style.minWidth,
      width: el.style.width,
      maxWidth: el.style.maxWidth,
    });
    el.style.minWidth = `${DESKTOP_CAPTURE_WIDTH}px`;
    el.style.width = `${DESKTOP_CAPTURE_WIDTH}px`;
    el.style.maxWidth = "none";
    el = el.parentElement;
  }

  window.dispatchEvent(new Event("resize"));

  return () => {
    for (const item of touched) {
      item.el.style.minWidth = item.minWidth;
      item.el.style.width = item.width;
      item.el.style.maxWidth = item.maxWidth;
    }
    window.dispatchEvent(new Event("resize"));
  };
}

function prepareExportDom(root: HTMLElement): () => void {
  const restoreShow = showExportOnlyElements(root);
  const restoreHide = hideExportOnlyElements(root);
  const restoreOverflow = expandOverflows(root);
  return () => {
    restoreOverflow();
    restoreHide();
    restoreShow();
  };
}

const COMMON_OPTS = {
  scale: 2,
  backgroundColor: "#ffffff",
  quality: 0.95,
} as const;

function getExportBlocks(node: HTMLElement): HTMLElement[] {
  const blocks = Array.from(
    node.querySelectorAll<HTMLElement>(EXPORT_BLOCK_SELECTOR)
  ).filter((el) => !el.closest(EXPORT_HIDE_SELECTOR));
  return blocks.length > 0 ? blocks : [node];
}

/** Recorta filas blancas arriba y abajo para eliminar espacio vacío en la captura. */
function trimCanvasWhitespace(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  const rowHasContent = (y: number) => {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 12) continue;
      if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) return true;
    }
    return false;
  };

  let top = 0;
  while (top < height && !rowHasContent(top)) top++;

  let bottom = height - 1;
  while (bottom > top && !rowHasContent(bottom)) bottom--;

  const trimmedH = bottom - top + 1;
  if (trimmedH <= 0 || trimmedH >= height) return canvas;

  const trimmed = document.createElement("canvas");
  trimmed.width = width;
  trimmed.height = trimmedH;
  const tctx = trimmed.getContext("2d");
  if (!tctx) return canvas;
  tctx.drawImage(canvas, 0, top, width, trimmedH, 0, 0, width, trimmedH);
  return trimmed;
}

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  const width = Math.ceil(el.scrollWidth || el.offsetWidth);
  const height = Math.ceil(el.scrollHeight || el.offsetHeight);
  const canvas = await domToCanvas(el, {
    ...COMMON_OPTS,
    width,
    height,
  });
  return trimCanvasWhitespace(canvas);
}

async function captureBlocks(node: HTMLElement): Promise<HTMLCanvasElement[]> {
  await nextFrame(2);
  const restore = prepareExportDom(node);
  const restoreDesktop = forceDesktopLayoutForCapture(node);
  await nextFrame(isMobileExportViewport() ? 6 : 2);
  try {
    const blocks = getExportBlocks(node);
    const canvases: HTMLCanvasElement[] = [];
    for (const block of blocks) {
      const restoreTight = tightenBlockForCapture(block);
      await nextFrame(isMobileExportViewport() ? 3 : 1);
      canvases.push(await captureElement(block));
      restoreTight();
    }
    return canvases;
  } finally {
    restoreDesktop();
    restore();
  }
}

async function captureFull(node: HTMLElement): Promise<HTMLCanvasElement> {
  await nextFrame(2);
  const restore = prepareExportDom(node);
  const restoreDesktop = forceDesktopLayoutForCapture(node);
  const restoreTight = tightenBlockForCapture(node);
  await nextFrame(isMobileExportViewport() ? 6 : 2);
  try {
    return await captureElement(node);
  } finally {
    restoreTight();
    restoreDesktop();
    restore();
  }
}

/* ──────────────────────────────────────────────────────────────
   Paginación por bloques (varios bloques por página si caben)
   ────────────────────────────────────────────────────────────── */

type PdfLayoutState = {
  pdf: jsPDF;
  pageIndex: number;
  yPos: number;
  usableW: number;
  usableH: number;
  pageH: number;
};

function pageTopY(): number {
  return MARGIN_MM;
}

function pageBottomY(state: PdfLayoutState): number {
  return state.pageH - MARGIN_MM;
}

function startNewPage(state: PdfLayoutState) {
  state.pdf.addPage([OFICIO_W_MM, OFICIO_H_MM], "portrait");
  state.pageIndex++;
  state.yPos = MARGIN_MM;
}

function addCanvasSliceToPdf(
  state: PdfLayoutState,
  canvas: HTMLCanvasElement,
  srcY: number,
  srcH: number,
  destY: number,
  destH: number
) {
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  sliceCanvas.height = srcH;
  const ctx = sliceCanvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
  ctx.drawImage(
    canvas,
    0,
    srcY,
    canvas.width,
    srcH,
    0,
    0,
    canvas.width,
    srcH
  );
  state.pdf.addImage(
    sliceCanvas.toDataURL("image/jpeg", 0.92),
    "JPEG",
    MARGIN_MM,
    destY,
    state.usableW,
    destH,
    undefined,
    "FAST"
  );
}

function addBlockToPdf(state: PdfLayoutState, canvas: HTMLCanvasElement) {
  const imgW = state.usableW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const bottomLimit = pageBottomY(state);

  if (imgH <= state.usableH) {
    if (state.pageIndex === 0 && state.yPos === 0) {
      state.yPos = pageTopY();
    }

    if (state.yPos + imgH > bottomLimit) {
      startNewPage(state);
      state.yPos = pageTopY();
    }

    addCanvasSliceToPdf(state, canvas, 0, canvas.height, state.yPos, imgH);
    state.yPos += imgH + BLOCK_GAP_MM;
    return;
  }

  const pageCanvasH = Math.floor((state.usableH * canvas.width) / imgW);
  let srcOffset = 0;

  while (srcOffset < canvas.height) {
    const sliceH = Math.min(pageCanvasH, canvas.height - srcOffset);
    const sliceImgH = (sliceH * imgW) / canvas.width;

    if (state.yPos + sliceImgH > bottomLimit) {
      startNewPage(state);
    }
    if (state.pageIndex === 0 && state.yPos === 0) {
      state.yPos = pageTopY();
    }

    addCanvasSliceToPdf(state, canvas, srcOffset, sliceH, state.yPos, sliceImgH);
    state.yPos += sliceImgH + BLOCK_GAP_MM;
    srcOffset += sliceH;
  }
}

function buildPdfFromBlocks(blocks: HTMLCanvasElement[]): jsPDF {
  const pdf = new jsPDF({
    unit: "mm",
    format: [OFICIO_W_MM, OFICIO_H_MM],
    orientation: "portrait",
    compress: true,
  });

  const state: PdfLayoutState = {
    pdf,
    pageIndex: 0,
    yPos: 0,
    usableW: OFICIO_W_MM - MARGIN_MM * 2,
    usableH: OFICIO_H_MM - MARGIN_MM * 2,
    pageH: OFICIO_H_MM,
  };

  for (const block of blocks) {
    addBlockToPdf(state, block);
  }

  return pdf;
}

/* ──────────────────────────────────────────────────────────────
   Exportadores públicos
   ────────────────────────────────────────────────────────────── */

export async function downloadNodeAsJpeg(node: HTMLElement, filename: string) {
  const canvas = await captureFull(node);
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la imagen"));
          return;
        }
        saveAs(blob, filename.endsWith(".jpg") ? filename : `${filename}.jpg`);
        resolve();
      },
      "image/jpeg",
      0.95
    );
  });
}

export async function downloadNodeAsPdf(
  node: HTMLElement,
  filename: string
) {
  const blocks = await captureBlocks(node);
  const pdf = buildPdfFromBlocks(blocks);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export async function printNode(node: HTMLElement, title = "Reporte") {
  const blocks = await captureBlocks(node);
  const pdf = buildPdfFromBlocks(blocks);
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Habilite las ventanas emergentes para imprimir.");
  }

  win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #525659; }
      embed { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <embed id="pdf-embed" type="application/pdf" src="${url}" />
    <script>
      var embed = document.getElementById('pdf-embed');
      embed.addEventListener('load', function () {
        setTimeout(function () { window.focus(); window.print(); }, 400);
      });
      setTimeout(function () { window.focus(); window.print(); }, 1200);
    </script>
  </body>
</html>`);
  win.document.close();

  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
