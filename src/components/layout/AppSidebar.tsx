import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { NAV, type NavItem } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { useBadges } from "@/lib/agents";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const badges = useBadges();
  const cmOpen = useStore((s) => s.settings.sidebarCMOpen);
  const updateSettings = useStore((s) => s.updateSettings);
  const [agentsOpen, setAgentsOpen] = useState(() => true);

  const openState: Record<string, boolean> = { "/agents": agentsOpen, "/agents/cm": cmOpen };
  const toggle = (to: string) => {
    if (to === "/agents") setAgentsOpen((o) => !o);
    if (to === "/agents/cm") updateSettings({ sidebarCMOpen: !cmOpen });
  };

  const renderItem = (item: NavItem, depth = 0) => {
    const active = pathname === item.to || (item.to !== "/agents" && pathname.startsWith(item.to + "/")) || (item.to === "/agents/cm" && pathname.startsWith("/agents/cm"));
    const exactActive = pathname === item.to;
    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
    const Icon = item.icon;

    if (item.children) {
      const open = openState[item.to] ?? true;
      const anyChildActive = pathname.startsWith(item.to);
      const btn = (
        <button type="button" onClick={() => (collapsed ? setCollapsed(false) : toggle(item.to))} className={cn("group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13px] transition-colors", anyChildActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", depth > 0 && "pl-2")}
          style={{ marginLeft: depth * 12 }}>
          <Icon className={cn("h-4 w-4 shrink-0", anyChildActive && "text-gold")} />
          {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
          {!collapsed && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />}
        </button>
      );
      return (
        <div key={item.to}>
          {btn}
          {!collapsed && open && <div className="mt-0.5 space-y-0.5">{item.children.map((c) => renderItem(c, depth + 1))}</div>}
        </div>
      );
    }

    const link = (
      <Link key={item.to} to={item.to} className={cn("group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] transition-colors", exactActive || active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}
        style={{ marginLeft: collapsed ? 0 : depth * 12 }}>
        {(exactActive || active) && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-gold" />}
        <Icon className={cn("h-4 w-4 shrink-0", (exactActive || active) && "text-gold")} />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {badge > 0 && (
          <span className={cn("flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-gold-foreground", collapsed && "absolute -right-0.5 -top-0.5")}>{badge}</span>
        )}
      </Link>
    );
    if (collapsed) {
      return (
        <Tooltip key={item.to}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{item.label}</TooltipContent></Tooltip>
      );
    }
    return link;
  };

  return (
    <aside className={cn("print-hidden sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex", collapsed ? "w-16" : "w-64")}>
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <Link to="/dashboard"><Logo compact={collapsed} /></Link>
      </div>
      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">
        {NAV.map((i) => renderItem(i))}
      </nav>
      <div className="border-t border-sidebar-border p-2.5">
        <button type="button" onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Réduire</>}
        </button>
      </div>
    </aside>
  );
}

/** Mobile drawer content reuses the same navigation. */
export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const flat = (items: NavItem[], depth = 0): { item: NavItem; depth: number }[] => items.flatMap((i) => (i.children ? [{ item: i, depth }, ...flat(i.children, depth + 1)] : [{ item: i, depth }]));
  return (
    <nav className="space-y-0.5 p-3">
      {flat(NAV).map(({ item, depth }) => {
        const Icon = item.icon;
        if (item.children) return <div key={item.to} className="px-2.5 pt-3 pb-1 text-[11px] uppercase tracking-wider text-sidebar-foreground/60" style={{ marginLeft: depth * 12 }}>{item.label}</div>;
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link key={item.to} to={item.to} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-md px-2.5 py-2 text-sm", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground")} style={{ marginLeft: depth * 12 }}>
            <Icon className={cn("h-4 w-4", active && "text-gold")} />{item.label}
          </Link>
        );
      })}
    </nav>
  );
}
