"use client";

import { useState, useMemo } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { ProductModal } from "@/components/product/ProductModal";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import type { ProductFormValues } from "@/lib/schemas/party-product.schema";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/api/use-products";

export default function ProductPage() {
  const [search, setSearch]       = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProd, setEditProd]   = useState<Product | undefined>();
  const [pageSize, setPageSize]   = useState(20);
  const [openMenu, setOpenMenu]   = useState<string | null>(null);

  const { data, isLoading, isError, error } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = data?.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.itemCode?.toLowerCase().includes(q) ?? false) ||
        (p.hsnCode?.toLowerCase().includes(q) ?? false)
    );
  }, [search, products]);

  function openAdd() { setEditProd(undefined); setModalOpen(true); }
  function openEdit(p: Product) { setEditProd(p); setModalOpen(true); }

  async function handleSubmit(formData: ProductFormValues) {
    const dto = {
      name: formData.name,
      rate: formData.rate,
      unit: formData.unit,
      gst: formData.gst ? Number(formData.gst) : undefined,
      itemCode: formData.itemCode || undefined,
      hsnCode: formData.hsnCode || undefined,
      description: formData.description || undefined,
    };
    if (editProd) {
      await updateProduct.mutateAsync({ id: editProd.id, dto });
    } else {
      await createProduct.mutateAsync(dto);
    }
    setModalOpen(false);
  }

  function handleDelete(product: Product) {
    deleteProduct.mutate(product.id);
    setOpenMenu(null);
  }

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product master — rates, units, HSN codes auto-fill in bills.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show</span>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-lg border border-border bg-white text-foreground outline-none">
            {[10, 20, 30, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[220px] max-w-sm relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search name, item code, HSN..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-white text-foreground outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-700/10 transition-all placeholder:text-muted-foreground/60" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              {["Product Name", "Item Code", "HSN Code", "Rate", "Unit", "GST", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-destructive">
                  {(error as Error)?.message ?? "Failed to load products."}
                </td>
              </tr>
            ) : filtered.slice(0, pageSize).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  {search ? "No products match your search." : "No products yet. Add your first product."}
                </td>
              </tr>
            ) : (
              filtered.slice(0, pageSize).map((product) => (
                <tr key={product.id}
                  className="border-b border-border last:border-0 hover:bg-violet-50/20 transition-colors">

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#faf5ff] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-700">{product.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{product.name}</p>
                        {product.description && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Item Code */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-foreground">{product.itemCode || "—"}</span>
                  </td>

                  {/* HSN */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-foreground">{product.hsnCode || "—"}</span>
                  </td>

                  {/* Rate */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {product.rate != null ? formatCurrency(product.rate) : "—"}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary border border-border text-muted-foreground">
                      {product.unit}
                    </span>
                  </td>

                  {/* GST */}
                  <td className="px-4 py-3">
                    {product.gst != null ? (
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                        product.gst === 0
                          ? "bg-gray-50 text-gray-500 border-gray-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {product.gst}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-secondary transition-colors"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenu === product.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-border py-1 z-50 animate-fade-in">
                            <button
                              onClick={() => { openEdit(product); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              disabled={deleteProduct.isPending}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !isError && (
        <p className="text-xs text-muted-foreground mt-3 px-1">
          Showing <span className="font-semibold text-foreground">{Math.min(filtered.length, pageSize)}</span> of{" "}
          <span className="font-semibold text-foreground">{data?.total ?? filtered.length}</span> products
        </p>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <ProductModal
          product={editProd}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
