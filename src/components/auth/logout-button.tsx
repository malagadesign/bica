"use client";

import { logout } from "@/app/(auth)/actions";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type LogoutButtonProps = {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
};

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
}: LogoutButtonProps) {
  return (
    <form action={logout} className={cn(className)}>
      <Button type="submit" variant={variant} size={size} className="w-full">
        Salir
      </Button>
    </form>
  );
}
