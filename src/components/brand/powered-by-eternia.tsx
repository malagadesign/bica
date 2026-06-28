import Image from "next/image";
import { ETERNIA_LOGO, ETERNIA_LOGO_ALT } from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

type PoweredByEterniaProps = {
  className?: string;
  height?: number;
  align?: "start" | "center" | "end";
};

export function PoweredByEternia({
  className,
  height = 56,
  align = "center",
}: PoweredByEterniaProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "end"
          ? "items-end text-right"
          : align === "start"
            ? "items-start text-left"
            : "items-center text-center",
        className
      )}
    >
      <span className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Powered by
      </span>
      <Image
        src={ETERNIA_LOGO.webp}
        alt={ETERNIA_LOGO_ALT}
        width={height}
        height={height}
        className="h-auto w-auto object-contain opacity-90 transition-opacity hover:opacity-100"
        style={{ height, width: "auto", maxHeight: height }}
      />
    </div>
  );
}
