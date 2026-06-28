"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessStatus, UserRole } from "@/lib/auth/profile";
import { updateProfileAsAdmin } from "../queries/update-profile";
import { parseAccessExpiresAt } from "../lib/parse-expiration";
import type { AdminActionState } from "../types";

export async function createUserByAdmin(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const { user } = await requireAdminProfile();
    const supabase = await createClient();

    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    const fullName = (formData.get("fullName") as string).trim();
    const whatsapp = (formData.get("whatsapp") as string).trim();
    const role = formData.get("role") as UserRole;
    const accessStatus = formData.get("accessStatus") as AccessStatus;
    const accessExpiresAt = parseAccessExpiresAt(formData.get("accessExpiresAt"));
    const notes = ((formData.get("notes") as string) || "").trim() || null;

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, whatsapp },
    });

    if (error) throw error;
    if (!data.user) throw new Error("No se pudo crear el usuario");

    await updateProfileAsAdmin(supabase, user.id, data.user.id, {
      full_name: fullName,
      whatsapp,
      role,
      access_status: accessStatus,
      access_expires_at: accessExpiresAt,
      notes,
    });

    revalidatePath("/app/admin/users");
    return { error: null, success: "Usuario creado correctamente." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al crear usuario",
      success: null,
    };
  }
}
