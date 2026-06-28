"use client";

import { useActionState, useState } from "react";
import {
  profileActionInitial,
  updateOwnProfileAction,
} from "@/modules/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  fullName: string;
  whatsapp: string;
  email: string;
};

export function ProfileForm({ fullName, whatsapp, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateOwnProfileAction,
    profileActionInitial
  );
  const [fullNameValue, setFullNameValue] = useState(fullName);
  const [whatsappValue, setWhatsappValue] = useState(whatsapp);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="bg-muted/40" />
        <p className="text-xs text-muted-foreground">
          El email no se puede cambiar desde aquí.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          name="fullName"
          value={fullNameValue}
          onChange={(e) => setFullNameValue(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          value={whatsappValue}
          onChange={(e) => setWhatsappValue(e.target.value)}
          required
          autoComplete="tel"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="bica-form-success">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
