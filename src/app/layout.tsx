import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BICA — Base de Ingredientes Cosméticos Argentinos",
    template: "%s · BICA",
  },
  description:
    "Plataforma regulatoria para consulta de ingredientes cosméticos, restricciones y normativa Argentina / MERCOSUR.",
  applicationName: "BICA",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "BICA — Base de Ingredientes Cosméticos Argentinos",
    description:
      "Consultá ingredientes cosméticos, restricciones y documentos normativos con trazabilidad oficial.",
    siteName: "BICA",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/brand/bica-logo.png", width: 540, height: 179, alt: "BICA" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A5C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${hankenGrotesk.variable} ${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} min-h-screen font-sans antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
