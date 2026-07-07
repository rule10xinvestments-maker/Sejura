import { notFound } from "next/navigation";
import { PlatformAdminService } from "@/domain/admin/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function getAdminContext() {
  const authClient = createSupabaseServerClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  if (!user) {
    notFound();
  }

  const service = new PlatformAdminService(createSupabaseServiceRoleClient());
  if (!(await service.isPlatformAdmin(user.id))) {
    notFound();
  }

  return {
    adminId: user.id,
    service
  };
}

export function adminActionMessage(code?: string) {
  if (code === "owner-suspended") return "Cont suspendat. Acțiune auditată.";
  if (code === "owner-reactivated") return "Cont reactivat. Acțiune auditată.";
  if (code === "owner-deletion-requested") {
    return "Cont marcat pentru ștergere. Acțiune auditată.";
  }
  if (code === "property-disabled") {
    return "Pagina publică a fost dezactivată. Acțiune auditată.";
  }
  if (code === "demo-reset") return "Datele demo au fost resetate. Acțiune auditată.";
  if (code === "error") return "Acțiunea nu a putut fi finalizată.";
  return null;
}
