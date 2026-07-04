"use client";

import { domToCanvas } from "modern-screenshot";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

const EXPORT_PADDING = 48;
const EXPORT_SCALE = 2;
const LOGO_SRC = "/trifinio/logo-vertical.png";

let logoDataUrlPromise: Promise<string> | null = null;

export async function loadLogoDataUrl(): Promise<string> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = (async () => {
      const response = await fetch(LOGO_SRC);
      if (!response.ok) {
        throw new Error("No se pudo cargar el logo de Trifinio.");
      }
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("No se pudo leer el logo."));
        reader.readAsDataURL(blob);
      });
    })().catch((err) => {
      logoDataUrlPromise = null;
      throw err;
    });
  }
  return logoDataUrlPromise;
}

async function nextFrame(times = 2) {
  for (let i = 0; i < times; i++) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

function exportBackgroundColor(): string {
  return document.documentElement.classList.contains("dark")
    ? "#18181b"
    : "#fafafa";
}

function findTreeSvg(canvas: HTMLElement): SVGSVGElement {
  const svg = canvas.querySelector("svg.rd3t-svg");
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error(
      "No se encontró el organigrama. Espere a que termine de cargar e intente de nuevo.",
    );
  }
  return svg;
}

function getTreeContentGroup(svg: SVGSVGElement): SVGGElement {
  const group = svg.querySelector("g.rd3t-g");
  if (!(group instanceof SVGGElement)) {
    throw new Error("No se pudo leer la estructura del organigrama.");
  }
  return group;
}

function applyLinkStrokes(clone: SVGSVGElement) {
  const isDark = document.documentElement.classList.contains("dark");
  const linkStroke = isDark
    ? "rgba(111, 159, 212, 0.55)"
    : "rgba(44, 95, 155, 0.55)";
  const railStroke = isDark
    ? "rgba(52, 211, 153, 0.6)"
    : "rgba(16, 185, 129, 0.55)";

  const elements = clone.querySelectorAll<SVGGeometryElement>(
    "path.rd3t-link, path.org-link, line.org-link",
  );

  elements.forEach((el) => {
    if (el.classList.contains("org-link--cadena")) {
      el.style.setProperty("stroke", "transparent", "important");
      el.style.setProperty("fill", "none", "important");
      return;
    }
    const stroke = el.classList.contains("org-link--rail")
      ? railStroke
      : linkStroke;
    el.style.setProperty("stroke", stroke, "important");
    el.style.setProperty("stroke-width", "2.5px", "important");
    el.style.setProperty("fill", "none", "important");
  });
}

const LEGEND_ITEMS = [
  { color: "#2c5f9b", label: "Departamento / Dependencia / Oficina" },
  { color: "#d97706", label: "Director / Encargado / Coordinador" },
  { color: "#059669", label: "Puesto / Consultoría" },
] as const;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLegend(canvas: HTMLCanvasElement, scale: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const isDark = document.documentElement.classList.contains("dark");
  const font = "ui-sans-serif, system-ui, -apple-system, sans-serif";
  const pad = 14 * scale;
  const margin = 20 * scale;
  const swatch = 13 * scale;
  const swatchGap = 9 * scale;
  const rowGap = 9 * scale;
  const titleSize = 11 * scale;
  const titleGap = 11 * scale;
  const labelSize = 13 * scale;
  const rowH = Math.max(swatch, labelSize);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  ctx.font = `700 ${labelSize}px ${font}`;
  let maxLabelW = 0;
  for (const item of LEGEND_ITEMS) {
    maxLabelW = Math.max(maxLabelW, ctx.measureText(item.label).width);
  }
  ctx.font = `800 ${titleSize}px ${font}`;
  const titleW = ctx.measureText("DESCRIPCIÓN").width;

  const contentW = Math.max(titleW, swatch + swatchGap + maxLabelW);
  const boxW = contentW + pad * 2;
  const rowsH =
    LEGEND_ITEMS.length * rowH + (LEGEND_ITEMS.length - 1) * rowGap;
  const boxH = pad * 2 + titleSize + titleGap + rowsH;

  const x = margin;
  const y = margin;

  ctx.fillStyle = isDark ? "rgba(39,39,42,0.95)" : "rgba(255,255,255,0.95)";
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";
  ctx.lineWidth = Math.max(1, scale);
  roundRectPath(ctx, x, y, boxW, boxH, 12 * scale);
  ctx.fill();
  ctx.stroke();

  const tx = x + pad;

  ctx.font = `800 ${titleSize}px ${font}`;
  ctx.fillStyle = isDark ? "#a1a1aa" : "#71717a";
  ctx.fillText("DESCRIPCIÓN", tx, y + pad + titleSize / 2);

  ctx.font = `700 ${labelSize}px ${font}`;
  let rowY = y + pad + titleSize + titleGap;
  for (const item of LEGEND_ITEMS) {
    const midY = rowY + rowH / 2;
    ctx.fillStyle = item.color;
    roundRectPath(ctx, tx, midY - swatch / 2, swatch, swatch, 4 * scale);
    ctx.fill();
    ctx.fillStyle = item.color;
    ctx.fillText(item.label, tx + swatch + swatchGap, midY);
    rowY += rowH + rowGap;
  }
}

function sanitizeFilenamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function organigramaExportBasename(nombreEstructura: string): string {
  const slug = sanitizeFilenamePart(nombreEstructura) || "estructura";
  const date = new Date().toISOString().slice(0, 10);
  return `organigrama-${slug}-${date}`;
}

async function captureOrganigramaCanvas(
  canvas: HTMLElement,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  await nextFrame(2);

  const svg = findTreeSvg(canvas);
  const content = getTreeContentGroup(svg);
  const bbox = content.getBBox();
  const pad = EXPORT_PADDING;
  const vbX = bbox.x - pad;
  const vbY = bbox.y - pad;
  const vbW = Math.ceil(bbox.width + pad * 2);
  const vbH = Math.ceil(bbox.height + pad * 2);

  const clone = svg.cloneNode(true) as SVGSVGElement;

  const cloneGroup = clone.querySelector("g.rd3t-g");
  if (cloneGroup instanceof SVGGElement) {
    cloneGroup.removeAttribute("transform");
  }

  clone
    .querySelectorAll<HTMLElement>(".org-export-hide")
    .forEach((el) => el.remove());

  applyLinkStrokes(clone);

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(vbW));
  clone.setAttribute("height", String(vbH));
  clone.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
  clone.style.display = "block";
  clone.style.overflow = "visible";

  const background = exportBackgroundColor();
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = [
    "position:fixed",
    "left:-100000px",
    "top:0",
    "pointer-events:none",
    `width:${vbW}px`,
    `height:${vbH}px`,
    `background:${background}`,
    "overflow:visible",
    "z-index:-1",
  ].join(";");
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  await nextFrame(3);

  let treeCanvas: HTMLCanvasElement;
  try {
    treeCanvas = await domToCanvas(wrapper, {
      scale: EXPORT_SCALE,
      backgroundColor: background,
      width: vbW,
      height: vbH,
    });
  } finally {
    wrapper.remove();
  }

  const scale = treeCanvas.width / vbW;
  drawLegend(treeCanvas, scale);

  return treeCanvas;
}

export async function downloadOrganigramaPng(
  canvas: HTMLElement,
  filename: string,
) {
  const capture = await captureOrganigramaCanvas(canvas);
  await new Promise<void>((resolve, reject) => {
    capture.toBlob((blob) => {
      if (!blob) {
        reject(new Error("No se pudo generar la imagen."));
        return;
      }
      saveAs(blob, filename.endsWith(".png") ? filename : `${filename}.png`);
      resolve();
    }, "image/png");
  });
}

export async function copyOrganigramaToClipboard(canvas: HTMLElement) {
  if (
    typeof ClipboardItem === "undefined" ||
    !navigator.clipboard?.write
  ) {
    throw new Error(
      "Tu navegador no permite copiar imágenes al portapapeles.",
    );
  }

  const capture = await captureOrganigramaCanvas(canvas);
  const blob = await new Promise<Blob>((resolve, reject) => {
    capture.toBlob((b) => {
      if (!b) {
        reject(new Error("No se pudo generar la imagen."));
        return;
      }
      resolve(b);
    }, "image/png");
  });

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ]);
}

export async function downloadOrganigramaPdf(
  canvas: HTMLElement,
  filename: string,
) {
  const capture = await captureOrganigramaCanvas(canvas);
  const imgData = capture.toDataURL("image/png");
  const pxToMm = 0.264583;
  const marginMm = 10;
  const imgWMm = capture.width * pxToMm;
  const imgHMm = capture.height * pxToMm;
  const pageW = imgWMm + marginMm * 2;
  const pageH = imgHMm + marginMm * 2;
  const orientation = pageW > pageH ? "landscape" : "portrait";

  const pdf = new jsPDF({
    unit: "mm",
    format: [pageW, pageH],
    orientation,
    compress: true,
  });

  pdf.addImage(imgData, "PNG", marginMm, marginMm, imgWMm, imgHMm);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
