"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: {
  value: ThemeChoice;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "system",
    label: "Sistema",
    description: "Usa la preferencia de tu dispositivo",
    icon: Monitor,
  },
  {
    value: "light",
    label: "Claro",
    description: "Fondo claro para lectura diurna",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Oscuro",
    description: "Fondo oscuro para uso prolongado",
    icon: Moon,
  },
];

type ThemeSelectorProps = {
  variant?: "compact" | "panel";
  className?: string;
};

export function ThemeSelector({ variant = "compact", className }: ThemeSelectorProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "compact" ? "size-8 rounded-lg bg-muted/40" : "h-24 rounded-xl bg-muted/40",
          className
        )}
        aria-hidden
      />
    );
  }

  const active = (theme ?? "system") as ThemeChoice;

  if (variant === "panel") {
    return (
      <section className={cn("space-y-4", className)}>
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Apariencia</h2>
          <p className="text-sm text-muted-foreground">
            Elegí claro u oscuro para el panel principal. El menú lateral
            mantiene el estilo institucional oscuro de BICA.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = active === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 bg-card hover:border-border hover:bg-accent/20"
                )}
                aria-pressed={selected}
              >
                <Icon
                  className={cn(
                    "size-5",
                    selected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Modo activo:{" "}
          <span className="font-medium text-foreground">
            {active === "system"
              ? `Sistema (${resolvedTheme === "dark" ? "oscuro" : "claro"})`
              : active === "dark"
                ? "Oscuro"
                : "Claro"}
          </span>
        </p>
      </section>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5",
        className
      )}
      role="group"
      aria-label="Apariencia"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = active === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(option.value)}
            className={cn(
              "size-7 rounded-md",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={option.label}
            aria-pressed={selected}
            title={option.label}
          >
            <Icon className="size-3.5" />
          </Button>
        );
      })}
    </div>
  );
}
