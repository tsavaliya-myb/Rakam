"use client";

import { useState, useMemo } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { PartyModal } from "@/components/party/PartyModal";
import { MOCK_PARTIES, PARTY_BALANCES } from "@/lib/mock/parties";
import { cn, formatCurrency } from "@/lib/utils";
import type { Party } from "@/types";
import type { PartyFormValues } from "@/lib/schemas/party-product.schema";
import { toast } from "sonner";

export default function PartyPage() {
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editParty, setEditParty]   = useState<Party | undefined>();
  const [pageSize, setPageSize]     = useState(20);
  const [openMenu, setOpenMenu]     = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_PARTIES;
    const q = search.toLowerCase();
    return MOCK_PARTIES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.gstNo?.toLowerCase().includes(q) ?? false) ||
        (p.panCard?.toLowerCase().includes(q) ?? false)
    );
  }, [search]);

  function openAdd() { setEditParty(undefined); setModalOpen(true); }
  function openEdit(party: Party) { setEditParty(party); setModalOpen(true); }

  function handleSubmit(data: PartyFormValues) {
    toast.success(editParty ? `${data.name} updated` : `${data.name} added`);
    setModalOpen(false);
  }

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Party</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customers and suppliers used across bills and challans.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={15} /> Add Party
        </button>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-lg border border-border bg-white text-foreground outline-none"
          >
            {[10, 20, 30, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[220px] max-w-sm relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search party name, GST, PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-white text-foreground outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              {["Party Name", "GST No.", "PAN Number", "Pay / Receive", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.slice(0, pageSize).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No parties found.
                </td>
              </tr>
            ) : (
              filtered.slice(0, pageSize).map((party) => {
                const balance = PARTY_BALANCES[party.id] ?? 0;
                const isReceive = balance >= 0;

                return (
                  <tr key={party.id}
                    className="border-b border-border last:border-0 hover:bg-brand-50/30 transition-colors">

                    {/* Party Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-brand-900">
                            {party.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{party.name}</p>
                          {party.ownerName && (
                            <p className="text-[11px] text-muted-foreground">{party.ownerName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* GST */}
                    <td className="px-4 py-3">
                      {party.gstNo ? (
                        <span className="text-xs font-mono text-foreground">{party.gstNo}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* PAN */}
                    <td className="px-4 py-3">
                      {party.panCard ? (
                        <span className="text-xs font-mono text-foreground">{party.panCard}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Pay / Receive */}
                    <td className="px-4 py-3">
                      {balance === 0 ? (
                        <span className="text-xs text-muted-foreground">Settled</span>
                      ) : (
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                          isReceive
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        )}>
                          {isReceive
                            ? <ArrowDown size={12} className="text-green-500" />
                            : <ArrowUp size={12} className="text-red-500" />}
                          {formatCurrency(Math.abs(balance))}
                          <span className="font-normal text-[10px] opacity-70">
                            {isReceive ? "to receive" : "to pay"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === party.id ? null : party.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-secondary transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenu === party.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-border py-1 z-50 animate-fade-in">
                              <button
                                onClick={() => { openEdit(party); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                              >
                                <Pencil size={13} /> Edit
                              </button>
                              <button
                                onClick={() => { toast.error(`Delete ${party.name} — confirm`); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3 px-1">
        Showing <span className="font-semibold text-foreground">{Math.min(filtered.length, pageSize)}</span> of{" "}
        <span className="font-semibold text-foreground">{filtered.length}</span> parties
      </p>

      {/* ── Modal ── */}
      {modalOpen && (
        <PartyModal
          party={editParty}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
