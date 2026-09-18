import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronRight, LogOut, Menu, Moon, Search, Settings, Sun, User, Users, Target, Package, FileText, ShoppingCart, FlaskConical, CalendarDays, Check } from "lucide-react";
import { toast } from "sonner";
import { useStore, fmtDateTime } from "@/lib/store";
import { ROUTE_LABELS } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "./AppSidebar";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const s = useStore();
  const profile = s.settings.profile;
  const unread = s.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((p, i) => {
      const path = "/" + parts.slice(0, i + 1).join("/");
      let label = ROUTE_LABELS[p];
      if (!label) {
        const prev = parts[i - 1];
        const ent = prev === "clients" ? s.clients.find((c) => c.id === p)?.name : prev === "prospects" ? s.prospects.find((x) => x.id === p)?.name : prev === "devis" ? s.quotes.find((q) => q.id === p)?.number : prev === "commandes" ? s.orders.find((o) => o.id === p)?.number : undefined;
        label = ent ?? p;
      }
      return { label, path, last: i === parts.length - 1 };
    });
  }, [pathname, s.clients, s.prospects, s.quotes, s.orders]);

  const logout = () => {
    s.logout();
    toast.success("Vous êtes déconnecté.");
    navigate({ to: "/login", replace: true });
  };

  const go = (href: string) => { setSearchOpen(false); navigate({ href }); };
  const results = useMemo(() => ({
    clients: s.clients.map((c) => ({ id: c.id, label: c.name, sub: `${c.company} · ${c.country}`, to: `/clients/${c.id}` })),
    prospects: s.prospects.map((p) => ({ id: p.id, label: p.name, sub: `${p.company} · ${p.stage}`, to: `/prospects/${p.id}` })),
    produits: s.products.map((p) => ({ id: p.id, label: p.name, sub: `${p.reference} · ${p.collection}`, to: `/produits` })),
    devis: s.quotes.map((q) => ({ id: q.id, label: q.number, sub: `${q.projectName} · ${q.status}`, to: `/devis/${q.id}` })),
    commandes: s.orders.map((o) => ({ id: o.id, label: o.number, sub: `${o.projectName} · ${o.status}`, to: `/commandes/${o.id}` })),
    echantillons: s.samples.map((x) => ({ id: x.id, label: x.reference, sub: x.status, to: `/echantillons` })),
    rdv: s.appointments.map((a) => ({ id: a.id, label: a.title, sub: fmtDateTime(a.start), to: `/agents/booking` })),
  }), [s.clients, s.prospects, s.products, s.quotes, s.orders, s.samples, s.appointments]);

  const groups: { key: keyof typeof results; label: string; icon: typeof Users }[] = [
    { key: "clients", label: "Clients", icon: Users }, { key: "prospects", label: "Prospects", icon: Target }, { key: "produits", label: "Produits", icon: Package },
    { key: "devis", label: "Devis", icon: FileText }, { key: "commandes", label: "Commandes", icon: ShoppingCart }, { key: "echantillons", label: "Échantillons", icon: FlaskConical }, { key: "rdv", label: "Rendez-vous", icon: CalendarDays },
  ];

  return (
    <header className="print-hidden sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu"><Menu className="h-5 w-5" /></Button>
      <nav className="hidden min-w-0 items-center gap-1 text-sm sm:flex" aria-label="Fil d'Ariane">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Accueil</Link>
        {crumbs.map((c) => (
          <span key={c.path} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            {c.last ? <span className="truncate font-medium text-foreground">{c.label}</span> : <span className="truncate text-muted-foreground">{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className="flex-1" />
      <button type="button" onClick={() => setSearchOpen(true)} className="flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-soft hover:border-gold/50 md:w-72">
        <Search className="h-4 w-4" /><span className="hidden md:inline flex-1 text-left">Rechercher…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] md:inline">⌘K</kbd>
      </button>

      <Button variant="ghost" size="icon" onClick={() => s.setTheme(s.settings.theme === "dark" ? "light" : "dark")} aria-label="Changer de thème">
        {s.settings.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-gold-foreground">{unread}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { s.markAllNotificationsRead(); toast.success("Notifications marquées comme lues."); }}>Tout marquer comme lu</button>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {s.notifications.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Aucune notification.</div>}
            {s.notifications.slice(0, 20).map((n) => (
              <button type="button" key={n.id} onClick={() => { s.markNotificationRead(n.id); if (n.link) navigate({ href: n.link }); }} className={cn("flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-accent", !n.read && "bg-gold-soft/40")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.severity === "error" ? "bg-destructive" : n.severity === "warning" ? "bg-warning" : n.severity === "success" ? "bg-success" : "bg-info")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{n.title}</span>
                  <span className="block text-xs text-muted-foreground">{n.description}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground/70">{fmtDateTime(n.date)}</span>
                </span>
                {n.read && <Check className="h-3.5 w-3.5 text-muted-foreground/50" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-md p-1 hover:bg-accent">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-charcoal text-[11px] font-semibold text-charcoal-foreground">{profile.avatarInitials}</AvatarFallback></Avatar>
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-sm font-medium">{profile.name}</span>
              <span className="block text-[11px] text-muted-foreground">{profile.role}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm">{profile.name}</div>
            <div className="text-xs font-normal text-muted-foreground">{profile.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/parametres" })}><User className="h-4 w-4" /> Mon profil</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/parametres" })}><Settings className="h-4 w-4" /> Paramètres</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4" /> Déconnexion</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Rechercher un client, un devis, une commande…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          {groups.map((g) => (
            <CommandGroup key={g.key} heading={g.label}>
              {results[g.key].map((r) => (
                <CommandItem key={r.id} value={`${g.label} ${r.label} ${r.sub}`} onSelect={() => go(r.to)}>
                  <g.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{r.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{r.sub}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground border-sidebar-border">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 items-center border-b border-sidebar-border px-4"><Logo /></div>
          <div className="h-[calc(100vh-4rem)] overflow-y-auto"><MobileNav onNavigate={() => setMobileOpen(false)} /></div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
