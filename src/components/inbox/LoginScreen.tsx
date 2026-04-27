import { useState } from "react";
import { Sparkles, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export function LoginScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = mode === "login" ? await login(email, password) : await signup(name, email, password);
    setLoading(false);
    if (!res.ok) toast.error(res.error ?? "No se pudo continuar");
    else toast.success(mode === "login" ? "Bienvenido de vuelta" : "Cuenta creada");
  };

  const fillDemo = () => {
    setEmail("demo@pulse.app");
    setPassword("demo1234");
    setMode("login");
  };

  return (
    <div className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-background p-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-[var(--gradient-brand)] opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-[var(--gradient-brand)] opacity-20 blur-3xl" />
      </div>

      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        {/* Brand side */}
        <div className="hidden flex-col justify-between rounded-3xl bg-[var(--gradient-brand)] p-10 text-primary-foreground shadow-[var(--shadow-pop)] lg:flex">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Pulse Inbox</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              Conversaciones unificadas con IA Gemini.
            </h1>
            <p className="mt-3 text-sm text-white/80">
              Bandeja multicanal, embudo de ventas y respuestas automáticas — todo en un lugar.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/90">
              {["WhatsApp + Instagram + Webhooks", "Pausa inteligente del bot", "Embudo personalizable"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} Pulse Inbox</p>
        </div>

        {/* Form side */}
        <div className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-10">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-brand)] text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">Pulse Inbox</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Accede a tu bandeja, embudo y bot."
              : "Empieza gratis. No se requiere tarjeta."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <Field icon={<UserIcon className="h-4 w-4" />} label="Nombre">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>
            )}
            <Field icon={<Mail className="h-4 w-4" />} label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />} label="Contraseña">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--gradient-brand)] text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] transition hover:opacity-95 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>

            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex h-9 w-full items-center justify-center rounded-lg border bg-background text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Usar credenciales demo
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border bg-background px-3 focus-within:ring-2 focus-within:ring-ring/40">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}
