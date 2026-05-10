import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PricingMode = "per_visit" | "per_hour" | "per_day" | "custom";

export const PRICING_LABELS: Record<PricingMode, string> = {
  per_visit: "Por visita",
  per_hour: "Por hora",
  per_day: "Por día",
  custom: "Personalizado",
};

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  pricingMode: PricingMode;
  /** Base price for the chosen pricing mode (per visit, per hour, per day...). */
  basePrice: number;
  currency: string;
  /** Suggested default duration in minutes (used to draft schedules). */
  defaultDurationMin: number;
  active: boolean;
  createdAt: number;
}

export type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "partial";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: "Agendado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  partial: "Parcial",
};

export interface ServiceJob {
  id: string;
  serviceId: string;
  /** Linked contact id from inbox-store (optional) */
  contactId?: string;
  /** Free-text client name when no contact is linked */
  clientName?: string;
  clientPhone?: string;
  /** Address / map reference */
  location: string;
  notes?: string;
  /** Start of the appointment, epoch ms */
  scheduledAt: number;
  /** Optional end, epoch ms (auto-derived from units when omitted) */
  endsAt?: number;
  /** Number of units billed (hours, days, or 1 for visit) */
  units: number;
  /** Final agreed price (units * basePrice unless overridden) */
  totalPrice: number;
  currency: string;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  createdAt: number;
}

const STORAGE_KEY = "pulse.services.v1";

const SEED_SERVICES: Service[] = [
  { id: "s-1", name: "Instalación de internet residencial", category: "Internet / Redes", description: "Instalación de router y cableado básico.", pricingMode: "per_visit", basePrice: 600, currency: "MXN", defaultDurationMin: 90, active: true, createdAt: Date.now() - 86400000 * 20 },
  { id: "s-2", name: "Reparación de tubería", category: "Fontanería", description: "Detección de fugas y reparación.", pricingMode: "per_hour", basePrice: 250, currency: "MXN", defaultDurationMin: 120, active: true, createdAt: Date.now() - 86400000 * 12 },
  { id: "s-3", name: "Servicio de taxi", category: "Transporte", description: "Traslado urbano por hora.", pricingMode: "per_hour", basePrice: 180, currency: "MXN", defaultDurationMin: 60, active: true, createdAt: Date.now() - 86400000 * 6 },
  { id: "s-4", name: "Mantenimiento mecánico", category: "Mecánica", description: "Revisión y diagnóstico vehicular.", pricingMode: "per_day", basePrice: 1200, currency: "MXN", defaultDurationMin: 480, active: true, createdAt: Date.now() - 86400000 * 3 },
];

const now = Date.now();
const day = 86400000;
const SEED_JOBS: ServiceJob[] = [
  { id: "j-1", serviceId: "s-1", clientName: "Familia Pérez", clientPhone: "+52 55 8888 1111", location: "Av. Reforma 123, CDMX", scheduledAt: now + day * 1, units: 1, totalPrice: 600, currency: "MXN", status: "scheduled", paymentStatus: "pending", createdAt: now - day },
  { id: "j-2", serviceId: "s-2", clientName: "Restaurante La Esquina", location: "Calle Roma 45", scheduledAt: now - day * 2, units: 3, totalPrice: 750, currency: "MXN", status: "completed", paymentStatus: "paid", createdAt: now - day * 3 },
  { id: "j-3", serviceId: "s-3", clientName: "Diego Salas", location: "Aeropuerto T2 → Polanco", scheduledAt: now + day * 0.2, units: 2, totalPrice: 360, currency: "MXN", status: "scheduled", paymentStatus: "pending", createdAt: now - day * 0.5 },
];

interface State {
  services: Service[];
  jobs: ServiceJob[];
  addService: (input: Omit<Service, "id" | "createdAt">) => string;
  updateService: (id: string, patch: Partial<Omit<Service, "id" | "createdAt">>) => void;
  removeService: (id: string) => void;
  addJob: (input: Omit<ServiceJob, "id" | "createdAt">) => string;
  updateJob: (id: string, patch: Partial<Omit<ServiceJob, "id" | "createdAt">>) => void;
  removeJob: (id: string) => void;
  setJobStatus: (id: string, status: JobStatus) => void;
  // Derived
  totalRevenue: number;
  pendingRevenue: number;
  upcomingJobs: ServiceJob[];
}

const Ctx = createContext<State | null>(null);
function uid() { return Math.random().toString(36).slice(2, 10); }

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>(SEED_SERVICES);
  const [jobs, setJobs] = useState<ServiceJob[]>(SEED_JOBS);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.services) setServices(parsed.services);
        if (parsed?.jobs) setJobs(parsed.jobs);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ services, jobs })); } catch { /* ignore */ }
  }, [services, jobs]);

  const addService: State["addService"] = useCallback((input) => {
    const id = "s-" + uid();
    setServices((p) => [{ ...input, id, createdAt: Date.now() }, ...p]);
    return id;
  }, []);
  const updateService: State["updateService"] = useCallback((id, patch) => {
    setServices((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);
  const removeService: State["removeService"] = useCallback((id) => {
    setServices((p) => p.filter((s) => s.id !== id));
    setJobs((p) => p.filter((j) => j.serviceId !== id));
  }, []);

  const addJob: State["addJob"] = useCallback((input) => {
    const id = "j-" + uid();
    setJobs((p) => [{ ...input, id, createdAt: Date.now() }, ...p]);
    return id;
  }, []);
  const updateJob: State["updateJob"] = useCallback((id, patch) => {
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);
  const removeJob: State["removeJob"] = useCallback((id) => {
    setJobs((p) => p.filter((j) => j.id !== id));
  }, []);
  const setJobStatus: State["setJobStatus"] = useCallback((id, status) => {
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, status } : j)));
  }, []);

  const totalRevenue = useMemo(
    () => jobs.filter((j) => j.status === "completed" && j.paymentStatus === "paid").reduce((s, j) => s + j.totalPrice, 0),
    [jobs],
  );
  const pendingRevenue = useMemo(
    () => jobs.filter((j) => j.paymentStatus !== "paid" && j.status !== "cancelled").reduce((s, j) => s + j.totalPrice, 0),
    [jobs],
  );
  const upcomingJobs = useMemo(
    () => jobs.filter((j) => j.status === "scheduled" && j.scheduledAt >= Date.now()).sort((a, b) => a.scheduledAt - b.scheduledAt),
    [jobs],
  );

  const value = useMemo<State>(() => ({
    services, jobs,
    addService, updateService, removeService,
    addJob, updateJob, removeJob, setJobStatus,
    totalRevenue, pendingRevenue, upcomingJobs,
  }), [services, jobs, addService, updateService, removeService, addJob, updateJob, removeJob, setJobStatus, totalRevenue, pendingRevenue, upcomingJobs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useServices() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useServices must be used inside ServicesProvider");
  return ctx;
}

export function formatMoney(amount: number, currency = "MXN") {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}