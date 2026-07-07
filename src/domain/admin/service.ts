import { AdminActionError, AdminAuthorizationError } from "@/domain/admin/errors";
import type { Json } from "@/lib/supabase/database.types";
import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

export type OwnerAccountStatus =
  Database["public"]["Enums"]["owner_account_status"];
type OwnerRow = Database["public"]["Tables"]["owners"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type PublicPageRow =
  Database["public"]["Tables"]["property_public_pages"]["Row"];

export type AdminOwnerSummary = {
  owner: OwnerRow;
  phone: string | null;
  propertyCount: number;
  roomCount: number;
  bookingCount: number;
  publicPagesDisabled: number;
  isPilotLike: boolean;
};

export type AdminDashboardSummary = {
  totalOwners: number;
  activeOwners: number;
  suspendedOwners: number;
  disabledProperties: number;
  recentPilotOwners: AdminOwnerSummary[];
};

export type AdminOwnerDetail = AdminOwnerSummary & {
  properties: Array<{
    property: PropertyRow;
    publicPage: PublicPageRow | null;
    roomCount: number;
    bookingCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
};

type AdminActionInput = {
  actorAdminId: string;
  targetOwnerId?: string | null;
  targetPropertyId?: string | null;
  action: string;
  reason?: string | null;
  metadata?: Json;
};

function nowIso() {
  return new Date().toISOString();
}

function safeReason(reason?: string | null) {
  const value = reason?.trim();
  return value ? value.slice(0, 500) : null;
}

function isPilotLikeOwner(owner: OwnerRow, properties: PropertyRow[]) {
  const text = [
    owner.email ?? "",
    ...properties.flatMap((property) => [property.name, property.slug])
  ]
    .join(" ")
    .toLowerCase();

  return owner.is_demo || /\b(demo|test|pilot)\b/.test(text);
}

function isDemoTarget(owner: OwnerRow | null, property: PropertyRow | null) {
  if (!owner || !property) return false;
  return isPilotLikeOwner(owner, [property]);
}

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length;
}

async function selectAll<T>(supabase: AppSupabaseClient, table: string) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return (data ?? []) as T[];
}

async function auditAdminAction(
  supabase: AppSupabaseClient,
  input: AdminActionInput
) {
  const { error } = await supabase.from("platform_admin_audit_logs").insert({
    actor_admin_id: input.actorAdminId,
    target_owner_id: input.targetOwnerId ?? null,
    target_property_id: input.targetPropertyId ?? null,
    action: input.action,
    reason: safeReason(input.reason),
    metadata: input.metadata ?? {}
  });

  if (error) throw error;
}

export class PlatformAdminService {
  constructor(private supabase: AppSupabaseClient) {}

  async isPlatformAdmin(userId: string) {
    const { data, error } = await this.supabase
      .from("platform_admins")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async requirePlatformAdmin(userId: string) {
    if (!(await this.isPlatformAdmin(userId))) {
      throw new AdminAuthorizationError();
    }
    return userId;
  }

  async getOwnerAccountStatus(ownerId: string): Promise<OwnerAccountStatus> {
    const { data, error } = await this.supabase
      .from("owners")
      .select("account_status")
      .eq("id", ownerId)
      .maybeSingle();

    if (error) throw error;
    return ((data as { account_status?: OwnerAccountStatus } | null)
      ?.account_status ?? "active");
  }

  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const summaries = await this.listOwners();
    const properties = await selectAll<PropertyRow>(this.supabase, "properties");

    return {
      totalOwners: summaries.length,
      activeOwners: countBy(
        summaries,
        (summary) => summary.owner.account_status === "active"
      ),
      suspendedOwners: countBy(
        summaries,
        (summary) => summary.owner.account_status === "suspended"
      ),
      disabledProperties: countBy(
        properties,
        (property) => property.status === "disabled"
      ),
      recentPilotOwners: summaries
        .filter((summary) => summary.isPilotLike)
        .sort((a, b) => b.owner.created_at.localeCompare(a.owner.created_at))
        .slice(0, 5)
    };
  }

  async listOwners(): Promise<AdminOwnerSummary[]> {
    const [owners, properties, rooms, bookings, publicPages] = await Promise.all([
      selectAll<OwnerRow>(this.supabase, "owners"),
      selectAll<PropertyRow>(this.supabase, "properties"),
      selectAll<{ owner_id: string }>(this.supabase, "rooms"),
      selectAll<{ owner_id: string; deleted_at: string | null }>(
        this.supabase,
        "bookings"
      ),
      selectAll<PublicPageRow>(this.supabase, "property_public_pages")
    ]);

    return owners
      .map((owner) => {
        const ownerProperties = properties.filter(
          (property) => property.owner_id === owner.id
        );
        return {
          owner,
          phone: ownerProperties[0]?.contact_phone ?? null,
          propertyCount: ownerProperties.length,
          roomCount: countBy(rooms, (room) => room.owner_id === owner.id),
          bookingCount: countBy(
            bookings,
            (booking) => booking.owner_id === owner.id && !booking.deleted_at
          ),
          publicPagesDisabled: countBy(
            publicPages,
            (page) =>
              page.owner_id === owner.id && (!page.is_public || !page.chat_enabled)
          ),
          isPilotLike: isPilotLikeOwner(owner, ownerProperties)
        };
      })
      .sort((a, b) => b.owner.created_at.localeCompare(a.owner.created_at));
  }

  async getOwnerDetail(ownerId: string): Promise<AdminOwnerDetail | null> {
    const summaries = await this.listOwners();
    const summary = summaries.find((item) => item.owner.id === ownerId);
    if (!summary) return null;

    const [properties, publicPages, rooms, bookings, notifications, audits] =
      await Promise.all([
        selectAll<PropertyRow>(this.supabase, "properties"),
        selectAll<PublicPageRow>(this.supabase, "property_public_pages"),
        selectAll<{ property_id: string }>(this.supabase, "rooms"),
        selectAll<{ property_id: string; deleted_at: string | null }>(
          this.supabase,
          "bookings"
        ),
        selectAll<{ id: string; title: string; owner_id: string; created_at: string }>(
          this.supabase,
          "owner_notifications"
        ),
        selectAll<{
          id: string;
          action: string;
          target_owner_id: string | null;
          created_at: string;
        }>(this.supabase, "platform_admin_audit_logs")
      ]);

    const ownerProperties = properties.filter(
      (property) => property.owner_id === ownerId
    );

    return {
      ...summary,
      properties: ownerProperties.map((property) => ({
        property,
        publicPage:
          publicPages.find((page) => page.property_id === property.id) ?? null,
        roomCount: countBy(rooms, (room) => room.property_id === property.id),
        bookingCount: countBy(
          bookings,
          (booking) => booking.property_id === property.id && !booking.deleted_at
        )
      })),
      recentActivity: [
        ...notifications
          .filter((notification) => notification.owner_id === ownerId)
          .map((notification) => ({
            id: notification.id,
            title: notification.title,
            created_at: notification.created_at
          })),
        ...audits
          .filter((audit) => audit.target_owner_id === ownerId)
          .map((audit) => ({
            id: audit.id,
            title: `Acțiune admin: ${audit.action}`,
            created_at: audit.created_at
          }))
      ]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8)
    };
  }

  async setOwnerStatus(input: {
    actorAdminId: string;
    targetOwnerId: string;
    status: OwnerAccountStatus;
    reason?: string | null;
  }) {
    await this.requirePlatformAdmin(input.actorAdminId);

    const { error } = await this.supabase
      .from("owners")
      .update({ account_status: input.status })
      .eq("id", input.targetOwnerId);

    if (error) {
      throw new AdminActionError("Nu am putut actualiza contul proprietarului.");
    }

    await auditAdminAction(this.supabase, {
      actorAdminId: input.actorAdminId,
      targetOwnerId: input.targetOwnerId,
      action: `owner_${input.status}`,
      reason: input.reason,
      metadata: { status: input.status }
    });
  }

  async disableProperty(input: {
    actorAdminId: string;
    propertyId: string;
    reason?: string | null;
  }) {
    await this.requirePlatformAdmin(input.actorAdminId);

    const { data: property, error: propertyError } = await this.supabase
      .from("properties")
      .select("*")
      .eq("id", input.propertyId)
      .maybeSingle();

    if (propertyError || !property) {
      throw new AdminActionError("Proprietatea nu a fost găsită.");
    }

    const [{ error: pageError }, { error: statusError }] = await Promise.all([
      this.supabase
        .from("property_public_pages")
        .update({ is_public: false, chat_enabled: false })
        .eq("property_id", input.propertyId),
      this.supabase
        .from("properties")
        .update({ status: "disabled" })
        .eq("id", input.propertyId)
    ]);

    if (pageError || statusError) {
      throw new AdminActionError("Nu am putut dezactiva pagina publică.");
    }

    await auditAdminAction(this.supabase, {
      actorAdminId: input.actorAdminId,
      targetOwnerId: property.owner_id,
      targetPropertyId: input.propertyId,
      action: "property_public_page_disabled",
      reason: input.reason
    });
  }

  async resetDemoData(input: {
    actorAdminId: string;
    ownerId: string;
    propertyId: string;
    confirmation: string;
    reason?: string | null;
  }) {
    await this.requirePlatformAdmin(input.actorAdminId);

    if (input.confirmation !== "RESET") {
      throw new AdminActionError("Scrie RESET pentru a confirma acțiunea.");
    }

    const [{ data: owner }, { data: property }] = await Promise.all([
      this.supabase.from("owners").select("*").eq("id", input.ownerId).maybeSingle(),
      this.supabase
        .from("properties")
        .select("*")
        .eq("id", input.propertyId)
        .eq("owner_id", input.ownerId)
        .maybeSingle()
    ]);

    if (!isDemoTarget(owner as OwnerRow | null, property as PropertyRow | null)) {
      throw new AdminActionError(
        "Resetarea demo este permisă doar pentru conturi sau proprietăți demo/test."
      );
    }

    const deletedAt = nowIso();
    const [bookings, conversations, notifications] = await Promise.all([
      this.supabase
        .from("bookings")
        .update({ deleted_at: deletedAt, status: "cancelled" })
        .eq("owner_id", input.ownerId)
        .eq("property_id", input.propertyId),
      this.supabase
        .from("conversations")
        .update({ deleted_at: deletedAt, status: "closed", closed_at: deletedAt })
        .eq("owner_id", input.ownerId)
        .eq("property_id", input.propertyId),
      this.supabase
        .from("owner_notifications")
        .update({ status: "read", read_at: deletedAt, resolved_at: deletedAt })
        .eq("owner_id", input.ownerId)
        .eq("property_id", input.propertyId)
    ]);

    if (bookings.error || conversations.error || notifications.error) {
      throw new AdminActionError("Nu am putut reseta datele demo.");
    }

    await auditAdminAction(this.supabase, {
      actorAdminId: input.actorAdminId,
      targetOwnerId: input.ownerId,
      targetPropertyId: input.propertyId,
      action: "demo_data_reset",
      reason: input.reason,
      metadata: {
        bookings: "soft_deleted",
        conversations: "soft_deleted",
        notifications: "resolved"
      }
    });
  }
}
