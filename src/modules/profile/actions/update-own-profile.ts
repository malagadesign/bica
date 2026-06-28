"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile, updateOwnProfile } from "@/lib/auth/profile";
import type { ProfileActionState } from "./state";

export async function updateOwnProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    const current = await getCurrentProfile();
    if (!current) return { error: "No autorizado", success: null };

    const fullName = (formData.get("fullName") as string)?.trim();
    const whatsapp = (formData.get("whatsapp") as string)?.trim();

    if (!fullName || !whatsapp) {
      return { error: "Completá nombre y WhatsApp.", success: null };
    }

    await updateOwnProfile(current.user.id, {
      full_name: fullName,
      whatsapp,
    });

    revalidatePath("/app/profile");
    revalidatePath("/", "layout");
    return { error: null, success: "Perfil actualizado." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al guardar",
      success: null,
    };
  }
}
