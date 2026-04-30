"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useExpenseCategories,
  useCreateCategory,
  useExpenseSuppliers,
  useCreateSupplier,
} from "@/hooks/api/use-expenses";
import {
  useIncomeCategories,
  useCreateIncomeCategory,
  useDeleteIncomeCategory,
  useIncomeSuppliers,
  useCreateIncomeSupplier,
  useDeleteIncomeSupplier,
} from "@/hooks/api/use-settings";
import type { ExpenseCategory, ExpenseSupplier, IncomeCategory, IncomeSupplier } from "@/types";

interface ListItem { id: string; name: string; }

function ItemList({
  items, onAdd, onEdit, onDelete, addLabel, accent, isLoading,
}: {
  items: ListItem[];
  onAdd: () => void;
  onEdit: (item: ListItem) => void;
  onDelete: (item: ListItem) => void;
  addLabel: string;
  accent: string;
  isLoading?: boolean;
}) {
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
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
        )}
      </div>
      <button onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        style={{ color: accent, background: accent + "12", border: `1px solid ${accent}25` }}>
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

function AddItemModal({ title, onClose, onSave, accent, isSaving }: {
  title: string; onClose: () => void; onSave: (name: string) => void; accent: string; isSaving?: boolean;
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
          <button
            disabled={isSaving}
            onClick={() => { if (value.trim()) onSave(value.trim()); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: accent }}>
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Expense Settings ── */
export function ExpenseSettings() {
  const [tab, setTab] = useState<"categories" | "suppliers">("categories");
  const [addModal, setAddModal] = useState<"categories" | "suppliers" | null>(null);

  const { data: categoriesData, isLoading: catLoading } = useExpenseCategories();
  const { data: suppliersData,  isLoading: supLoading  } = useExpenseSuppliers();
  const createCategory = useCreateCategory();
  const createSupplier = useCreateSupplier();

  const categories: ListItem[] = (categoriesData ?? []).map((c: ExpenseCategory) => ({ id: c.id, name: c.name }));
  const suppliers:  ListItem[] = (suppliersData  ?? []).map((s: ExpenseSupplier) => ({ id: s.id, name: s.name }));

  const TABS = [
    { id: "categories" as const, label: "Categories" },
    { id: "suppliers"  as const, label: "Suppliers" },
  ];

  function handleAdd(name: string) {
    if (addModal === "categories") {
      createCategory.mutate(name, { onSuccess: () => setAddModal(null) });
    } else if (addModal === "suppliers") {
      createSupplier.mutate({ name }, { onSuccess: () => setAddModal(null) });
    }
  }

  const isSaving = createCategory.isPending || createSupplier.isPending;

  return (
    <div className="space-y-5">
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
        <ItemList
          items={categories}
          isLoading={catLoading}
          accent="#16532d"
          addLabel="Add Expense Category"
          onAdd={() => setAddModal("categories")}
          onEdit={(i) => toast.info(`Edit ${i.name} — coming soon`)}
          onDelete={(i) => toast.info(`Delete ${i.name} — not supported via API`)}
        />
      )}
      {tab === "suppliers" && (
        <ItemList
          items={suppliers}
          isLoading={supLoading}
          accent="#16532d"
          addLabel="Add Supplier"
          onAdd={() => setAddModal("suppliers")}
          onEdit={(i) => toast.info(`Edit ${i.name} — coming soon`)}
          onDelete={(i) => toast.info(`Delete ${i.name} — not supported via API`)}
        />
      )}

      {addModal && (
        <AddItemModal
          title={addModal === "categories" ? "Add Expense Category" : "Add Supplier"}
          accent="#16532d"
          isSaving={isSaving}
          onClose={() => setAddModal(null)}
          onSave={handleAdd}
        />
      )}
    </div>
  );
}

/* ── Income Settings ── */
export function IncomeSettings() {
  const [tab, setTab] = useState<"categories" | "suppliers">("categories");
  const [addModal, setAddModal] = useState<"categories" | "suppliers" | null>(null);

  const { data: categoriesData, isLoading: catLoading } = useIncomeCategories();
  const { data: suppliersData,  isLoading: supLoading  } = useIncomeSuppliers();
  const createCategory = useCreateIncomeCategory();
  const deleteCategory = useDeleteIncomeCategory();
  const createSupplier = useCreateIncomeSupplier();
  const deleteSupplier = useDeleteIncomeSupplier();

  const categories: ListItem[] = (categoriesData ?? []).map((c: IncomeCategory) => ({ id: c.id, name: c.name }));
  const suppliers:  ListItem[] = (suppliersData  ?? []).map((s: IncomeSupplier) => ({ id: s.id, name: s.name }));

  function handleAdd(name: string) {
    if (addModal === "categories") {
      createCategory.mutate(name, { onSuccess: () => setAddModal(null) });
    } else if (addModal === "suppliers") {
      createSupplier.mutate(name, { onSuccess: () => setAddModal(null) });
    }
  }

  const isSaving = createCategory.isPending || createSupplier.isPending;

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
          isLoading={catLoading}
          addLabel="Add Income Category"
          onAdd={() => setAddModal("categories")}
          onEdit={(i) => toast.info(`Edit ${i.name} — coming soon`)}
          onDelete={(i) => deleteCategory.mutate(i.id)}
        />
      )}
      {tab === "suppliers" && (
        <ItemList items={suppliers} accent="#16532d"
          isLoading={supLoading}
          addLabel="Add Supplier"
          onAdd={() => setAddModal("suppliers")}
          onEdit={(i) => toast.info(`Edit ${i.name} — coming soon`)}
          onDelete={(i) => deleteSupplier.mutate(i.id)}
        />
      )}

      {addModal && (
        <AddItemModal
          title={`Add ${addModal === "categories" ? "Income Category" : "Supplier"}`}
          accent="#16532d"
          isSaving={isSaving}
          onClose={() => setAddModal(null)}
          onSave={handleAdd}
        />
      )}
    </div>
  );
}
