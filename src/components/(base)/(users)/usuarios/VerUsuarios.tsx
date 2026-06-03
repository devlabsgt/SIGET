"use client";

import { useState, useMemo, Fragment, useEffect } from "react";
import { useUsers } from "./lib/hooks";
import { useUser } from "@/components/(base)/providers/UserProvider";
import {
  Loader2,
  UserX,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import VerPerfil from "@/components/(base)/(users)/profile/VerPerfil";
import SignUp from "@/components/(base)/(auth)/signup/SignUp";
import { cn } from "@/lib/utils";

export function VerUsuarios() {
  const user = useUser();
  const userRole = user?.user_metadata?.rol || "user";

  const { data: users, isLoading, isError, refetch } = useUsers(userRole);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLargeScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleUserClick = (id: string) => {
    setSelectedUserId(id);
    setIsProfileOpen(true);
  };

  const handleCloseSignUp = () => {
    setIsSignUpOpen(false);
    refetch();
  };

  const roleLabels: Record<string, string> = {
    user: "Usuario (Estándar)",
    observatorio: "Observatorio",
    "admin-observatorio": "Admin Observatorio",
    admin: "Administrador",
    super: "Super Admin",
  };

  const availableRoles = useMemo(() => {
    if (!users) return [];
    const roles = Array.from(new Set(users.map((u) => u.rol))).filter(Boolean);
    return roles;
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users
      .filter((u) => {
        const matchesSearch = (u.nombre || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || u.rol === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const nameA = a.nombre || "";
        const nameB = b.nombre || "";
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB, "es", { sensitivity: "base" })
          : nameB.localeCompare(nameA, "es", { sensitivity: "base" });
      });
  }, [users, searchQuery, sortOrder, roleFilter]);

  const totalUsers = filteredUsers.length;
  const isAll = pageSize === "all";
  const totalPages = isAll ? 1 : Math.ceil(totalUsers / (pageSize as number));

  const paginatedUsers = useMemo(() => {
    if (isAll) return filteredUsers;
    const size = pageSize as number;
    return filteredUsers.slice((currentPage - 1) * size, currentPage * size);
  }, [filteredUsers, isAll, currentPage, pageSize]);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPageSize(val === "all" ? "all" : Number(val));
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center gap-2 text-destructive">
        <UserX className="h-8 w-8" />
        <p>Error al cargar usuarios</p>
      </div>
    );
  }

  const paginationControls = (
    <div className="flex items-center gap-2 shrink-0">
      {!isAll && (
        <>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-muted-foreground min-w-[28px] text-center font-bold">
            {currentPage}/{totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      <select
        value={pageSize}
        onChange={handlePageSizeChange}
        className="h-9 rounded-md border border-border bg-card px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value="all">Todos</option>
      </select>
    </div>
  );

  const canCreateUser = userRole === "admin" || userRole === "super";
  const showDesktopPanel = canCreateUser && isLargeScreen;

  return (
    <>
      <div
        className={cn(
          "w-full mx-auto pt-5 pb-10",
          showDesktopPanel ? "max-w-6xl px-4" : "max-w-3xl",
        )}
      >
        <div
          className={cn(
            "flex gap-5 lg:gap-6",
            showDesktopPanel
              ? "flex-col lg:flex-row lg:items-start"
              : "flex-col",
          )}
        >
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-col gap-4 mb-4 px-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm xl:text-xl font-bold tracking-tight text-foreground">
                    Gestión de Usuarios
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rol Actual:{" "}
                    <span className="text-[10px] underline font-bold uppercase text-foreground">
                      {roleLabels[userRole] || userRole}
                    </span>
                  </p>
                </div>
                {canCreateUser && !isLargeScreen && !isSignUpOpen && (
                  <button
                    onClick={() => setIsSignUpOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 cursor-pointer shrink-0"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground h-9"
                  />
                </div>
                {paginationControls}
              </div>
            </div>

            <div className="px-4">
              <div className="border border-border rounded-xl bg-card overflow-hidden">
            <table className="w-full text-sm text-left border-separate border-spacing-0 table-fixed">
              <thead className="bg-muted/60">
                {/* Móvil: filtros apilados para evitar desbordamiento */}
                <tr className="md:hidden">
                  <th colSpan={2} className="px-2 py-2 border-b border-border">
                    <div className="flex flex-col gap-2">
                      <select
                        value={sortOrder}
                        onChange={(e) =>
                          setSortOrder(e.target.value as "asc" | "desc")
                        }
                        className="w-full bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors uppercase text-[10px] tracking-wide"
                      >
                        <option value="asc">Ordenar (A-Z)</option>
                        <option value="desc">Ordenar (Z-A)</option>
                      </select>
                      <select
                        value={roleFilter}
                        onChange={(e) => {
                          setRoleFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-transparent text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors text-[10px] font-medium"
                      >
                        <option value="all">Rol: Todos</option>
                        {availableRoles.map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role] || role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                </tr>
                {/* Desktop */}
                <tr className="hidden md:table-row">
                  <th className="w-[65%] px-5 py-2.5 border-b border-border">
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as "asc" | "desc")
                      }
                      className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors uppercase text-xs tracking-wide"
                    >
                      <option value="asc">Ordenar (A-Z)</option>
                      <option value="desc">Ordenar (Z-A)</option>
                    </select>
                  </th>
                  <th className="w-[35%] px-5 py-2.5 border-b border-border text-right">
                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors text-xs font-medium text-right ml-auto max-w-full"
                    >
                      <option value="all">Rol: Todos</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role] || role}
                        </option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((userItem, index) => {
                  const firstLetter = (userItem.nombre || "#")
                    .charAt(0)
                    .toUpperCase();
                  const prevFirstLetter =
                    index > 0
                      ? (paginatedUsers[index - 1].nombre || "#")
                          .charAt(0)
                          .toUpperCase()
                      : null;
                  const showSeparator = firstLetter !== prevFirstLetter;

                  return (
                    <Fragment key={userItem.id}>
                      {showSeparator && (
                        <tr>
                          <td
                            colSpan={2}
                            className="bg-muted/30 px-4 md:px-5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-y border-border/50"
                          >
                            {firstLetter}
                          </td>
                        </tr>
                      )}
                      <tr
                        onClick={() => handleUserClick(userItem.id)}
                        className="group hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <td className="px-4 md:px-5 py-2.5 font-medium group-hover:text-primary transition-colors border-b border-border/40 align-top">
                          <span className="block md:line-clamp-2 md:leading-snug break-words">
                            {userItem.nombre || "Sin Nombre"}
                          </span>
                        </td>
                        <td className="px-4 md:px-5 py-2.5 border-b border-border/40 text-right align-top">
                          <span className="inline-block capitalize text-[10px] font-bold bg-primary/5 px-2 py-0.5 rounded border border-primary/10 whitespace-nowrap">
                            {userItem.rol
                              ? roleLabels[userItem.rol] || userItem.rol
                              : "Sin Rol"}
                          </span>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-xs uppercase font-medium">
                {searchQuery
                  ? "No se encontraron coincidencias."
                  : "No hay usuarios disponibles con estos filtros."}
              </div>
            )}
              </div>
            </div>
          </div>

          {showDesktopPanel && (
            <div className="w-[360px] xl:w-[400px] shrink-0">
              <SignUp
                isOpen
                onClose={() => {}}
                onSuccess={() => refetch()}
                presentation="panel"
              />
            </div>
          )}
        </div>
      </div>

      <VerPerfil
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={selectedUserId}
      />

      {isSignUpOpen && canCreateUser && !isLargeScreen && (
        <SignUp
          isOpen
          onClose={handleCloseSignUp}
          presentation="fullscreen"
        />
      )}
    </>
  );
}
