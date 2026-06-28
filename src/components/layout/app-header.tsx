"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogoutButton } from "@/components/auth/logout-button";
import { HeaderSearch } from "@/components/search/header-search";
import { ThemeSelector } from "@/components/layout/theme-selector";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title?: string;
  userEmail?: string | null;
};

function UserAvatar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();
  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      title={email}
    >
      {initial}
    </div>
  );
}

export function AppHeader({ title = "Inicio", userEmail }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6",
        "bg-[var(--header-bg)] border-[var(--header-border)]"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground hover:text-foreground" />
        <span className="truncate text-sm font-semibold tracking-tight text-foreground">
          {title}
        </span>
      </div>
      <HeaderSearch />
      <div className="flex shrink-0 items-center gap-3">
        <ThemeSelector variant="compact" />
        {userEmail && (
          <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground lg:inline">
            {userEmail}
          </span>
        )}
        {userEmail && <UserAvatar email={userEmail} />}
        <LogoutButton />
      </div>
    </header>
  );
}
