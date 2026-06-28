"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isPublicRegistrationEnabled } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
};

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/app/dashboard";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        last_login_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function register(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isPublicRegistrationEnabled()) {
    return { error: "El acceso se gestiona por invitación." };
  }

  const supabase = await createClient();

  const fullName = (formData.get("fullName") as string)?.trim();
  const whatsapp = (formData.get("whatsapp") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!fullName || !whatsapp || !email || !password) {
    return { error: "Completá todos los campos." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        whatsapp,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        whatsapp,
        access_status: "pending",
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/access-disabled");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
