import { toast, type ToastOptions } from "react-toastify";

const MANUAL_TOAST_OPTIONS: ToastOptions = {
  position: "top-center",
  className: "obs-toast",
  progressClassName: "obs-toast-progress",
  autoClose: 5000,
  style: { zIndex: 10000 },
};

export function parseManualActionError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message: unknown }).message === "string"
        ? (err as { message: string }).message
        : String(err);

  if (/body exceeded|1\s*mb\s*limit|bodysizelimit|413/i.test(raw)) {
    return "El PDF supera el límite permitido (máximo 10 MB). Reinicia el servidor si acabas de actualizar la configuración.";
  }

  if (raw && raw !== "[object Object]") return raw;

  return "No se pudo completar la operación. Intente de nuevo.";
}

export function showManualToastError(message: string) {
  toast.error(message, MANUAL_TOAST_OPTIONS);
}

export function showManualToastSuccess(message: string) {
  toast.success(message, MANUAL_TOAST_OPTIONS);
}
