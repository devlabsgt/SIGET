import Swal from "sweetalert2";

function isDarkTheme() {
  return document.documentElement.classList.contains("dark");
}

const swalImagenCustomClass = {
  popup:
    "!rounded-2xl !border !border-border !bg-zinc-100 !p-6 dark:!border-zinc-700 dark:!bg-zinc-900",
  title: "!text-foreground !text-lg !font-black !mt-1",
  htmlContainer:
    "!text-muted-foreground !text-sm !font-medium !mt-3 dark:!text-zinc-400",
  confirmButton:
    "!mx-1 !inline-flex !h-10 !items-center !justify-center !rounded-xl !border-0 !bg-red-100 !px-5 !text-xs !font-bold !text-red-600 !shadow-none !transition-colors hover:!bg-red-200 dark:!bg-red-950 dark:!text-red-400 dark:hover:!bg-red-900",
  cancelButton:
    "!mx-1 !inline-flex !h-10 !items-center !justify-center !rounded-xl !border-0 !bg-sky-100 !px-5 !text-xs !font-bold !text-azul-trifinio !shadow-none !transition-colors hover:!bg-sky-200 dark:!bg-sky-950 dark:!text-azul-trifinio dark:hover:!bg-sky-900",
  actions: "!mt-6 !flex !w-full !flex-wrap !justify-center !gap-2",
  icon: "!border-amber-500 !text-amber-500",
} as const;

const swalImagenOkButtonClass = swalImagenCustomClass.cancelButton;

function elevateSwalZIndex() {
  const container = Swal.getContainer();
  if (container) container.style.zIndex = "10001";
}

export function alertDemasiadasImagenes(
  remaining: number,
  max: number,
): Promise<{ isConfirmed: boolean }> {
  const dark = isDarkTheme();
  const text =
    remaining <= 0
      ? `Máximo ${max} imágenes por proyecto.`
      : `Puedes seleccionar máx. ${remaining} ${remaining === 1 ? "imagen más" : "imágenes más"}.`;

  return Swal.fire({
    title: "Demasiadas imágenes",
    text,
    icon: "warning",
    confirmButtonText: "Entendido",
    background: dark ? "#18181b" : "#f4f4f5",
    color: dark ? "#fafafa" : "#18181b",
    buttonsStyling: false,
    customClass: {
      ...swalImagenCustomClass,
      confirmButton: swalImagenOkButtonClass,
    },
    didOpen: elevateSwalZIndex,
  });
}

export function confirmEliminarImagen() {
  const dark = isDarkTheme();
  return Swal.fire({
    title: "¿Eliminar imagen?",
    text: "La imagen se eliminará del proyecto.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    background: dark ? "#18181b" : "#f4f4f5",
    color: dark ? "#fafafa" : "#18181b",
    buttonsStyling: false,
    customClass: swalImagenCustomClass,
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) container.style.zIndex = "10001";
    },
  });
}

export function confirmEliminarTodasImagenes(cantidad: number) {
  const dark = isDarkTheme();
  return Swal.fire({
    title: "¿Eliminar todas las imágenes?",
    text: `Se eliminarán ${cantidad} imágenes del proyecto.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar todas",
    cancelButtonText: "Cancelar",
    background: dark ? "#18181b" : "#f4f4f5",
    color: dark ? "#fafafa" : "#18181b",
    buttonsStyling: false,
    customClass: swalImagenCustomClass,
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) container.style.zIndex = "10001";
    },
  });
}
