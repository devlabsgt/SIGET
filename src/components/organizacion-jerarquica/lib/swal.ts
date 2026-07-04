import Swal from "sweetalert2";

function isDarkTheme() {
  return document.documentElement.classList.contains("dark");
}

function swalSurface() {
  const dark = isDarkTheme();
  return {
    background: dark ? "#27272a" : "#f4f4f5",
    color: dark ? "#fafafa" : "#18181b",
    cancelButtonColor: dark ? "#52525b" : "#a1a1aa",
  };
}

function elevateSwalZIndex() {
  const container = Swal.getContainer();
  if (container) {
    container.style.zIndex = "99999";
  }
}

export async function confirmarDesasignarPersona(options: {
  title: string;
  text: string;
}) {
  return Swal.fire({
    title: options.title,
    text: options.text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: isDarkTheme() ? "#1a95d3" : "#0d7ab8",
    confirmButtonText: "Sí, desasignar",
    cancelButtonText: "Cancelar",
    ...swalSurface(),
    didOpen: elevateSwalZIndex,
  });
}

export async function confirmarEliminacionEstructura(options: {
  title: string;
  text: string;
}) {
  return Swal.fire({
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    ...swalSurface(),
    didOpen: elevateSwalZIndex,
  });
}

export async function avisoNoEliminableEstructura(options: {
  title: string;
  text: string;
}) {
  return Swal.fire({
    title: options.title,
    text: options.text,
    icon: "warning",
    confirmButtonColor: isDarkTheme() ? "#1a95d3" : "#0d7ab8",
    confirmButtonText: "Entendido",
    ...swalSurface(),
    didOpen: elevateSwalZIndex,
  });
}
