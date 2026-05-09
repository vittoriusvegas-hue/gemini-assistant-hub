import { useMemo, useState } from "react";
import {
  Boxes,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  MapPin,
  Warehouse as WarehouseIcon,
  Package,
  X,
  Bell,
  BellOff,
  Layers,
  DollarSign,
  Minus,
  ImagePlus,
  FileSpreadsheet,
  Upload,
  Download,
} from "lucide-react";
import { useInventory, formatMoney, type InventoryItem, type Warehouse, type StorageLocation } from "@/lib/inventory-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ItemDialog = { mode: "new" } | { mode: "edit"; item: InventoryItem } | null;
type WarehouseDialog = { mode: "new" } | { mode: "edit"; warehouse: Warehouse } | null;
type LocationDialog = { mode: "new"; warehouseId?: string } | { mode: "edit"; location: StorageLocation } | null;

export function InventoryPage() {
  const inv = useInventory();
  const [tab, setTab] = useState<"items" | "warehouses">("items");
  const [q, setQ] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [itemDialog, setItemDialog] = useState<ItemDialog>(null);
  const [whDialog, setWhDialog] = useState<WarehouseDialog>(null);
  const [locDialog, setLocDialog] = useState<LocationDialog>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    return inv.items.filter((i) => {
      if (warehouseFilter !== "all" && i.warehouseId !== warehouseFilter) return false;
      if (showLowOnly && !(i.alertEnabled && i.quantity <= i.minQuantity)) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return i.name.toLowerCase().includes(n) || (i.sku?.toLowerCase().includes(n) ?? false);
    });
  }, [inv.items, warehouseFilter, q, showLowOnly]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const units = filtered.reduce((s, i) => s + i.quantity, 0);
    return { total, units };
  }, [filtered]);

  const warehouseById = (id: string) => inv.warehouses.find((w) => w.id === id);
  const locationById = (id?: string) => (id ? inv.locations.find((l) => l.id === id) : undefined);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card/60 backdrop-blur px-4 py-4 md:px-8 md:py-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">Gestiona productos, ubicaciones y alertas de stock mínimo.</p>
        </div>
        <div className="flex gap-2">
          {tab === "items" ? (
            <>
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              <FileSpreadsheet className="h-4 w-4" /> Importar Excel
            </button>
            <button
              onClick={() => setItemDialog({ mode: "new" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
            </>
          ) : (
            <button
              onClick={() => setWhDialog({ mode: "new" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Nuevo inventario
            </button>
          )}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 border-b bg-card px-4 py-4 md:grid-cols-4 md:px-8">
        <Kpi icon={<Package className="h-4 w-4" />} label="Productos" value={String(inv.items.length)} />
        <Kpi icon={<Layers className="h-4 w-4" />} label="Unidades totales" value={inv.items.reduce((s, i) => s + i.quantity, 0).toString()} />
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="Valor total" value={formatMoney(inv.grandTotal)} />
        <Kpi
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Stock bajo"
          value={String(inv.lowStockItems.length)}
          tone={inv.lowStockItems.length > 0 ? "warn" : "default"}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b bg-card px-4 py-2 md:px-8">
        <button
          onClick={() => setTab("items")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            tab === "items" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Productos
        </button>
        <button
          onClick={() => setTab("warehouses")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            tab === "warehouses" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Inventarios y ubicaciones
        </button>
      </div>

      {tab === "items" ? (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b bg-card px-4 py-3 md:px-8">
            <div className="relative min-w-[220px] flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="all">Todos los inventarios</option>
              {inv.warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowLowOnly((v) => !v)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
                showLowOnly ? "border-warning bg-warning/10 text-warning" : "bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <AlertTriangle className="h-4 w-4" /> Solo stock bajo
            </button>
            <div className="ml-auto text-sm text-muted-foreground">
              {filtered.length} ítems · <span className="font-semibold text-foreground">{formatMoney(totals.total)}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:px-8 md:pb-4">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Producto</th>
                    <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                    <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                    <th className="px-4 py-3 text-right font-medium">Precio unitario</th>
                    <th className="px-4 py-3 text-right font-medium">Valor total</th>
                    <th className="px-4 py-3 text-left font-medium">Alerta</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => {
                    const wh = warehouseById(it.warehouseId);
                    const loc = locationById(it.locationId);
                    const isLow = it.alertEnabled && it.quantity <= it.minQuantity;
                    return (
                      <tr key={it.id} className={cn("border-t hover:bg-muted/40", isLow && "bg-warning/5")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {it.imageUrl ? (
                              <img src={it.imageUrl} alt={it.name} className="h-9 w-9 rounded-lg object-cover" />
                            ) : (
                              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium">{it.name}</div>
                              {it.sku && <div className="text-xs text-muted-foreground">SKU: {it.sku}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-sm">
                              <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              {wh?.name ?? "—"}
                            </span>
                            {loc && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {loc.name}{loc.detail ? ` · ${loc.detail}` : ""}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1 rounded-md border bg-background">
                            <button
                              onClick={() => inv.adjustQuantity(it.id, -1)}
                              disabled={it.quantity <= 0}
                              className="grid h-7 w-7 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                              aria-label="Restar 1"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className={cn("min-w-8 text-center text-sm font-semibold", isLow && "text-warning")}>{it.quantity}</span>
                            <button
                              onClick={() => inv.adjustQuantity(it.id, +1)}
                              className="grid h-7 w-7 place-items-center text-muted-foreground hover:text-foreground"
                              aria-label="Sumar 1"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{formatMoney(it.unitPrice, it.currency)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">{formatMoney(it.quantity * it.unitPrice, it.currency)}</td>
                        <td className="px-4 py-3">
                          {it.alertEnabled ? (
                            isLow ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-1 text-[11px] font-semibold text-warning">
                                <AlertTriangle className="h-3 w-3" /> ≤ {it.minQuantity}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Bell className="h-3 w-3" /> mín. {it.minQuantity}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <BellOff className="h-3 w-3" /> sin alerta
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setItemDialog({ mode: "edit", item: it })}
                              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar "${it.name}"?`)) {
                                  inv.removeItem(it.id);
                                  toast.success("Producto eliminado");
                                }
                              }}
                              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                        <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                            <Boxes className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Sin productos</p>
                            <p className="mt-1 text-xs">Crea tu primer producto en este inventario.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:px-8 md:pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            {inv.warehouses.map((w) => {
              const locs = inv.locations.filter((l) => l.warehouseId === w.id);
              const itemsHere = inv.items.filter((i) => i.warehouseId === w.id);
              const value = itemsHere.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              return (
                <div key={w.id} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
                  {w.imageUrl && (
                    <div className="mb-4 -mx-5 -mt-5 h-32 overflow-hidden rounded-t-2xl bg-muted">
                      <img src={w.imageUrl} alt={w.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                        <WarehouseIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{w.name}</div>
                        {w.address && <div className="text-xs text-muted-foreground">{w.address}</div>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setWhDialog({ mode: "edit", warehouse: w })}
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Editar inventario"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar "${w.name}" y todos sus productos y ubicaciones?`)) {
                            inv.removeWarehouse(w.id);
                            toast.success("Inventario eliminado");
                          }
                        }}
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Eliminar inventario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="font-semibold text-foreground">{itemsHere.length}</div>
                      <div className="text-muted-foreground">Productos</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="font-semibold text-foreground">{itemsHere.reduce((s, i) => s + i.quantity, 0)}</div>
                      <div className="text-muted-foreground">Unidades</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="font-semibold text-foreground">{formatMoney(value)}</div>
                      <div className="text-muted-foreground">Valor</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ubicaciones</h3>
                      <button
                        onClick={() => setLocDialog({ mode: "new", warehouseId: w.id })}
                        className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/15"
                      >
                        <Plus className="h-3 w-3" /> Añadir
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {locs.length === 0 && <span className="text-xs text-muted-foreground">Sin ubicaciones definidas</span>}
                      {locs.map((l) => (
                        <span key={l.id} className="group inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs">
                          {l.imageUrl ? (
                            <img src={l.imageUrl} alt="" className="h-4 w-4 rounded object-cover" />
                          ) : (
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                          )}
                          {l.name}{l.detail ? ` · ${l.detail}` : ""}
                          <button
                            onClick={() => setLocDialog({ mode: "edit", location: l })}
                            className="ml-1 hidden text-muted-foreground hover:text-foreground group-hover:inline"
                            aria-label="Editar ubicación"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar ubicación "${l.name}"?`)) {
                                inv.removeLocation(l.id);
                                toast.success("Ubicación eliminada");
                              }
                            }}
                            className="hidden text-muted-foreground hover:text-destructive group-hover:inline"
                            aria-label="Eliminar ubicación"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {inv.warehouses.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
                Aún no hay inventarios. Crea tu primer inventario para empezar.
              </div>
            )}
          </div>
        </div>
      )}

      {itemDialog && (
        <ItemDialogForm
          dialog={itemDialog}
          onClose={() => setItemDialog(null)}
        />
      )}
      {whDialog && (
        <WarehouseDialogForm
          dialog={whDialog}
          onClose={() => setWhDialog(null)}
        />
      )}
      {locDialog && (
        <LocationDialogForm
          dialog={locDialog}
          onClose={() => setLocDialog(null)}
        />
      )}
      {importOpen && <ImportExcelDialog onClose={() => setImportOpen(false)} />}
    </div>
  );
}

function Kpi({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "warn" }) {
  return (
    <div className={cn("rounded-xl border bg-card p-3", tone === "warn" && "border-warning/40 bg-warning/5")}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("grid h-6 w-6 place-items-center rounded-md bg-primary-soft text-primary", tone === "warn" && "bg-warning/15 text-warning")}>{icon}</span>
        {label}
      </div>
      <div className={cn("mt-2 text-lg font-semibold", tone === "warn" && "text-warning")}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";

function ImagePicker({ value, onChange, label = "Imagen de referencia", aspect = "square" }: { value?: string; onChange: (v: string | undefined) => void; label?: string; aspect?: "square" | "wide" }) {
  const onFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 3MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <label className={cn(
        "group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 transition hover:bg-muted/50",
        aspect === "square" ? "aspect-square w-32" : "h-32 w-full",
      )}>
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onChange(undefined); }}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-destructive"
              aria-label="Quitar imagen"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 py-3 text-center text-xs text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
            <span>Subir imagen</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}

function ItemDialogForm({ dialog, onClose }: { dialog: NonNullable<ItemDialog>; onClose: () => void }) {
  const inv = useInventory();
  const editing = dialog.mode === "edit" ? dialog.item : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [sku, setSku] = useState(editing?.sku ?? "");
  const [warehouseId, setWarehouseId] = useState(editing?.warehouseId ?? inv.warehouses[0]?.id ?? "");
  const [locationId, setLocationId] = useState(editing?.locationId ?? "");
  const [quantity, setQuantity] = useState(editing?.quantity ?? 0);
  const [unitPrice, setUnitPrice] = useState(editing?.unitPrice ?? 0);
  const [currency, setCurrency] = useState(editing?.currency ?? "MXN");
  const [minQuantity, setMinQuantity] = useState(editing?.minQuantity ?? 5);
  const [alertEnabled, setAlertEnabled] = useState(editing?.alertEnabled ?? true);
  const [imageUrl, setImageUrl] = useState<string | undefined>(editing?.imageUrl);

  const locs = inv.locations.filter((l) => l.warehouseId === warehouseId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !warehouseId) return;
    const payload = {
      name: name.trim(),
      sku: sku.trim() || undefined,
      imageUrl,
      warehouseId,
      locationId: locationId || undefined,
      quantity: Math.max(0, Number(quantity) || 0),
      unitPrice: Math.max(0, Number(unitPrice) || 0),
      currency,
      minQuantity: Math.max(0, Number(minQuantity) || 0),
      alertEnabled,
    };
    if (editing) {
      inv.updateItem(editing.id, payload);
      toast.success("Producto actualizado");
    } else {
      inv.addItem(payload);
      toast.success("Producto añadido");
    }
    onClose();
  };

  return (
    <Modal title={editing ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <div className="flex items-start gap-3">
          <ImagePicker value={imageUrl} onChange={setImageUrl} label="Imagen del producto" />
          <div className="flex-1">
            <Field label="Nombre"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU (opcional)"><input className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} /></Field>
          <Field label="Moneda"><input className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inventario / Local">
            <select className={inputCls} value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setLocationId(""); }} required>
              {inv.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Ubicación (estantería/mueble)">
            <select className={inputCls} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">— Sin asignar —</option>
              {locs.map((l) => <option key={l.id} value={l.id}>{l.name}{l.detail ? ` · ${l.detail}` : ""}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Cantidad"><input type="number" min={0} className={inputCls} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></Field>
          <Field label="Precio unitario"><input type="number" min={0} step="0.01" className={inputCls} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} /></Field>
          <Field label="Valor total">
            <div className={cn(inputCls, "grid place-items-start content-center bg-muted/50 font-semibold")}>{formatMoney(quantity * unitPrice, currency)}</div>
          </Field>
        </div>
        <div className="rounded-xl border bg-muted/30 p-3">
          <label className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Alerta de stock mínimo</div>
              <div className="text-xs text-muted-foreground">Te avisaremos cuando la cantidad baje del umbral.</div>
            </div>
            <input type="checkbox" checked={alertEnabled} onChange={(e) => setAlertEnabled(e.target.checked)} className="h-4 w-4" />
          </label>
          <div className="mt-3">
            <Field label="Cantidad mínima">
              <input type="number" min={0} disabled={!alertEnabled} className={inputCls} value={minQuantity} onChange={(e) => setMinQuantity(Number(e.target.value))} />
            </Field>
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted">Cancelar</button>
          <button type="submit" className="h-10 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95">
            {editing ? "Guardar cambios" : "Añadir producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WarehouseDialogForm({ dialog, onClose }: { dialog: NonNullable<WarehouseDialog>; onClose: () => void }) {
  const inv = useInventory();
  const editing = dialog.mode === "edit" ? dialog.warehouse : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(editing?.imageUrl);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      inv.updateWarehouse(editing.id, { name: name.trim(), address: address.trim() || undefined, imageUrl });
      toast.success("Inventario actualizado");
    } else {
      inv.addWarehouse({ name: name.trim(), address: address.trim() || undefined, imageUrl });
      toast.success("Inventario creado");
    }
    onClose();
  };

  return (
    <Modal title={editing ? "Editar inventario" : "Nuevo inventario / local"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <ImagePicker value={imageUrl} onChange={setImageUrl} label="Foto del local (opcional)" aspect="wide" />
        <Field label="Nombre del local o bodega"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Bodega Central" /></Field>
        <Field label="Dirección (opcional)"><input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Principal 123" /></Field>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted">Cancelar</button>
          <button type="submit" className="h-10 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95">
            {editing ? "Guardar" : "Crear inventario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LocationDialogForm({ dialog, onClose }: { dialog: NonNullable<LocationDialog>; onClose: () => void }) {
  const inv = useInventory();
  const editing = dialog.mode === "edit" ? dialog.location : null;
  const [warehouseId, setWarehouseId] = useState(editing?.warehouseId ?? (dialog.mode === "new" ? dialog.warehouseId ?? inv.warehouses[0]?.id ?? "" : ""));
  const [name, setName] = useState(editing?.name ?? "");
  const [detail, setDetail] = useState(editing?.detail ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(editing?.imageUrl);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !warehouseId) return;
    if (editing) {
      inv.updateLocation(editing.id, { warehouseId, name: name.trim(), detail: detail.trim() || undefined, imageUrl });
      toast.success("Ubicación actualizada");
    } else {
      inv.addLocation({ warehouseId, name: name.trim(), detail: detail.trim() || undefined, imageUrl });
      toast.success("Ubicación añadida");
    }
    onClose();
  };

  return (
    <Modal title={editing ? "Editar ubicación" : "Nueva ubicación"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <div className="flex items-start gap-3">
          <ImagePicker value={imageUrl} onChange={setImageUrl} label="Foto de referencia" />
          <div className="flex-1 space-y-3">
        <Field label="Inventario">
          <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            {inv.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
        <Field label="Nombre (estantería, mueble, repisa…)"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Estantería A" /></Field>
          </div>
        </div>
        <Field label="Detalle (opcional)"><input className={inputCls} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ej. Repisa 2, Cajón superior" /></Field>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted">Cancelar</button>
          <button type="submit" className="h-10 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95">
            {editing ? "Guardar" : "Añadir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
// ----------------------- Excel import -----------------------

type FieldKey = "name" | "sku" | "description" | "quantity" | "unitPrice" | "currency" | "minQuantity" | "alertEnabled" | "locationName" | "locationDetail";

const FIELD_OPTIONS: { key: FieldKey | "ignore"; label: string; required?: boolean }[] = [
  { key: "ignore", label: "— Ignorar —" },
  { key: "name", label: "Nombre del producto", required: true },
  { key: "sku", label: "SKU / Código" },
  { key: "description", label: "Descripción" },
  { key: "quantity", label: "Cantidad", required: true },
  { key: "unitPrice", label: "Precio unitario", required: true },
  { key: "currency", label: "Moneda" },
  { key: "minQuantity", label: "Cantidad mínima (alerta)" },
  { key: "alertEnabled", label: "Alerta activada (sí/no)" },
  { key: "locationName", label: "Ubicación: nombre" },
  { key: "locationDetail", label: "Ubicación: detalle" },
];

function guessMapping(header: string): FieldKey | "ignore" {
  const h = header.toLowerCase().trim();
  if (/(nombre|product|item|descripcion corta|titulo|title|name)/.test(h)) return "name";
  if (/(sku|codigo|code|c[oó]digo)/.test(h)) return "sku";
  if (/(descrip|detail|description)/.test(h)) return "description";
  if (/(cantidad|stock|qty|quantity|existencia)/.test(h) && !/min/.test(h)) return "quantity";
  if (/(precio|price|costo|valor unit)/.test(h) && !/total/.test(h)) return "unitPrice";
  if (/(moneda|currency|divisa)/.test(h)) return "currency";
  if (/(min|umbral|alerta cant)/.test(h)) return "minQuantity";
  if (/(alerta|notif|alert)/.test(h)) return "alertEnabled";
  if (/(ubicac|estanter|repisa|mueble|location|shelf)/.test(h) && !/detalle|detail/.test(h)) return "locationName";
  if (/(detalle|detail|posicion|position)/.test(h)) return "locationDetail";
  return "ignore";
}

function ImportExcelDialog({ onClose }: { onClose: () => void }) {
  const inv = useInventory();
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey | "ignore">>({});
  const [warehouseId, setWarehouseId] = useState<string>(inv.warehouses[0]?.id ?? "");
  const [defaultCurrency, setDefaultCurrency] = useState("MXN");
  const [createMissingLocations, setCreateMissingLocations] = useState(true);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    if (json.length === 0) {
      toast.error("El archivo está vacío");
      return;
    }
    const hdrs = Object.keys(json[0]);
    setHeaders(hdrs);
    setRows(json);
    const guessed: Record<string, FieldKey | "ignore"> = {};
    hdrs.forEach((h) => { guessed[h] = guessMapping(h); });
    setMapping(guessed);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre", "SKU", "Cantidad", "Precio unitario", "Moneda", "Cantidad mínima", "Alerta", "Ubicación", "Detalle ubicación"],
      ["Audífonos Pro X", "AUD-001", 24, 1299, "MXN", 5, "sí", "Estantería A", "Repisa 1"],
      ["Cargador USB-C", "CHR-030", 12, 349, "MXN", 10, "sí", "Estantería A", "Repisa 2"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "plantilla-inventario.xlsx");
  };

  const requiredOk = (["name", "quantity", "unitPrice"] as FieldKey[]).every((k) => Object.values(mapping).includes(k));

  const doImport = () => {
    if (!warehouseId) { toast.error("Selecciona un inventario destino"); return; }
    if (!requiredOk) { toast.error("Asigna al menos Nombre, Cantidad y Precio unitario"); return; }
    const colFor = (k: FieldKey): string | undefined => Object.entries(mapping).find(([, v]) => v === k)?.[0];
    const cName = colFor("name")!;
    const cQty = colFor("quantity")!;
    const cPrice = colFor("unitPrice")!;
    const cSku = colFor("sku");
    const cDesc = colFor("description");
    const cCur = colFor("currency");
    const cMin = colFor("minQuantity");
    const cAlert = colFor("alertEnabled");
    const cLoc = colFor("locationName");
    const cLocD = colFor("locationDetail");

    const existingLocs = inv.locations.filter((l) => l.warehouseId === warehouseId);
    const locByKey = new Map(existingLocs.map((l) => [`${l.name.toLowerCase()}|${(l.detail ?? "").toLowerCase()}`, l.id]));

    let added = 0, skipped = 0;
    rows.forEach((r) => {
      const name = String(r[cName] ?? "").trim();
      if (!name) { skipped++; return; }
      const quantity = Number(r[cQty] ?? 0) || 0;
      const unitPrice = Number(r[cPrice] ?? 0) || 0;
      let locationId: string | undefined;
      if (cLoc) {
        const lname = String(r[cLoc] ?? "").trim();
        const ldet = cLocD ? String(r[cLocD] ?? "").trim() : "";
        if (lname) {
          const key = `${lname.toLowerCase()}|${ldet.toLowerCase()}`;
          locationId = locByKey.get(key);
          if (!locationId && createMissingLocations) {
            locationId = inv.addLocation({ warehouseId, name: lname, detail: ldet || undefined });
            locByKey.set(key, locationId);
          }
        }
      }
      const alertRaw = cAlert ? String(r[cAlert] ?? "").toLowerCase().trim() : "";
      const alertEnabled = cAlert ? ["si", "sí", "yes", "true", "1", "x"].includes(alertRaw) : true;
      inv.addItem({
        name,
        sku: cSku ? String(r[cSku] ?? "").trim() || undefined : undefined,
        description: cDesc ? String(r[cDesc] ?? "").trim() || undefined : undefined,
        warehouseId,
        locationId,
        quantity: Math.max(0, quantity),
        unitPrice: Math.max(0, unitPrice),
        currency: (cCur ? String(r[cCur] ?? "").trim().toUpperCase() : "") || defaultCurrency,
        minQuantity: cMin ? Math.max(0, Number(r[cMin] ?? 0) || 0) : 5,
        alertEnabled,
      });
      added++;
    });
    toast.success(`Importados ${added} productos${skipped ? ` · ${skipped} omitidos` : ""}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Importar inventario desde Excel</h2>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Inventario destino">
              <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {inv.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Moneda por defecto">
              <input className={inputCls} value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())} maxLength={3} />
            </Field>
            <label className="flex items-end gap-2 pb-1 text-sm">
              <input type="checkbox" checked={createMissingLocations} onChange={(e) => setCreateMissingLocations(e.target.checked)} className="h-4 w-4" />
              Crear ubicaciones faltantes
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95">
              <Upload className="h-4 w-4" />
              {fileName ? "Cambiar archivo" : "Seleccionar archivo .xlsx / .csv"}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={downloadTemplate} className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-3 text-sm hover:bg-muted">
              <Download className="h-4 w-4" /> Plantilla
            </button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName} · {rows.length} filas</span>}
          </div>

          {headers.length > 0 && (
            <>
              <div className="rounded-xl border">
                <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Asignar columnas a campos
                </div>
                <div className="max-h-64 overflow-y-auto p-3">
                  <div className="grid gap-2">
                    {headers.map((h) => (
                      <div key={h} className="grid grid-cols-2 items-center gap-3">
                        <div className="truncate text-sm">
                          <span className="font-medium">{h}</span>
                          <span className="ml-2 text-xs text-muted-foreground truncate">ej: {String(rows[0]?.[h] ?? "")}</span>
                        </div>
                        <select
                          value={mapping[h] ?? "ignore"}
                          onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value as FieldKey | "ignore" }))}
                          className={inputCls}
                        >
                          {FIELD_OPTIONS.map((o) => (
                            <option key={o.key} value={o.key}>{o.label}{o.required ? " *" : ""}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {!requiredOk && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                  Debes asignar al menos: <strong>Nombre</strong>, <strong>Cantidad</strong> y <strong>Precio unitario</strong>.
                </div>
              )}
            </>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button onClick={onClose} className="h-10 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted">Cancelar</button>
            <button
              onClick={doImport}
              disabled={!rows.length || !requiredOk}
              className="h-10 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95 disabled:opacity-50"
            >
              Importar {rows.length || ""} productos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
