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
} from "lucide-react";
import { useInventory, formatMoney, type InventoryItem, type Warehouse, type StorageLocation } from "@/lib/inventory-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
            <button
              onClick={() => setItemDialog({ mode: "new" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--gradient-brand)] px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-pop)] hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
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
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                              <Package className="h-4 w-4" />
                            </div>
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
                          <MapPin className="h-3 w-3 text-muted-foreground" />
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

  const locs = inv.locations.filter((l) => l.warehouseId === warehouseId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !warehouseId) return;
    const payload = {
      name: name.trim(),
      sku: sku.trim() || undefined,
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
        <Field label="Nombre"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      inv.updateWarehouse(editing.id, { name: name.trim(), address: address.trim() || undefined });
      toast.success("Inventario actualizado");
    } else {
      inv.addWarehouse({ name: name.trim(), address: address.trim() || undefined });
      toast.success("Inventario creado");
    }
    onClose();
  };

  return (
    <Modal title={editing ? "Editar inventario" : "Nuevo inventario / local"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !warehouseId) return;
    if (editing) {
      inv.updateLocation(editing.id, { warehouseId, name: name.trim(), detail: detail.trim() || undefined });
      toast.success("Ubicación actualizada");
    } else {
      inv.addLocation({ warehouseId, name: name.trim(), detail: detail.trim() || undefined });
      toast.success("Ubicación añadida");
    }
    onClose();
  };

  return (
    <Modal title={editing ? "Editar ubicación" : "Nueva ubicación"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <Field label="Inventario">
          <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            {inv.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
        <Field label="Nombre (estantería, mueble, repisa…)"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Estantería A" /></Field>
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