import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAgentEngines } from "@/lib/agents";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    // Wait for localStorage hydration before checking the mock session.
    if (!useStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsub = useStore.persist.onFinishHydration(() => { unsub(); resolve(); });
        if (useStore.persist.hasHydrated()) { unsub(); resolve(); }
      });
    }
    if (!useStore.getState().session) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useAgentEngines();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 print-only-document">
          <div className="mx-auto w-full max-w-[1400px] animate-fade-in">
            <Outlet />
          </div>
        </main>
        <footer className="print-hidden border-t px-8 py-4 text-center text-[11px] tracking-wide text-muted-foreground">
          Ce MVP a été conçu et développé par <span className="font-semibold text-foreground">IZEMX</span>
        </footer>
      </div>
    </div>
  );
}
