"use client";

import { useEffect, useMemo, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

const LOGO_TRIFINIO = "/trifinio/logo-vertical.png";

export function QrActividad({
  actividadId,
  nombreActividad,
  size = 220,
}: {
  actividadId: string;
  nombreActividad: string;
  size?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const url = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/actividades/${actividadId}`;
    }
    return `/actividades/${actividadId}`;
  }, [actividadId]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    node.replaceChildren();

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data: url,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: "H",
      },
      dotsOptions: {
        type: "dots",
        color: "#1a4d7a",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#1a4d7a",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#1a95d3",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      image: LOGO_TRIFINIO,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 8,
        imageSize: 0.38,
        hideBackgroundDots: true,
      },
    });

    qr.append(node);

    return () => {
      node.replaceChildren();
    };
  }, [url, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="max-w-xs text-center text-sm font-black leading-snug text-foreground">
        {nombreActividad}
      </p>
      <div className="rounded-2xl bg-white p-4 dark:bg-zinc-50">
        <div
          ref={containerRef}
          className="[&_svg]:block"
          style={{ width: size, height: size }}
        />
      </div>
      <p className="max-w-xs break-all text-center text-xs text-muted-foreground">
        {url}
      </p>
    </div>
  );
}
