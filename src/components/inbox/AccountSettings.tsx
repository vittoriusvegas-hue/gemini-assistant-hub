import { useRef, useState } from "react";
import {
  Camera,
  Globe,
  KeyRound,
  Mail,
  Palette,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { useInbox } from "@/lib/inbox-store";
import type { AccountSettings as AccountSettingsType } from "@/lib/inbox-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const TIMEZONES = [
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London",
  "UTC",
];

const AVATAR_COLORS = [
  "oklch(0.65 0.2 280)",
  "oklch(0.7 0.18 25)",
  "oklch(0.65 0.2 145)",
  "oklch(0.7 0.18 60)",
  "oklch(0.65 0.2 200)",
  "oklch(0.6 0.22 320)",
  "oklch(0.7 0.16 100)",
  "oklch(0.55 0.22 15)",
];

export function AccountSettings() {
  const { account, updateAccount, resetAccount, deleteAccount } = useInbox();
  const [draft, setDraft] = useState<AccountSettingsType>(account);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(account);
  const initials = (draft.displayName || draft.fullName || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const set = <K extends keyof AccountSettingsType>(key: K, value: AccountSettingsType[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSave = () => {
    updateAccount(draft);
    toast.success("Cuenta actualizada");
  };

  const onReset = () => {
    resetAccount();
    setDraft({ ...account });
    toast("Restablecido a valores por defecto");
  };

  const onAvatarPick = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("avatarUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  const onChangePassword = () => {
    if (!pwd.current || !pwd.next) return toast.error("Completa los campos de contraseña");
    if (pwd.next.length < 8) return toast.error("Mínimo 8 caracteres");
    if (pwd.next !== pwd.confirm) return toast.error("La confirmación no coincide");
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Contraseña actualizada");
  };

  return (
    <div className="space-y-6">
      {/* PERFIL */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Perfil</h2>
        </header>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full text-2xl font-semibold text-white shadow-md"
              style={{ background: draft.avatarUrl ? undefined : draft.avatarColor }}
            >
              {draft.avatarUrl ? (
                <img src={draft.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                aria-label="Cambiar avatar"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onAvatarPick(e.target.files[0])}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1">
                <Upload className="h-3 w-3" /> Subir
              </Button>
              {draft.avatarUrl && (
                <Button variant="ghost" size="sm" onClick={() => set("avatarUrl", undefined)}>
                  Quitar
                </Button>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("avatarColor", c)}
                  className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    draft.avatarColor === c ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ background: c }}
                  aria-label="Color"
                />
              ))}
            </div>
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" value={draft.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Nombre para mostrar</Label>
              <Input id="displayName" value={draft.displayName} onChange={(e) => set("displayName", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobTitle">Cargo</Label>
              <Input id="jobTitle" value={draft.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as AccountSettingsType["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">🟢 En línea</SelectItem>
                  <SelectItem value="away">🟡 Ausente</SelectItem>
                  <SelectItem value="busy">🔴 Ocupado</SelectItem>
                  <SelectItem value="offline">⚫ Desconectado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea id="bio" rows={3} value={draft.bio} onChange={(e) => set("bio", e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <header className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Contacto</h2>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" value={draft.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input id="website" value={draft.website} onChange={(e) => set("website", e.target.value)} />
          </div>
        </div>
      </section>

      {/* PREFERENCIAS */}
      <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <header className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Preferencias regionales</h2>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Idioma</Label>
            <Select value={draft.language} onValueChange={(v) => set("language", v as AccountSettingsType["language"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Zona horaria</Label>
            <Select value={draft.timezone} onValueChange={(v) => set("timezone", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Formato de fecha</Label>
            <Select value={draft.dateFormat} onValueChange={(v) => set("dateFormat", v as AccountSettingsType["dateFormat"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="flex items-center gap-1">
              <Palette className="h-3 w-3" /> Tema
            </Label>
            <Select value={draft.theme} onValueChange={(v) => set("theme", v as AccountSettingsType["theme"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="system">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signature">Firma de email</Label>
          <Textarea
            id="signature"
            rows={3}
            value={draft.signature}
            onChange={(e) => set("signature", e.target.value)}
            placeholder="Tu firma aparecerá al final de tus mensajes."
          />
        </div>
      </section>

      {/* SEGURIDAD */}
      <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <header className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Seguridad</h2>
        </header>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Verificación en dos pasos</p>
            <p className="text-xs text-muted-foreground">Añade una capa extra de protección a tu cuenta.</p>
          </div>
          <Switch
            checked={draft.twoFactorEnabled}
            onCheckedChange={(v) => set("twoFactorEnabled", v)}
          />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4" /> Cambiar contraseña
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="password"
              placeholder="Actual"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Nueva (mín. 8)"
              value={pwd.next}
              onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Confirmar"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </div>
          <Button size="sm" onClick={onChangePassword} className="w-fit">
            Actualizar contraseña
          </Button>
        </div>
      </section>

      {/* ZONA DE PELIGRO */}
      <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
        <header className="mb-3 flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h2 className="text-base font-semibold text-destructive">Zona de peligro</h2>
        </header>
        <p className="mb-4 text-sm text-muted-foreground">
          Eliminar tu cuenta es irreversible. Se borrarán contactos, conversaciones y configuración.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" /> Eliminar mi cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción restablecerá los datos de la demo. En producción, se eliminaría toda tu información permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteAccount();
                  setDraft({ ...account });
                  toast.success("Cuenta restablecida (demo)");
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* BARRA GUARDAR */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="text-sm text-muted-foreground">
          {dirty ? "Tienes cambios sin guardar." : "Todo está guardado."}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Restablecer
          </Button>
          <Button onClick={onSave} disabled={!dirty} className="gap-2">
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}