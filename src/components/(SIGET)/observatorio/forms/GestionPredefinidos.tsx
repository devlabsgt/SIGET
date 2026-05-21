"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Save, X, GripVertical, ArrowUpDown } from "lucide-react";
import { usePredefinedFields } from "./lib/hooks";
import { createPredefinedField, updatePredefinedField, deletePredefinedField } from "./lib/actions";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export default function GestionPredefinidos() {
  const { data: fields = [], isLoading } = usePredefinedFields();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editOrder, setEditOrder] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newOrder, setNewOrder] = useState<number>(0);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: ({ nombre, orden }: { nombre: string; orden: number }) => createPredefinedField(nombre, orden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predefinedFields"] });
      setIsAdding(false);
      setNewValue("");
      toast.success("Campo creado con éxito");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, nombre, orden }: { id: string; nombre: string; orden: number }) => updatePredefinedField(id, nombre, orden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predefinedFields"] });
      setEditingId(null);
      setSwappingId(null);
      setExpandedId(null);
      toast.success("Campo actualizado con éxito");
    }
  });

  const swapMutation = useMutation({
    mutationFn: async ({ id1, order1, id2, order2, name1, name2 }: { id1: string, order1: number, id2: string, order2: number, name1: string, name2: string }) => {
      await updatePredefinedField(id1, name1, order2);
      await updatePredefinedField(id2, name2, order1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predefinedFields"] });
      setSwappingId(null);
      setEditingId(null);
      setExpandedId(null);
      toast.success("Orden intercambiado con éxito");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePredefinedField(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predefinedFields"] });
      toast.success("Campo eliminado con éxito");
    }
  });

  const handleCreate = () => {
    if (!newValue.trim()) return;
    createMutation.mutate({ nombre: newValue, orden: newOrder || fields.length + 1 });
  };

  const handleUpdate = (id: string) => {
    if (!editValue.trim()) return;
    updateMutation.mutate({ id, nombre: editValue, orden: editOrder });
  };

  const handleSelectToSwap = (targetField: any) => {
    const sourceField = fields.find(f => f.id === swappingId);
    if (sourceField && targetField.id !== swappingId) {
      swapMutation.mutate({
        id1: sourceField.id,
        order1: sourceField.orden,
        id2: targetField.id,
        order2: targetField.orden,
        name1: sourceField.nombre,
        name2: targetField.nombre
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Campos Predefinidos</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Configuración</p>
        </div>
        {!swappingId ? (
          <button
            onClick={() => {
              setIsAdding(true);
              setNewOrder(fields.length + 1);
              setExpandedId(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap border border-emerald-100 dark:border-emerald-800"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        ) : (
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800 animate-pulse flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <ArrowUpDown className="w-3 h-3" />
              Toca otro para mover
            </p>
            <button onClick={() => setSwappingId(null)} className="text-[9px] font-black text-emerald-800 dark:text-emerald-200 uppercase hover:underline">X</button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#0b0b0d] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {fields.map((field) => (
            <div 
              key={field.id}
              onClick={() => {
                if (swappingId) {
                  handleSelectToSwap(field);
                } else if (editingId !== field.id) {
                  setExpandedId(expandedId === field.id ? null : field.id);
                }
              }}
              className={`transition-all duration-200 ${
                swappingId === field.id ? "bg-emerald-50 dark:bg-emerald-900/40" : 
                swappingId ? "hover:bg-emerald-50/50 cursor-pointer" : 
                expandedId === field.id ? "bg-slate-50/30 dark:bg-white/5" :
                "hover:bg-slate-50/30 dark:hover:bg-white/5 cursor-pointer"
              }`}
            >
              <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-[11px] font-black text-slate-400 w-4 text-center">{field.orden}</span>
                  <div className="flex-1">
                    {editingId === field.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-transparent border-b border-emerald-500 font-bold text-slate-900 dark:text-white text-sm focus:outline-none"
                      />
                    ) : (
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{field.nombre}</h4>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {editingId === field.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleUpdate(field.id)} className="p-1 text-emerald-500 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-slate-300 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className={`transition-transform ${expandedId === field.id ? "rotate-45" : ""}`}>
                      <Plus className={`w-4 h-4 text-slate-200 ${expandedId === field.id ? "text-emerald-400" : ""}`} />
                    </div>
                  )}
                </div>
              </div>

              {expandedId === field.id && editingId !== field.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 flex divide-x divide-slate-100 dark:divide-slate-800" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSwappingId(field.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-600">Mover</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(field.id);
                      setEditValue(field.nombre);
                      setEditOrder(field.orden);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600">Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-red-600">Borrar</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="px-3 py-2 bg-emerald-50/10 flex items-center gap-3">
              <span className="text-[10px] font-black text-emerald-500 w-4 text-center">{newOrder}</span>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Nuevo..."
                autoFocus
                className="flex-1 bg-transparent border-b border-emerald-400 font-bold text-slate-900 dark:text-white text-xs focus:outline-none"
              />
              <div className="flex items-center gap-1">
                <button onClick={handleCreate} className="p-1 text-emerald-500">
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-1 text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {fields.length === 0 && !isAdding && (
          <div className="py-8 text-center">
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Sin campos</p>
          </div>
        )}
      </div>
    </div>
  );
}
