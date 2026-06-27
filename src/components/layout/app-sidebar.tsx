"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  Search,
  Upload,
  Settings,
  Beaker,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  {
    href: "/app/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    href: "/app/ingredients",
    label: "Ingredientes",
    icon: Beaker,
    enabled: true,
  },
  {
    href: "/app/rules",
    label: "Reglas",
    icon: ListChecks,
    enabled: true,
  },
  {
    href: "#",
    label: "Búsqueda",
    icon: Search,
    enabled: false,
  },
  {
    href: "#",
    label: "Importaciones",
    icon: Upload,
    enabled: false,
  },
  {
    href: "#",
    label: "Administración",
    icon: Settings,
    enabled: false,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FlaskConical className="size-5 text-sidebar-primary" />
          <span>Cosing AR</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.enabled &&
                  (pathname === item.href ||
                    (item.href !== "/app/dashboard" &&
                      pathname.startsWith(item.href)));

                return (
                  <SidebarMenuItem key={item.label}>
                    {item.enabled ? (
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        disabled
                        className="opacity-50"
                        tooltip="Próximamente"
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
