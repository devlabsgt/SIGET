"use client";

import Image from "next/image";
import { useUser } from "@/components/(base)/providers/UserProvider";

const AZUL_TRIFINIO = "#2c5f9b";

function getUserDisplayName(user: ReturnType<typeof useUser>): string {
  if (!user) return "Usuario";
  const meta = user.user_metadata || {};
  return (
    (meta.nombre as string | undefined)?.trim() ||
    (meta.username as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Usuario"
  );
}

export function ReportExportHeader({
  dateLabel,
}: {
  dateLabel: string;
}) {
  const user = useUser();
  const userName = getUserDisplayName(user);
  const generatedAt = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div
      className="report-export-only hidden"
      style={{
        marginBottom: 28,
        paddingBottom: 28,
        borderBottom: "2px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
          width: "100%",
          minHeight: 148,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {/* Izquierda: logo + palabras de la marca */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
            flexShrink: 0,
          }}
        >
          <Image
            src="/trifinio/logo.png"
            alt="Plan Trifinio"
            width={140}
            height={140}
            style={{ width: 104, height: "auto", objectFit: "contain", flexShrink: 0 }}
            priority
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1.15,
                color: AZUL_TRIFINIO,
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              Plan Trifinio
            </h1>
            <p
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: 17,
                fontWeight: 700,
                fontStyle: "italic",
                lineHeight: 1.3,
                color: AZUL_TRIFINIO,
                margin: "8px 0 0 0",
              }}
            >
              &ldquo;Agua sin fronteras&rdquo;
            </p>
            <div
              style={{
                width: 240,
                height: 2,
                backgroundColor: AZUL_TRIFINIO,
                marginTop: 12,
              }}
            />
            <p
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.2em",
                lineHeight: 1.5,
                color: AZUL_TRIFINIO,
                margin: "10px 0 0 0",
                whiteSpace: "nowrap",
              }}
            >
              El Salvador • Guatemala • Honduras
            </p>
          </div>
        </div>

        {/* Centro: información del reporte */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minWidth: 340,
            padding: "0 24px",
          }}
        >
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: "0.08em",
              lineHeight: 1.45,
              color: AZUL_TRIFINIO,
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Análisis de Datos — Observatorio
          </p>

          <div
            style={{
              width: "100%",
              maxWidth: 360,
              height: 1,
              backgroundColor: "#e2e8f0",
              margin: "16px 0",
            }}
          />

          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
              margin: "0 0 8px 0",
            }}
          >
            <span style={{ fontWeight: 700, color: "#334155" }}>Periodo:</span>{" "}
            <span style={{ color: "#0f172a" }}>{dateLabel}</span>
          </p>
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
              margin: "0 0 8px 0",
            }}
          >
            <span style={{ fontWeight: 700, color: "#334155" }}>Impreso por:</span>{" "}
            <span style={{ color: "#0f172a" }}>{userName}</span>
          </p>
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 12,
              lineHeight: 1.5,
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Generado el {generatedAt}
          </p>
        </div>
      </div>
    </div>
  );
}
