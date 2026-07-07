"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Shield, Eye, EyeOff, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { generateStrongPassword } from "@/utils/general/password-generator";
import { AuroraText } from "@/components/ui/aurora-text";
import type { User } from "@supabase/supabase-js";
import {
  isPasswordStrong,
  PasswordRequirements,
} from "@/components/ui/password-requirements";

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lastChange, setLastChange] = useState<string | undefined>(undefined);

  const formatLastChange = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    let formatted = date.toLocaleDateString('es-ES', options);
    formatted = formatted.replace(',', '');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        supabase
          .from("profiles")
          .select("ultimo_cambio_password")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            setLastChange(profile?.ultimo_cambio_password || null);
          });
      }
    });
  }, [supabase]);

  const isPasswordValid = isPasswordStrong(formData.newPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isSameAsCurrentPassword = async (password: string): Promise<boolean> => {
    if (!user?.email) return false;

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    return !error;
  };

  const handleSave = async () => {
    if (!isPasswordValid || formData.newPassword !== formData.confirmPassword) {
      return;
    }

    setLoading(true);
    try {
      if (await isSameAsCurrentPassword(formData.newPassword)) {
        await Swal.fire({
          icon: "warning",
          title: "Contraseña repetida",
          text: "La nueva contraseña debe ser diferente a la actual.",
          background: theme === "dark" ? "#18181b" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
        });
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });
      
      if (authError) throw authError;

      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ ultimo_cambio_password: new Date().toISOString() })
          .eq("id", user.id);
          
        if (profileError) throw profileError;
      }

      Swal.fire({
        icon: "success",
        title: "¡Contraseña actualizada!",
        text: "Tu contraseña ha sido cambiada correctamente.",
        background: theme === "dark" ? "#18181b" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        router.push("/siget");
        router.refresh();
      });

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la contraseña";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        background: theme === "dark" ? "#18181b" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-6">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full shadow-sm">
            <Shield size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-center text-zinc-800 dark:text-zinc-100">
            Actualizar Contraseña
          </h2>
          <p className="text-sm text-center text-muted-foreground px-4">
            Por seguridad, debe establecer una nueva contraseña antes de continuar en el sistema.
          </p>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center">
            Este proceso se realiza automaticamente cada 3 meses. 
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 px-1">
               {lastChange !== undefined ? (
                 <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                   Último cambio de contraseña: <span className="text-orange-500">{formatLastChange(lastChange)}</span>
                 </span>
               ) : (
                 <span />
               )}
               <button
                 type="button"
                 onClick={() => {
                   const p = generateStrongPassword();
                   setFormData({ newPassword: p, confirmPassword: p });
                   setShowPass(true);
                 }}
                 className="text-sm flex items-center gap-1.5 font-bold hover:underline text-primary cursor-pointer transition-opacity shrink-0"
               >
                 <AuroraText>Generar Contraseña</AuroraText>
                 <Wand2 size={14} className="rotate-[15deg]" />
               </button>
            </div>
            
            <div className="relative">
              <input
              name="newPassword"
              type={showPass ? "text" : "password"}
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Nueva contraseña"
              className={cn(
                "flex h-11 w-full rounded-xl border border-input bg-zinc-50 dark:bg-zinc-950 px-4 text-sm pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all",
                formData.newPassword.length > 0 &&
                  isPasswordValid &&
                  "border-green-500 ring-1 ring-green-500",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          </div>

          <div className="relative">
            <input
              name="confirmPassword"
              type={showPass ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmar contraseña"
              className={cn(
                "flex h-11 w-full rounded-xl border border-input bg-zinc-50 dark:bg-zinc-950 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all",
                formData.confirmPassword &&
                  formData.newPassword !== formData.confirmPassword &&
                  "border-red-500 ring-1 ring-red-500",
                formData.confirmPassword &&
                  formData.newPassword === formData.confirmPassword &&
                  "border-green-500 ring-1 ring-green-500",
              )}
            />
          </div>

          <PasswordRequirements
            newPassword={formData.newPassword}
            confirmPassword={formData.confirmPassword}
            className="mt-4 px-2 border-t border-border/50 pt-4 gap-y-2"
            iconSize={14}
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={!isPasswordValid || formData.newPassword !== formData.confirmPassword || loading}
            className="w-full h-12 mt-6 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {loading ? "Guardando..." : "Cambiar Contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}
