import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useStore, useHydrated } from "@/lib/store";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Atelier du Zellige" },
      { name: "description", content: "Accédez à l'espace de gestion d'Atelier du Zellige." },
      { property: "og:title", content: "Connexion — Atelier du Zellige" },
      { property: "og:description", content: "Espace de gestion centralisé d'Atelier du Zellige." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const session = useStore((s) => s.session);
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("admin@atelierduzellige.ma");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  useEffect(() => {
    if (hydrated && session) navigate({ to: "/dashboard", replace: true });
  }, [hydrated, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = "Adresse email invalide.";
    if (password.length < 6) errs.password = "Le mot de passe doit contenir au moins 6 caractères.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const ok = login(email, password);
    setLoading(false);
    if (ok) {
      toast.success("Bienvenue, Houda.");
      navigate({ to: "/dashboard", replace: true });
    } else {
      setErrors({ form: "Identifiants incorrects. Vérifiez votre email et votre mot de passe." });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="zellige-pattern relative hidden flex-col justify-between p-12 text-charcoal-foreground lg:flex">
        <Logo />
        <div className="max-w-md">
          <LogoMark size={72} className="text-gold mb-8" />
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Le savoir-faire de Fès, piloté avec précision.</h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground">
            CRM, devis, production, export et agents IA réunis dans un espace unique pour Atelier du Zellige.
          </p>
        </div>
        <div className="text-[11px] tracking-wider uppercase text-sidebar-foreground/70">Ce MVP a été conçu et développé par IZEMX</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo tone="dark" /></div>
          <div className="mb-8">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Espace de gestion</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Connexion</h1>
            <p className="mt-1 text-sm text-muted-foreground">Identifiants de démonstration pré-remplis.</p>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" aria-invalid={!!errors.email} className={cn(errors.email && "border-destructive")} />
              {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
            </Field>
            <Field label="Mot de passe">
              <div className="relative">
                <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" aria-invalid={!!errors.password} className={cn("pr-10", errors.password && "border-destructive")} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-destructive">{errors.password}</span>}
            </Field>
            {errors.form && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</div>}
            <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Se connecter <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>
          </form>
          <p className="mt-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Atelier du Zellige · Fès, Maroc</p>
        </div>
      </div>
    </div>
  );
}
