import { BicaLogoImage } from "./bica-mark";
import { cn } from "@/lib/utils";

type BicaLogoProps = {
  className?: string;
  height?: number;
  showDescriptor?: boolean;
  variant?: "default" | "sidebar" | "inverse";
  priority?: boolean;
  align?: "start" | "center";
};

const HEIGHT_BY_VARIANT = {
  default: 44,
  sidebar: 36,
  inverse: 48,
} as const;

export function BicaLogo({
  className,
  height,
  showDescriptor = false,
  variant = "default",
  priority = false,
  align = "center",
}: BicaLogoProps) {
  const logoHeight = height ?? HEIGHT_BY_VARIANT[variant];
  const isInverse = variant === "sidebar" || variant === "inverse";

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "start" ? "items-start text-left" : "items-center text-center",
        className
      )}
    >
      <BicaLogoImage height={logoHeight} priority={priority} />
      {showDescriptor && (
        <span
          className={cn(
            "max-w-xs text-[0.7rem] font-normal leading-snug tracking-normal",
            isInverse ? "text-primary-foreground/75" : "text-muted-foreground"
          )}
        >
          Base de Ingredientes Cosméticos Argentinos
        </span>
      )}
    </div>
  );
}
