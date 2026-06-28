"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Beaker,
  Search,
  ClipboardList,
  FileText,
  Shield,
  Users,
  UserCircle,
  GitBranch,
  LayoutGrid,
  Scale,
  BookOpen,
  FileWarning,
} from "lucide-react";
import { BicaLogo } from "@/components/brand/bica-logo";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/app/dashboard", label: "Inicio", icon: LayoutDashboard, match: "dashboard" },
  { href: "/app/search", label: "Buscar", icon: Search, match: "search" },
  { href: "/app/lists", label: "Listados", icon: ClipboardList, match: "lists" },
  { href: "/app/documents", label: "Documentos normativos", icon: FileText, match: "documents" },
  { href: "/app/ingredients", label: "Ingredientes regulados", icon: Beaker, match: "ingredients" },
  { href: "/app/rules", label: "Reglas regulatorias", icon: Scale, match: "rules" },
] as const;

const adminItems = [
  { href: "/app/admin/workspace", label: "Workspace editorial", icon: LayoutGrid, match: "admin-workspace" },
  { href: "/app/admin/regulatory-updates", label: "Actualizaciones normativas", icon: GitBranch, match: "admin-regulatory-updates" },
  { href: "/app/admin/ingredients", label: "Fichas regulatorias", icon: BookOpen, match: "admin-ingredients" },
  { href: "/app/admin/rules", label: "Reglas regulatorias", icon: Scale, match: "admin-rules" },
  { href: "/app/admin/documents", label: "Documentos normativos", icon: FileText, match: "admin-documents" },
  { href: "/app/admin/users", label: "Usuarios", icon: Users, match: "admin-users" },
] as const;

type AppSidebarProps = {
  isAdmin?: boolean;
};

function isActive(match: string, pathname: string): boolean {
  switch (match) {
    case "dashboard":
      return pathname === "/app/dashboard";
    case "search":
      return pathname.startsWith("/app/search") && !pathname.startsWith("/app/search/qa");
    case "lists":
      return pathname.startsWith("/app/lists");
    case "documents":
      return pathname.startsWith("/app/documents");
    case "ingredients":
      return pathname.startsWith("/app/ingredients");
    case "rules":
      return pathname.startsWith("/app/rules");
    case "admin-users":
      return pathname.startsWith("/app/admin/users");
    case "admin-workspace":
      return pathname === "/app/admin/workspace";
    case "admin-regulatory-updates":
      return pathname.startsWith("/app/admin/regulatory-updates");
    case "admin-ingredients":
      return pathname.startsWith("/app/admin/ingredients");
    case "admin-rules":
      return pathname.startsWith("/app/admin/rules");
    case "admin-documents":
      return pathname.startsWith("/app/admin/documents");
    case "profile":
      return pathname === "/app/profile";
    default:
      return false;
  }
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href="/app/dashboard" className="transition-opacity hover:opacity-90">
          <BicaLogo variant="sidebar" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
            Explorar
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.match, pathname);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={item.href} />}
                      className={
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      }
                    >
                      <Icon className="size-4 opacity-80" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator className="my-3 bg-sidebar-border" />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                <Shield className="size-3" />
                Administración
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.match, pathname);
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={active}
                          render={<Link href={item.href} />}
                          className={
                            active
                              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                          }
                        >
                          <Icon className="size-4 opacity-80" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator className="my-3 bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
            Cuenta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive("profile", pathname)}
                  render={<Link href="/app/profile" />}
                  className="text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                >
                  <UserCircle className="size-4 opacity-80" />
                  <span>Mi perfil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/legal/disclaimer"}
                  render={<Link href="/legal/disclaimer" />}
                  className="text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                >
                  <FileWarning className="size-4 opacity-80" />
                  <span>Aviso legal</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
