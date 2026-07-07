import type {
  DepartamentoRecord,
  NodoOrganizacion,
  PuestoRecord,
} from "./zod";
import { buscarNodoPorId } from "./zod";

export const ESTRUCTURA_SIMULADA: NodoOrganizacion = {
  id: "sim-raiz",
  nombre: "Construmax Materiales",
  tipo: "raiz",
  descripcion:
    "Distribuidora y venta de materiales de construcción, acabados y ferretería industrial.",
  hijos: [
    {
      id: "sim-dep-corporativo",
      nombre: "Dirección General",
      tipo: "nivel",
      descripcion: "Administración central y gobierno corporativo.",
      hijos: [
        {
          id: "sim-puesto-gerente",
          nombre: "Gerente General",
          tipo: "unidad",
          tiene_jefaturas: true,
          titular: "Roberto Castillo",
          hijos: [
            {
              id: "sim-p-asistente",
              nombre: "Asistente Administrativo",
              tipo: "unidad",
              titular: "María López",
            },
            {
              id: "sim-p-asesor-legal",
              nombre: "Asesor Legal",
              tipo: "unidad",
            },
            {
              id: "sim-p-contador",
              nombre: "Contador General",
              tipo: "unidad",
              titular: "Carlos Méndez",
            },
          ],
        },
      ],
    },
    {
      id: "sim-dep-ventas",
      nombre: "Ventas y Comercialización",
      tipo: "nivel",
      descripcion: "Fuerza de ventas, cotizaciones y atención a clientes.",
      hijos: [
        {
          id: "sim-p-jefe-ventas",
          nombre: "Jefe de Ventas",
          tipo: "unidad",
          tiene_jefaturas: true,
          titular: "Ana Torres",
          hijos: [
            {
              id: "sim-p-vendedor-1",
              nombre: "Vendedor de Mostrador I",
              tipo: "unidad",
              titular: "Diego Herrera",
            },
            {
              id: "sim-p-vendedor-2",
              nombre: "Vendedor de Mostrador II",
              tipo: "unidad",
              titular: "Laura Vega",
            },
            {
              id: "sim-p-cotizador",
              nombre: "Cotizador de Proyectos",
              tipo: "unidad",
            },
            {
              id: "sim-p-atencion",
              nombre: "Atención al Cliente",
              tipo: "unidad",
              titular: "Sofía Ramírez",
            },
          ],
        },
        {
          id: "sim-dep-ventas-ext",
          nombre: "Ventas Externas",
          tipo: "nivel",
          descripcion: "Visitas a obra, contratistas y constructoras.",
          hijos: [
            {
              id: "sim-p-coord-ext",
              nombre: "Coordinador de Ventas Externas",
              tipo: "unidad",
              tiene_jefaturas: true,
              titular: "Jorge Pineda",
              hijos: [
                {
                  id: "sim-p-ejecutivo-1",
                  nombre: "Ejecutivo de Ventas I",
                  tipo: "unidad",
                  titular: "Valeria Cruz",
                },
                {
                  id: "sim-p-ejecutivo-2",
                  nombre: "Ejecutivo de Ventas II",
                  tipo: "unidad",
                },
                {
                  id: "sim-p-promotor",
                  nombre: "Promotor de Obra",
                  tipo: "unidad",
                  titular: "Miguel Álvarez",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "sim-dep-bodega",
      nombre: "Bodega e Inventarios",
      tipo: "nivel",
      descripcion: "Recepción, almacenamiento y control de existencias.",
      hijos: [
        {
          id: "sim-p-jefe-bodega",
          nombre: "Jefe de Bodega",
          tipo: "unidad",
          tiene_jefaturas: true,
          titular: "Pedro Gómez",
          hijos: [
            {
              id: "sim-p-almacenista-1",
              nombre: "Almacenista I",
              tipo: "unidad",
              titular: "Gabriela Flores",
            },
            {
              id: "sim-p-almacenista-2",
              nombre: "Almacenista II",
              tipo: "unidad",
            },
            {
              id: "sim-p-control-inv",
              nombre: "Control de Inventarios",
              tipo: "unidad",
              titular: "Ricardo Méndez",
            },
            {
              id: "sim-p-montacargas",
              nombre: "Operador de Montacargas",
              tipo: "unidad",
            },
          ],
        },
        {
          id: "sim-dep-cemento",
          nombre: "Área de Cemento y Agregados",
          tipo: "nivel",
          descripcion: "Cemento, arena, grava y mezclas.",
          hijos: [
            {
              id: "sim-p-responsable-cemento",
              nombre: "Responsable de Cemento",
              tipo: "unidad",
              tiene_jefaturas: true,
              titular: "Andrés Morales",
              hijos: [
                {
                  id: "sim-p-despachador",
                  nombre: "Despachador de Materiales",
                  tipo: "unidad",
                },
                {
                  id: "sim-p-pesador",
                  nombre: "Pesador de Agregados",
                  tipo: "unidad",
                  titular: "Camila Ortega",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "sim-dep-logistica",
      nombre: "Logística y Distribución",
      tipo: "nivel",
      descripcion: "Entregas a obra, rutas y flota de transporte.",
      hijos: [
        {
          id: "sim-p-jefe-logistica",
          nombre: "Jefe de Logística",
          tipo: "unidad",
          tiene_jefaturas: true,
          titular: "Elena Ramírez",
          hijos: [
            {
              id: "sim-p-despacho",
              nombre: "Coordinador de Despacho",
              tipo: "unidad",
              titular: "Patricia Ruiz",
            },
            {
              id: "sim-p-rutas",
              nombre: "Planificador de Rutas",
              tipo: "unidad",
            },
            {
              id: "sim-p-chofer-1",
              nombre: "Chofer Repartidor I",
              tipo: "unidad",
              titular: "Héctor Vásquez",
            },
            {
              id: "sim-p-chofer-2",
              nombre: "Chofer Repartidor II",
              tipo: "unidad",
            },
          ],
        },
      ],
    },
    {
      id: "sim-dep-compras",
      nombre: "Compras y Proveedores",
      tipo: "nivel",
      descripcion: "Abastecimiento, negociación y relación con proveedores.",
      hijos: [
        {
          id: "sim-p-jefe-compras",
          nombre: "Jefe de Compras",
          tipo: "unidad",
          tiene_jefaturas: true,
          titular: "Fernando Silva",
          hijos: [
            {
              id: "sim-p-comprador-1",
              nombre: "Comprador de Ferretería",
              tipo: "unidad",
              titular: "Daniela Cruz",
            },
            {
              id: "sim-p-comprador-2",
              nombre: "Comprador de Acabados",
              tipo: "unidad",
            },
            {
              id: "sim-p-proveedores",
              nombre: "Analista de Proveedores",
              tipo: "unidad",
              titular: "Luis Hernández",
            },
          ],
        },
      ],
    },
    {
      id: "sim-dep-sucursales",
      nombre: "Sucursales",
      tipo: "nivel",
      descripcion: "Operación de puntos de venta regionales.",
      hijos: [
        {
          id: "sim-p-coord-sucursales",
          nombre: "Coordinador de Sucursales",
          tipo: "unidad",
          tiene_jefaturas: true,
          titular: "Beatriz Mendoza",
          hijos: [
            {
              id: "sim-dep-suc-norte",
              nombre: "Sucursal Norte",
              tipo: "nivel",
              descripcion: "Punto de venta zona norte.",
              hijos: [
                {
                  id: "sim-p-encargado-norte",
                  nombre: "Encargado de Sucursal",
                  tipo: "unidad",
                  tiene_jefaturas: true,
                  titular: "Oscar Jiménez",
                  hijos: [
                    {
                      id: "sim-p-vendedor-norte",
                      nombre: "Vendedor de Mostrador",
                      tipo: "unidad",
                    },
                    {
                      id: "sim-p-cajero-norte",
                      nombre: "Cajero",
                      tipo: "unidad",
                      titular: "Natalia Reyes",
                    },
                  ],
                },
              ],
            },
            {
              id: "sim-dep-suc-sur",
              nombre: "Sucursal Sur",
              tipo: "nivel",
              descripcion: "Punto de venta zona sur.",
              hijos: [
                {
                  id: "sim-p-encargado-sur",
                  nombre: "Encargado de Sucursal",
                  tipo: "unidad",
                  tiene_jefaturas: true,
                  titular: "Marco Delgado",
                  hijos: [
                    {
                      id: "sim-p-vendedor-sur",
                      nombre: "Vendedor de Mostrador",
                      tipo: "unidad",
                      titular: "Isabel Morán",
                    },
                    {
                      id: "sim-p-bodeguero-sur",
                      nombre: "Bodeguero",
                      tipo: "unidad",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const DEMO_GUARDAR_MENSAJE =
  "Modo demo: los cambios no se guardan.";

function buscarContextoNodo(
  raiz: NodoOrganizacion,
  id: string,
  padre: NodoOrganizacion | null = null,
): { nodo: NodoOrganizacion; padre: NodoOrganizacion | null } | null {
  if (raiz.id === id) return { nodo: raiz, padre };
  for (const hijo of raiz.hijos ?? []) {
    const encontrado = buscarContextoNodo(hijo, id, raiz);
    if (encontrado) return encontrado;
  }
  return null;
}

function departamentoPadreId(
  raiz: NodoOrganizacion,
  id: string,
): string | null {
  const ctx = buscarContextoNodo(raiz, id);
  if (!ctx?.padre || ctx.padre.tipo === "raiz") return null;
  if (ctx.padre.tipo === "nivel") return ctx.padre.id;
  return departamentoPadreId(raiz, ctx.padre.id);
}

function departamentoContenedorId(
  raiz: NodoOrganizacion,
  id: string,
): string | null {
  const ctx = buscarContextoNodo(raiz, id);
  if (!ctx) return null;
  if (ctx.nodo.tipo === "nivel") return ctx.nodo.id;
  let actual: NodoOrganizacion | null = ctx.padre;
  while (actual) {
    if (actual.tipo === "nivel") return actual.id;
    const prev = buscarContextoNodo(raiz, actual.id);
    actual = prev?.padre ?? null;
  }
  return null;
}

export function departamentoDemoDesdeId(
  id: string,
  estructura: NodoOrganizacion = ESTRUCTURA_SIMULADA,
): DepartamentoRecord | null {
  const nodo = buscarNodoPorId(estructura, id);
  if (!nodo || nodo.tipo !== "nivel") return null;
  return {
    id: nodo.id,
    nombre: nodo.nombre,
    parent_id: departamentoPadreId(estructura, id),
    descripcion: nodo.descripcion ?? null,
    orden: 0,
    activo: true,
  };
}

export function puestoDemoDesdeId(
  id: string,
  estructura: NodoOrganizacion = ESTRUCTURA_SIMULADA,
): PuestoRecord | null {
  const nodo = buscarNodoPorId(estructura, id);
  if (!nodo || nodo.tipo !== "unidad") return null;
  return {
    id: nodo.id,
    nombre: nodo.nombre,
    departamento_id: departamentoContenedorId(estructura, id),
    jefatura_ids: nodo.tiene_jefaturas ? [] : [],
    jefaturas_nombres: [],
    orden: 0,
    activo: true,
  };
}

export function nodoDemoTieneHijos(
  id: string,
  estructura: NodoOrganizacion = ESTRUCTURA_SIMULADA,
): boolean {
  const nodo = buscarNodoPorId(estructura, id);
  return Boolean(nodo?.hijos && nodo.hijos.length > 0);
}
