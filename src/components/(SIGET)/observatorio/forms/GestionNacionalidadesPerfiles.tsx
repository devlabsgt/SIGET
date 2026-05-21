"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Save, X, Globe, UserCircle } from "lucide-react";
import { useNacionalidades, usePerfiles } from "./lib/hooks";
import {
  createNacionalidad,
  createPerfil,
  updateNacionalidad,
  updatePerfil,
  deleteNacionalidad,
  deletePerfil,
  ObsNacionalidad,
  ObsPerfil,
} from "./lib/actions";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

type CatalogItem = ObsNacionalidad | ObsPerfil;

function CatalogSection({
  title,
  icon: Icon,
  items,
  isLoading,
  queryKey,
  onCreate,
  onUpdate,
  onDelete,
}: {
  title: string;
  icon: React.ElementType;
  items: CatalogItem[];
  isLoading: boolean;
  queryKey: string;
  onCreate: (nombre: string) => Promise<CatalogItem>;
  onUpdate: (id: string, nombre: string) => Promise<CatalogItem>;
  onDelete: (id: string) => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const createMutation = useMutation({
    mutationFn: onCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setIsAdding(false);
      setNewValue("");
      toast.success(`${title.slice(0, -1)} creada`);
    },
    onError: () => {
      toast.error("No se pudo crear el registro");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) => onUpdate(id, nombre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setEditingId(null);
      toast.success("Actualizado con éxito");
    },
    onError: () => {
      toast.error("No se pudo actualizar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Eliminado con éxito");
    },
    onError: () => {
      toast.error("No se pudo eliminar. Puede estar en uso.");
    },
  });

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-emerald-600" />
          <div>
            <h3 className="text-base font-black text-foreground tracking-tight">{title}</h3>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{items.length} registros</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap border border-emerald-100 dark:border-emerald-800"
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="px-3 py-2.5 flex items-center justify-between gap-3 bg-background/40 dark:bg-background/60 hover:bg-muted/50 dark:hover:bg-accent/30 transition-colors">
              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editValue.trim()) {
                        updateMutation.mutate({ id: item.id, nombre: editValue.trim() });
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full bg-transparent border-b border-emerald-500 font-bold text-foreground text-sm focus:outline-none"
                  />
                ) : (
                  <h4 className="font-bold text-foreground text-sm truncate">{item.nombre}</h4>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {editingId === item.id ? (
                  <>
                    <button
                      onClick={() => editValue.trim() && updateMutation.mutate({ id: item.id, nombre: editValue.trim() })}
                      className="p-1 text-emerald-500 rounded cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-300 rounded cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditValue(item.nombre);
                      }}
                      className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {isAdding && (
            <div className="px-3 py-2 bg-emerald-50/10 flex items-center gap-3">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Nombre..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newValue.trim()) createMutation.mutate(newValue.trim());
                  if (e.key === "Escape") setIsAdding(false);
                }}
                className="flex-1 bg-transparent border-b border-emerald-400 font-bold text-foreground text-xs focus:outline-none"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => newValue.trim() && createMutation.mutate(newValue.trim())}
                  className="p-1 text-emerald-500 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-1 text-slate-300 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {items.length === 0 && !isAdding && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Sin registros</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GestionNacionalidadesPerfiles() {
  const { data: nacionalidades = [], isLoading: loadingNac } = useNacionalidades();
  const { data: perfiles = [], isLoading: loadingPer } = usePerfiles();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-8">
      <CatalogSection
        title="Nacionalidades"
        icon={Globe}
        items={nacionalidades}
        isLoading={loadingNac}
        queryKey="nacionalidades"
        onCreate={createNacionalidad}
        onUpdate={updateNacionalidad}
        onDelete={deleteNacionalidad}
      />
      <CatalogSection
        title="Perfiles"
        icon={UserCircle}
        items={perfiles}
        isLoading={loadingPer}
        queryKey="perfiles"
        onCreate={createPerfil}
        onUpdate={updatePerfil}
        onDelete={deletePerfil}
      />
    </div>
  );
}
