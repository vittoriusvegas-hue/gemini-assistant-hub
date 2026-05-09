import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  imageUrl?: string;
  createdAt: number;
}

export interface StorageLocation {
  id: string;
  warehouseId: string;
  /** Estantería, mueble, repisa, gaveta, etc. */
  name: string;
  /** Optional sub-position: "Fila 2 - Pos 3" */
  detail?: string;
  imageUrl?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  imageUrl?: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  /** Threshold for low-stock alert */
  minQuantity: number;
  alertEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "pulse.inventory.v1";

const SEED_WAREHOUSES: Warehouse[] = [
  { id: "w-main", name: "Bodega Central", address: "Av. Principal 123, CDMX", createdAt: Date.now() - 86400000 * 30 },
  { id: "w-shop", name: "Tienda Roma", address: "Colonia Roma Norte", createdAt: Date.now() - 86400000 * 15 },
];

const SEED_LOCATIONS: StorageLocation[] = [
  { id: "l-1", warehouseId: "w-main", name: "Estantería A", detail: "Repisa 1" },
  { id: "l-2", warehouseId: "w-main", name: "Estantería A", detail: "Repisa 2" },
  { id: "l-3", warehouseId: "w-main", name: "Mueble B", detail: "Cajón superior" },
  { id: "l-4", warehouseId: "w-shop", name: "Vitrina frontal" },
  { id: "l-5", warehouseId: "w-shop", name: "Bodega trasera", detail: "Repisa 3" },
];

const SEED_ITEMS: InventoryItem[] = [
  { id: "i-1", name: "Audífonos Pro X", sku: "AUD-001", warehouseId: "w-main", locationId: "l-1", quantity: 24, unitPrice: 1299, currency: "MXN", minQuantity: 5, alertEnabled: true, createdAt: Date.now() - 86400000 * 10, updatedAt: Date.now() - 86400000 },
  { id: "i-2", name: "Cargador USB-C 30W", sku: "CHR-030", warehouseId: "w-main", locationId: "l-2", quantity: 3, unitPrice: 349, currency: "MXN", minQuantity: 10, alertEnabled: true, createdAt: Date.now() - 86400000 * 9, updatedAt: Date.now() - 3600000 },
  { id: "i-3", name: "Funda silicona iPhone 15", sku: "FND-15", warehouseId: "w-shop", locationId: "l-4", quantity: 18, unitPrice: 199, currency: "MXN", minQuantity: 6, alertEnabled: true, createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 7200000 },
  { id: "i-4", name: "Smartwatch Lite", sku: "SWL-22", warehouseId: "w-shop", locationId: "l-5", quantity: 0, unitPrice: 1899, currency: "MXN", minQuantity: 2, alertEnabled: true, createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 1800000 },
];

interface State {
  warehouses: Warehouse[];
  locations: StorageLocation[];
  items: InventoryItem[];
  // Warehouses
  addWarehouse: (input: { name: string; address?: string; imageUrl?: string }) => string;
  updateWarehouse: (id: string, patch: Partial<Omit<Warehouse, "id" | "createdAt">>) => void;
  removeWarehouse: (id: string) => void;
  // Locations
  addLocation: (input: { warehouseId: string; name: string; detail?: string; imageUrl?: string }) => string;
  updateLocation: (id: string, patch: Partial<Omit<StorageLocation, "id">>) => void;
  removeLocation: (id: string) => void;
  // Items
  addItem: (input: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => string;
  updateItem: (id: string, patch: Partial<Omit<InventoryItem, "id" | "createdAt">>) => void;
  adjustQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  // Derived
  lowStockItems: InventoryItem[];
  grandTotal: number;
}

const Ctx = createContext<State | null>(null);

function uid() { return Math.random().toString(36).slice(2, 10); }

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(SEED_WAREHOUSES);
  const [locations, setLocations] = useState<StorageLocation[]>(SEED_LOCATIONS);
  const [items, setItems] = useState<InventoryItem[]>(SEED_ITEMS);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.warehouses) setWarehouses(parsed.warehouses);
        if (parsed?.locations) setLocations(parsed.locations);
        if (parsed?.items) setItems(parsed.items);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ warehouses, locations, items })); } catch { /* ignore */ }
  }, [warehouses, locations, items]);

  const addWarehouse: State["addWarehouse"] = useCallback((input) => {
    const id = "w-" + uid();
    setWarehouses((p) => [...p, { id, name: input.name, address: input.address, imageUrl: input.imageUrl, createdAt: Date.now() }]);
    return id;
  }, []);
  const updateWarehouse: State["updateWarehouse"] = useCallback((id, patch) => {
    setWarehouses((p) => p.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);
  const removeWarehouse: State["removeWarehouse"] = useCallback((id) => {
    setWarehouses((p) => p.filter((w) => w.id !== id));
    setLocations((p) => p.filter((l) => l.warehouseId !== id));
    setItems((p) => p.filter((i) => i.warehouseId !== id));
  }, []);

  const addLocation: State["addLocation"] = useCallback((input) => {
    const id = "l-" + uid();
    setLocations((p) => [...p, { id, ...input }]);
    return id;
  }, []);
  const updateLocation: State["updateLocation"] = useCallback((id, patch) => {
    setLocations((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);
  const removeLocation: State["removeLocation"] = useCallback((id) => {
    setLocations((p) => p.filter((l) => l.id !== id));
    setItems((p) => p.map((i) => (i.locationId === id ? { ...i, locationId: undefined } : i)));
  }, []);

  const addItem: State["addItem"] = useCallback((input) => {
    const id = "i-" + uid();
    const now = Date.now();
    setItems((p) => [{ ...input, id, createdAt: now, updatedAt: now }, ...p]);
    return id;
  }, []);
  const updateItem: State["updateItem"] = useCallback((id, patch) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)));
  }, []);
  const adjustQuantity: State["adjustQuantity"] = useCallback((id, delta) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta), updatedAt: Date.now() } : i)));
  }, []);
  const removeItem: State["removeItem"] = useCallback((id) => {
    setItems((p) => p.filter((i) => i.id !== id));
  }, []);

  const lowStockItems = useMemo(
    () => items.filter((i) => i.alertEnabled && i.quantity <= i.minQuantity),
    [items],
  );
  const grandTotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), [items]);

  const value = useMemo<State>(() => ({
    warehouses, locations, items,
    addWarehouse, updateWarehouse, removeWarehouse,
    addLocation, updateLocation, removeLocation,
    addItem, updateItem, adjustQuantity, removeItem,
    lowStockItems, grandTotal,
  }), [warehouses, locations, items, addWarehouse, updateWarehouse, removeWarehouse, addLocation, updateLocation, removeLocation, addItem, updateItem, adjustQuantity, removeItem, lowStockItems, grandTotal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInventory must be used inside InventoryProvider");
  return ctx;
}

export function formatMoney(amount: number, currency = "MXN") {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}