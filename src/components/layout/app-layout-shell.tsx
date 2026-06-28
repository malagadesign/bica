"use client";

import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppDisclaimerFooter } from "@/components/legal/app-disclaimer-footer";

type AppLayoutShellProps = {
  children: React.ReactNode;
  isAdmin?: boolean;
};

export function AppLayoutShell({ children, isAdmin = false }: AppLayoutShellProps) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar isAdmin={isAdmin} />
      </Suspense>
      <SidebarInset className="flex min-h-screen flex-col bg-background text-foreground">
        {children}
        <AppDisclaimerFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
