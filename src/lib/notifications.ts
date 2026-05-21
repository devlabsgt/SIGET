import Swal from "sweetalert2";
import { toast } from "react-toastify";

export const showToast = (
  icon: "success" | "error" | "warning" | "info",
  title: string,
) => {
  switch (icon) {
    case "success":
      toast.success(title);
      break;
    case "error":
      toast.error(title);
      break;
    case "warning":
      toast.warn(title);
      break;
    case "info":
      toast.info(title);
      break;
  }
};

export const showAlert = (
  icon: "success" | "error" | "warning",
  title: string,
  text: string,
) => {
  const isDark = document.documentElement.classList.contains("dark");
  return Swal.fire({
    icon,
    title,
    text,
    background: isDark ? "#121212" : "#ffffff",
    color: isDark ? "#fff" : "#09090b",
    confirmButtonColor: "#ea580c",
    customClass: {
      popup: "rounded-3xl border border-border/50 backdrop-blur-xl",
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = "99999";
      }
    },
  });
};
