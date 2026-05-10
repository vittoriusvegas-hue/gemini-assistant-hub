import { useMemo, useState } from "react";
import { Briefcase, Plus, Calendar, MapPin, Trash2, Edit3, CheckCircle2, Clock, X, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  useServices, formatMoney, PRICING_LABELS, JOB_STATUS_LABELS, PAYMENT_STATUS_LABELS,
  type Service, type ServiceJob, type PricingMode, type JobStatus, type PaymentStatus,
} from "@/lib/services-store";
import { toast } from "sonner";

function emptyService(): Omit<Service, "id" | "createdAt"> {
  return { name: "", category: "", description: "", pricingMode: "per_visit", basePrice: 0, currency: "MXN", defaultDurationMin: 60, active: true };
}

function ServiceDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Service | null }) {
  const svc = useServices();
  const [data, setData] = useState<Omit<Service, "id" | "createdAt">>(() => initial ?? emptyService());

  const handleSave = () => {
    if (!data.name.trim()) return toast.error("El nombre es obligatorio");
    if (initial) { svc.updateService(initial.id, data); toast.success("Servicio actualizado"); }
    else { svc.addService(data); toast.success("Servicio creado"); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Editar servicio" : "Nuevo servicio"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Nombre</Label><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Ej. Instalación de internet" /></div>
            <div className="space-y-1.5"><Label>Categoría</Label><Input value={data.category} onChange={(e) => setData({ ...data, category: e.target.value })} placeholder="Fontanería, Taxi…" /></div>
            <div className="space-y-1.5"><Label>Modalidad</Label>
              <Select value={data.pricingMode} onValueChange={(v) => setData({ ...data, pricingMode: v as PricingMode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRICING_LABELS) as PricingMode[]).map((k) => (<SelectItem key={k} value={k}>{PRICING_LABELS[k]}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Precio base</Label><Input type="number" value={data.basePrice} onChange={(e) => setData({ ...data, basePrice: Number(e.target.value) || 0 })} /></div>
            <div className="space-y-1.5"><Label>Moneda</Label><Input value={data.currency} onChange={(e) => setData({ ...data, currency: e.target.value.toUpperCase() })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Duración estimada (minutos)</Label><Input type="number" value={data.defaultDurationMin} onChange={(e) => setData({ ...data, defaultDurationMin: Number(e.target.value) || 0 })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Descripción / detalles</Label><Textarea rows={3} value={data.description ?? ""} onChange={(e) => setData({ ...data, description: e.target.value })} placeholder="Qué incluye el servicio, materiales, garantías..." /></div>
            <div className="col-span-2 flex items-center gap-2"><Switch checked={data.active} onCheckedChange={(v) => setData({ ...data, active: v })} /><Label>Servicio activo</Label></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function emptyJob(services: Service[]): Omit<ServiceJob, "id" | "createdAt"> {
  const s = services[0];
  return {
    serviceId: s?.id ?? "",
    clientName: "",
    clientPhone: "",
    location: "",
    notes: "",
    scheduledAt: Date.now() + 3600000,
    units: 1,
    totalPrice: s?.basePrice ?? 0,
    currency: s?.currency ?? "MXN",
    status: "scheduled",
    paymentStatus: "pending",
  };
}

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function JobDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: ServiceJob | null }) {
  const svc = useServices();
  const [data, setData] = useState<Omit<ServiceJob, "id" | "createdAt">>(() => initial ?? emptyJob(svc.services));

  const service = svc.services.find((s) => s.id === data.serviceId);

  const handleServiceChange = (id: string) => {
    const s = svc.services.find((x) => x.id === id);
    if (!s) return setData({ ...data, serviceId: id });
    setData({ ...data, serviceId: id, currency: s.currency, totalPrice: data.units * s.basePrice });
  };
  const handleUnits = (units: number) => {
    const s = svc.services.find((x) => x.id === data.serviceId);
    setData({ ...data, units, totalPrice: s ? units * s.basePrice : data.totalPrice });
  };

  const handleSave = () => {
    if (!data.serviceId) return toast.error("Selecciona un servicio");
    if (!data.location.trim()) return toast.error("Indica la ubicación");
    if (initial) { svc.updateJob(initial.id, data); toast.success("Servicio actualizado"); }
    else { svc.addJob(data); toast.success("Servicio agendado"); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Editar servicio agendado" : "Nuevo servicio agendado"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5"><Label>Servicio</Label>
            <Select value={data.serviceId} onValueChange={handleServiceChange}>
              <SelectTrigger><SelectValue placeholder="Elige un servicio" /></SelectTrigger>
              <SelectContent>
                {svc.services.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} · {PRICING_LABELS[s.pricingMode]}</SelectItem>))}
              </SelectContent>
            </Select>
            {service && <p className="text-xs text-muted-foreground">Precio base: {formatMoney(service.basePrice, service.currency)} · {PRICING_LABELS[service.pricingMode]}</p>}
          </div>
          <div className="space-y-1.5"><Label>Cliente</Label><Input value={data.clientName ?? ""} onChange={(e) => setData({ ...data, clientName: e.target.value })} placeholder="Nombre" /></div>
          <div className="space-y-1.5"><Label>Teléfono</Label><Input value={data.clientPhone ?? ""} onChange={(e) => setData({ ...data, clientPhone: e.target.value })} placeholder="+52..." /></div>
          <div className="col-span-2 space-y-1.5"><Label>Ubicación</Label><Input value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} placeholder="Dirección o referencia" /></div>
          <div className="space-y-1.5"><Label>Fecha y hora</Label><Input type="datetime-local" value={toLocalInput(data.scheduledAt)} onChange={(e) => setData({ ...data, scheduledAt: new Date(e.target.value).getTime() })} /></div>
          <div className="space-y-1.5"><Label>Unidades ({service ? PRICING_LABELS[service.pricingMode].toLowerCase() : "—"})</Label><Input type="number" min={1} value={data.units} onChange={(e) => handleUnits(Number(e.target.value) || 1)} /></div>
          <div className="space-y-1.5"><Label>Precio total</Label><Input type="number" value={data.totalPrice} onChange={(e) => setData({ ...data, totalPrice: Number(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Moneda</Label><Input value={data.currency} onChange={(e) => setData({ ...data, currency: e.target.value.toUpperCase() })} /></div>
          <div className="space-y-1.5"><Label>Estado</Label>
            <Select value={data.status} onValueChange={(v) => setData({ ...data, status: v as JobStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((k) => (<SelectItem key={k} value={k}>{JOB_STATUS_LABELS[k]}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Pago</Label>
            <Select value={data.paymentStatus} onValueChange={(v) => setData({ ...data, paymentStatus: v as PaymentStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((k) => (<SelectItem key={k} value={k}>{PAYMENT_STATUS_LABELS[k]}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5"><Label>Notas</Label><Textarea rows={3} value={data.notes ?? ""} onChange={(e) => setData({ ...data, notes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_VARIANT: Record<JobStatus, string> = {
  scheduled: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  completed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  cancelled: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};
const PAY_VARIANT: Record<PaymentStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  paid: "bg-emerald-500/15 text-emerald-600",
  partial: "bg-amber-500/15 text-amber-600",
};

function CalendarView({ jobs, services, onPick }: { jobs: ServiceJob[]; services: Service[]; onPick: (j: ServiceJob) => void }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, ServiceJob[]>();
    jobs.forEach((j) => {
      const d = new Date(j.scheduledAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = String(d.getDate());
        const arr = map.get(key) ?? [];
        arr.push(j); map.set(key, arr);
      }
    });
    return map;
  }, [jobs, year, month]);

  const monthLabel = cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold capitalize">{monthLabel}</div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Hoy</Button>
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d) => (<div key={d} className="py-1">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="min-h-[88px] rounded-md bg-muted/20" />;
          const dayJobs = jobsByDay.get(String(cell.getDate())) ?? [];
          const isToday = cell.toDateString() === new Date().toDateString();
          return (
            <div key={i} className={`min-h-[88px] rounded-md border p-1 text-left ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className={`mb-1 text-xs font-semibold ${isToday ? "text-primary" : ""}`}>{cell.getDate()}</div>
              <div className="space-y-0.5">
                {dayJobs.slice(0, 3).map((j) => {
                  const s = services.find((x) => x.id === j.serviceId);
                  return (
                    <button key={j.id} onClick={() => onPick(j)} className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] ${STATUS_VARIANT[j.status]}`}>
                      {new Date(j.scheduledAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} · {s?.name ?? "—"}
                    </button>
                  );
                })}
                {dayJobs.length > 3 && (<div className="text-[10px] text-muted-foreground">+{dayJobs.length - 3} más</div>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ServicesPage() {
  const svc = useServices();
  const [tab, setTab] = useState("catalog");
  const [editingService, setEditingService] = useState<Service | null | undefined>(undefined);
  const [editingJob, setEditingJob] = useState<ServiceJob | null | undefined>(undefined);

  const completedCount = svc.jobs.filter((j) => j.status === "completed").length;
  const scheduledCount = svc.jobs.filter((j) => j.status === "scheduled").length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gradient-brand)] text-primary-foreground"><Briefcase className="h-5 w-5" /></div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Servicios</h1>
            <p className="text-xs text-muted-foreground">Catálogo, agenda y contabilidad de servicios prestados</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 px-6 pt-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Briefcase className="h-3.5 w-3.5" /> Servicios activos</div><div className="mt-1 text-2xl font-bold">{svc.services.filter((s) => s.active).length}</div></div>
        <div className="rounded-xl border bg-card p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Agendados</div><div className="mt-1 text-2xl font-bold">{scheduledCount}</div></div>
        <div className="rounded-xl border bg-card p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Completados</div><div className="mt-1 text-2xl font-bold">{completedCount}</div></div>
        <div className="rounded-xl border bg-card p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Ingresos cobrados</div><div className="mt-1 text-xl font-bold">{formatMoney(svc.totalRevenue)}</div><div className="text-[10px] text-muted-foreground">Pendiente: {formatMoney(svc.pendingRevenue)}</div></div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col overflow-hidden px-6 pt-4">
        <TabsList className="self-start">
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="jobs">Servicios realizados</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="flex-1 overflow-y-auto pb-6">
          <div className="mb-3 flex justify-end"><Button onClick={() => setEditingService(null)}><Plus className="mr-1 h-4 w-4" /> Nuevo servicio</Button></div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {svc.services.map((s) => (
              <div key={s.id} className="flex flex-col rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.category || "Sin categoría"}</div>
                  </div>
                  <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Activo" : "Inactivo"}</Badge>
                </div>
                {s.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.description}</p>}
                <div className="mt-3 flex items-baseline gap-2"><span className="text-xl font-bold">{formatMoney(s.basePrice, s.currency)}</span><span className="text-xs text-muted-foreground">{PRICING_LABELS[s.pricingMode]}</span></div>
                <div className="text-xs text-muted-foreground">Duración: {s.defaultDurationMin} min</div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingService(s)}><Edit3 className="mr-1 h-3.5 w-3.5" /> Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("¿Eliminar servicio?")) { svc.removeService(s.id); toast.success("Eliminado"); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
            {svc.services.length === 0 && (<div className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aún no tienes servicios. Crea el primero.</div>)}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="flex-1 overflow-y-auto pb-6">
          <div className="mb-3 flex justify-end"><Button onClick={() => setEditingJob(null)} disabled={svc.services.length === 0}><Plus className="mr-1 h-4 w-4" /> Agendar servicio</Button></div>
          <div className="space-y-2">
            {svc.jobs.slice().sort((a, b) => b.scheduledAt - a.scheduledAt).map((j) => {
              const s = svc.services.find((x) => x.id === j.serviceId);
              return (
                <div key={j.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{s?.name ?? "Servicio eliminado"}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_VARIANT[j.status]}`}>{JOB_STATUS_LABELS[j.status]}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PAY_VARIANT[j.paymentStatus]}`}>{PAYMENT_STATUS_LABELS[j.paymentStatus]}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(j.scheduledAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>
                      {j.clientName && <span>👤 {j.clientName}{j.clientPhone ? ` · ${j.clientPhone}` : ""}</span>}
                      <span>{j.units} × {PRICING_LABELS[s?.pricingMode ?? "per_visit"].toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatMoney(j.totalPrice, j.currency)}</div>
                  </div>
                  <div className="flex gap-1">
                    {j.status !== "completed" && (<Button size="icon" variant="outline" title="Marcar completado" onClick={() => { svc.updateJob(j.id, { status: "completed", paymentStatus: "paid" }); toast.success("Marcado como completado"); }}><CheckCircle2 className="h-4 w-4" /></Button>)}
                    <Button size="icon" variant="outline" onClick={() => setEditingJob(j)}><Edit3 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("¿Eliminar?")) svc.removeJob(j.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
            {svc.jobs.length === 0 && (<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No hay servicios agendados todavía.</div>)}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 overflow-y-auto pb-6">
          <CalendarView jobs={svc.jobs} services={svc.services} onPick={(j) => setEditingJob(j)} />
        </TabsContent>
      </Tabs>

      {editingService !== undefined && (<ServiceDialog open onClose={() => setEditingService(undefined)} initial={editingService} />)}
      {editingJob !== undefined && (<JobDialog open onClose={() => setEditingJob(undefined)} initial={editingJob} />)}
    </div>
  );
}

// keep unused icon import-free
void X;