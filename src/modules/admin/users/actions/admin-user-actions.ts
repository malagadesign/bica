"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { AccessStatus, UserRole } from "@/lib/auth/profile";
import { listUsersQuery } from "../queries/list-users";
import { updateProfileAsAdmin } from "../queries/update-profile";
import { parseAccessExpiresAt } from "../lib/parse-expiration";
import type { AdminActionState } from "../types";

export async function listUsers() {
  await requireAdminProfile();
  const supabase = await createClient();
  return listUsersQuery(supabase);
}

async function withAdmin<T>(
  fn: (adminId: string, supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>
): Promise<T> {
  const { user } = await requireAdminProfile();
  const supabase = await createClient();
  return fn(user.id, supabase);
}

export async function updateUserAccessStatus(
  userId: string,
  accessStatus: AccessStatus
): Promise<AdminActionState> {
  try {
    await withAdmin(async (adminId, supabase) => {
      await updateProfileAsAdmin(supabase, adminId, userId, {
        access_status: accessStatus,
      });
    });
    revalidatePath("/app/admin/users");
    return { error: null, success: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar estado",
      success: null,
    };
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<AdminActionState> {
  try {
    await withAdmin(async (adminId, supabase) => {
      await updateProfileAsAdmin(supabase, adminId, userId, { role });
    });
    revalidatePath("/app/admin/users");
    return { error: null, success: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar rol",
      success: null,
    };
  }
}

export async function updateUserNotes(
  userId: string,
  notes: string | null
): Promise<AdminActionState> {
  try {
    await withAdmin(async (adminId, supabase) => {
      await updateProfileAsAdmin(supabase, adminId, userId, { notes });
    });
    revalidatePath("/app/admin/users");
    return { error: null, success: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar notas",
      success: null,
    };
  }
}

export async function updateUserWhatsapp(
  userId: string,
  whatsapp: string | null
): Promise<AdminActionState> {
  try {
    await withAdmin(async (adminId, supabase) => {
      await updateProfileAsAdmin(supabase, adminId, userId, { whatsapp });
    });
    revalidatePath("/app/admin/users");
    return { error: null, success: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar WhatsApp",
      success: null,
    };
  }
}

export async function updateUserExpiration(
  userId: string,
  accessExpiresAt: string | null
): Promise<AdminActionState> {
  try {
    await withAdmin(async (adminId, supabase) => {
      await updateProfileAsAdmin(supabase, adminId, userId, {
        access_expires_at: accessExpiresAt,
      });
    });
    revalidatePath("/app/admin/users");
    return { error: null, success: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar vencimiento",
      success: null,
    };
  }
}

export async function updateUserProfile(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const userId = formData.get("userId") as string;
    if (!userId) return { error: "Usuario inválido", success: null };

    await withAdmin(async (adminId, supabase) => {
      await updateProfileAsAdmin(supabase, adminId, userId, {
        full_name: (formData.get("fullName") as string)?.trim() || undefined,
        whatsapp: (formData.get("whatsapp") as string)?.trim() || null,
        role: formData.get("role") as UserRole,
        access_status: formData.get("accessStatus") as AccessStatus,
        access_expires_at: parseAccessExpiresAt(formData.get("accessExpiresAt")),
        notes: ((formData.get("notes") as string) || "").trim() || null,
      });
    });

    revalidatePath("/app/admin/users");
    return { error: null, success: "Usuario actualizado." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar",
      success: null,
    };
  }
}
