"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ListItem { id: string; name: string; }

const DEFAULT_EXPENSE_CATEGORIES: ListItem[] = [
  { id: "ec1", name: "Other (Tea)" },
  { id: "ec2", name: "Service (Machine Repairing)" },
  { id: "ec3", name: "Raw Material (Material)" },
  { id: "ec4", name: "Transportation (Rickshaw Charge)" },
  { id: "ec5", name: "Rent (Office Rent)" },
  { id: "ec6", name: "Fuel (Petrol)" },
  { id: "ec7", name: "Bill (Electricity Bill)" },
  { id: "ec8", name: "Salary (Employee Salary)" },
];

const DEFAULT_EXPENSE_SUPPLIERS: ListItem[] = [
  { id: "es1", name: "Raj Electricals" },
  { id: "es2", name: "City Transport" },
];

const DEFAULT_EXPENSE_ITEMS: ListItem[] = [
  { id: "ei1", name: "Office Supplies" },
  { id: "ei2", name: "Diesel (Litre)" },
];

const DEFAULT_INCOME_CATEGORIES: ListItem[] = [
  { id: "ic1", name: "Sales Income" },
  { id: "ic2", name: "Service Income" },
  { id: "ic3", name: "Commission" },
];

const DEFAULT_INCOME_SUPPLIERS: ListItem[] = [
  { id: "is1", name: "Mehta Co." },
  { id: "is2", name: "Gupta & Co." },
];

function ItemList({
  items, onAdd, onEdit, onDelete, addLabel, accent,
}: {
  items: ListItem[];
  onAdd: () => void;
  onEdit: (item: ListItem) => void;
  onDelete: (item: ListItem) => void;
  addLabel: string;
  accent: string;
}) {
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 text-sm text-foreground font-medium">{item.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-secondary hover:text-foreground transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => onDelete(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No items yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        style={{ color: accent, background: accent + "12", border: `1px solid ${accent}25` }}>
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

function AddItemModal({ title, onClose, onSave, accent }: {
  title: string; onClose: () => void; onSave: (name: string) => void; accent: string;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="Enter name..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all" />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={() => { if (value.trim()) { onSave(value.trim()); onClose(); } }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: accent }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Expense Settings ── */
export function ExpenseSettings() {
  const [tab, setTab] = useState<"categories" | "suppliers" | "items">("categories");
  const [categories, setCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [suppliers, setSuppliers]   = useState(DEFAULT_EXPENSE_SUPPLIERS);
  const [items, setItems]           = useState(DEFAULT_EXPENSE_ITEMS);
  const [addModal, setAddModal]     = useState<string | null>(null);

  const TABS = [
    { id: "categories", label: "Categories" },
    { id: "suppliers",  label: "Suppliers" },
    { id: "items",      label: "Expense Items" },
  ] as const;

  function handleAdd(type: string, name: string) {
    const newItem = { id: crypto.randomUUID(), name };
    if (type === "categories") setCategories((p) => [...p, newItem]);
    if (type === "suppliers")  setSuppliers((p) => [...p, newItem]);
    if (type === "items")      setItems((p) => [...p, newItem]);
    toast.success(`${name} added`);
  }

  function handleDelete(type: string, item: ListItem) {
    if (type === "categories") setCategories((p) => p.filter((i) => i.id !== item.id));
    if (type === "suppliers")  setSuppliers((p) => p.filter((i) => i.id !== item.id));
    if (type === "items")      setItems((p) => p.filter((i) => i.id !== item.id));
    toast.error(`${item.name} deleted`);
  }

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex items-center bg-white rounded-xl border border-border p-1 gap-1 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
              tab === t.id ? "bg-brand-900 text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "categories" && (
        <ItemList items={categories} accent="#16532d"
          addLabel="Add Expense Category"
          onAdd={() => setAddModal("categories")}
          onEdit={(i) => toast.info(`Edit ${i.name} — coming soon`)}
          onDelete={(i) => handleDelete("categories", i)}
        />
      )}
      {tab === "suppliers" && (
        <ItemList items={suppliers} accent="#16532d"
          addLabel="Add Supplier"
          onAdd={() => setAddModal("suppliers")}
          onEdit={(i) => toast.info(`Edit ${i.name} — coming soon`)}
          onDelete={(i) => handleDelete("suppliers", i)}
        />
      )}
      {tab === "items" && (
        <ItemList items={items} accent="#16532d"
          addLabel="Add Expense Item"
          onAdd={() => setAddModal("items")}
          onEdit={(i) => toast.info(`Edit ${i.name} — coming soon`)}
          onDelete={(i) => handleDelete("items", i)}
        />
      )}

      {addModal && (
        <AddItemModal
          title={`Add ${addModal === "categories" ? "Expense Category" : addModal === "suppliers" ? "Supplier" : "Expense Item"}`}
          accent="#16532d"
          onClose={() => setAddModal(null)}
          onSave={(name) => handleAdd(addModal, name)}
        />
      )}
    </div>
  );
}

/* ── Income Settings ── */
export function IncomeSettings() {
  const [tab, setTab] = useState<"categories" | "suppliers">("categories");
  const [categories, setCategories] = useState(DEFAULT_INCOME_CATEGORIES);
  const [suppliers, setSuppliers]   = useState(DEFAULT_INCOME_SUPPLIERS);
  const [addModal, setAddModal]     = useState<string | null>(null);

  function handleAdd(type: string, name: string) {
    const newItem = { id: crypto.randomUUID(), name };
    if (type === "categories") setCategories((p) => [...p, newItem]);
    if (type === "suppliers")  setSuppliers((p) => [...p, newItem]);
    toast.success(`${name} added`);
  }

  function handleDelete(type: string, item: ListItem) {
    if (type === "categories") setCategories((p) => p.filter((i) => i.id !== item.id));
    if (type === "suppliers")  setSuppliers((p) => p.filter((i) => i.id !== item.id));
    toast.error(`${item.name} deleted`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center bg-white rounded-xl border border-border p-1 gap-1 w-fit">
        {(["categories", "suppliers"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
              tab === t ? "bg-brand-900 text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}>
            {t === "categories" ? "Categories" : "Suppliers"}
          </button>
        ))}
      </div>

      {tab === "categories" && (
        <ItemList items={categories} accent="#16532d"
          addLabel="Add Income Category"
          onAdd={() => setAddModal("categories")}
          onEdit={(i) => toast.info(`Edit ${i.name}`)}
          onDelete={(i) => handleDelete("categories", i)}
        />
      )}
      {tab === "suppliers" && (
        <ItemList items={suppliers} accent="#16532d"
          addLabel="Add Supplier"
          onAdd={() => setAddModal("suppliers")}
          onEdit={(i) => toast.info(`Edit ${i.name}`)}
          onDelete={(i) => handleDelete("suppliers", i)}
        />
      )}

      {addModal && (
        <AddItemModal
          title={`Add ${addModal === "categories" ? "Income Category" : "Supplier"}`}
          accent="#16532d"
          onClose={() => setAddModal(null)}
          onSave={(name) => handleAdd(addModal, name)}
        />
      )}
    </div>
  );
}
