/** Official BICA logo assets (generated in public/brand/). */
export const BICA_LOGO = {
  full: {
    webp: "/brand/bica-logo.webp",
    png: "/brand/bica-logo.png",
    webp2x: "/brand/bica-logo@2x.webp",
    width: 1080,
    height: 358,
  },
  mark: {
    webp: "/brand/bica-mark.webp",
    png: "/brand/bica-mark.png",
    width: 300,
    height: 358,
  },
} as const;

export const BICA_LOGO_ASPECT = BICA_LOGO.full.width / BICA_LOGO.full.height;

export const BICA_LOGO_ALT =
  "BICA — Base de Ingredientes Cosméticos Argentinos";

export const ETERNIA_LOGO = {
  webp: "/brand/eternia-logo.webp",
  png: "/brand/eternia-logo.png",
  webp2x: "/brand/eternia-logo@2x.webp",
  width: 1024,
  height: 1024,
} as const;

export const ETERNIA_LOGO_ALT =
  "Eternia Regulatory & Compliance Consultants";
