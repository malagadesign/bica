import Image from "next/image";
import { BICA_LOGO, BICA_LOGO_ALT } from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

type BicaMarkProps = {
  className?: string;
  size?: number;
};

export function BicaMark({ className, size = 32 }: BicaMarkProps) {
  return (
    <Image
      src={BICA_LOGO.mark.webp}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

type BicaLogoImageProps = {
  className?: string;
  height?: number;
  priority?: boolean;
};

export function BicaLogoImage({
  className,
  height = 40,
  priority = false,
}: BicaLogoImageProps) {
  const width = Math.round(height * (BICA_LOGO.full.width / BICA_LOGO.full.height));

  return (
    <Image
      src={BICA_LOGO.full.webp}
      alt={BICA_LOGO_ALT}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto max-w-none object-contain", className)}
      style={{ height, width: "auto", maxHeight: height }}
    />
  );
}
