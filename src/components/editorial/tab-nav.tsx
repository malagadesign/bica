"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string; count?: number };

type EditorialTabNavProps = {
  tabs: Tab[];
  basePath: string;
};

export function EditorialTabNav({ tabs, basePath }: EditorialTabNavProps) {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? tabs[0]?.id;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-[var(--bica-border)]">
      {tabs.map((tab) => {
        const href = `${basePath}?tab=${tab.id}`;
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  isActive
                    ? "bg-[var(--badge-info-bg)] text-[var(--badge-info-text)]"
                    : "bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]"
                )}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
