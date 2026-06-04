import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function isPasswordStrong(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function getPasswordRequirements(
  newPassword: string,
  confirmPassword: string,
) {
  return [
    { label: "Una minúscula", met: /[a-z]/.test(newPassword) },
    { label: "Una mayúscula", met: /[A-Z]/.test(newPassword) },
    { label: "Un número", met: /[0-9]/.test(newPassword) },
    { label: "Un símbolo", met: /[^A-Za-z0-9]/.test(newPassword) },
    { label: "Mín. 8 caracteres", met: newPassword.length >= 8 },
    {
      label: "Las contraseñas coinciden",
      met:
        confirmPassword.length > 0 && newPassword === confirmPassword,
    },
  ];
}

export function PasswordRequirements({
  newPassword,
  confirmPassword,
  className,
  iconSize = 12,
}: {
  newPassword: string;
  confirmPassword: string;
  className?: string;
  iconSize?: number;
}) {
  if (newPassword.length === 0) return null;

  const requirements = getPasswordRequirements(newPassword, confirmPassword);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-2 gap-y-1 mt-1",
        className,
      )}
    >
      {requirements.map((req) => (
        <div
          key={req.label}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors",
            req.met
              ? "text-green-600 dark:text-green-500"
              : "text-red-500 dark:text-red-400",
          )}
        >
          {req.met ? (
            <CheckCircle2 size={iconSize} />
          ) : (
            <XCircle size={iconSize} />
          )}
          <span>{req.label}</span>
        </div>
      ))}
    </div>
  );
}
