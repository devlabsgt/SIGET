import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getManageableRoles } from "./permissions";

export function useUsers(actorRole?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["users-list", actorRole],
    queryFn: async () => {
      if (!actorRole || getManageableRoles(actorRole).length === 0) {
        return [];
      }

      let query = supabase
        .from("profiles")
        .select("id, nombre, rol")
        .order("nombre", { ascending: true });

      if (actorRole === "super") {
        // todos
      } else if (actorRole === "admin") {
        query = query.neq("rol", "super");
      } else if (actorRole === "admin-observatorio") {
        query = query.in("rol", getManageableRoles(actorRole));
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!actorRole && getManageableRoles(actorRole).length > 0,
  });
}
