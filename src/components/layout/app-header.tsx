"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogoutButton } from "@/components/auth/logout-button";

type AppHeaderProps = {
  title?: string;
  userEmail?: string | null;
};

export function AppHeader({ title = "Dashboard", userEmail }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userEmail}
          </span>
        )}
        <LogoutButton />
      </div>
    </header>
  );
}
