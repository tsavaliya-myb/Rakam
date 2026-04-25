"use client";

import { useState } from "react";
import {
  BarChart3, Download, RotateCcw, ChevronDown, FileText,
} from "lucide-react";
import { ReportTable } from "@/components/reports/ReportTable";
import { MOCK_PARTIES } from "@/lib/mock/parties";
import { MOCK_REPORT_DATA, REPORT_COLUMNS } from "@/lib/mock/reports";
import { REPORT_TYPES } from "@/config/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReportRow } from "@/types";

const FY_START = "2026-04-01";
const FY_END   = "2027-03-31";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>("");
  const [partyId,    setPartyId]    = useState("");
  const [fromDate,   setFromDate]   = useState(FY_START);
  const [toDate,     setToDate]     = useState(FY_END);
  const [generated,  setGenerated]  = useState(false);
  const [reportData, setReportData] = useState<ReportRow[]>([]);

  function handleGenerate() {
    if (!reportType) {
      toast.error("Please select a report type");
      return;
    }
    const raw = MOCK_REPORT_DATA[reportType] ?? [];
    let filtered = [...raw];
    // Party filter (for rows that have a "party" key)
    if (partyId) {
      const party = MOCK_PARTIES.find((p) => p.id === partyId);
      if (party) {
        filtered = filtered.filter((r) =>
          !r.party || r.party === party.name
        );
      }
    }
    setReportData(filtered);
    setGenerated(true);
  }

  function handleReset() {
    setReportType("");
    setPartyId("");
    setFromDate(FY_START);
    setToDate(FY_END);
    setGenerated(false);
    setReportData([]);
  }

  const columns = reportType ? (REPORT_COLUMNS[reportType] ?? []) : [];

  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and export business reports.
          </p>
        </div>
        {generated && (
          <button
            onClick={() => toast.info("Exporting to Excel…")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground bg-white hover:bg-secondary transition-colors"
          >
            <Download size={14} strokeWidth={1.8} /> Export
          </button>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Generate Reports</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Report Type */}
          <div className="lg:col-span-1">
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Report Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => { setReportType(e.target.value); setGenerated(false); }}
                className={cn(
                  "w-full text-sm border border-border rounded-xl px-3 py-2.5 pr-8 bg-white text-foreground",
                  "outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 appearance-none transition-all",
                  !reportType && "text-muted-foreground"
                )}
              >
                <option value="">Select report type</option>
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          {/* Party */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Party Name</label>
            <div className="relative">
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 pr-8 bg-white text-foreground outline-none focus:border-brand-300 appearance-none transition-all"
              >
                <option value="">All Parties</option>
                {MOCK_PARTIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300 transition-all"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm"
          >
            <BarChart3 size={15} /> Generate Report
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* ── Report Output ── */}
      {!generated ? (
        <div className="bg-white rounded-2xl border border-border flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <FileText size={28} strokeWidth={1.5} className="text-brand-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground mb-1">Select a report type to get started</p>
            <p className="text-xs text-muted-foreground">Choose from 22 report types, apply filters and click Generate.</p>
          </div>
          {/* Quick-access report type grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-w-xl w-full px-4">
            {["Sales Bill with GST", "Purchase Bill With GST", "Expense", "Payment", "Profit & Loss Report", "Sales Outstanding Report"].map((t) => (
              <button
                key={t}
                onClick={() => { setReportType(t); }}
                className="px-3 py-2 rounded-xl text-[11px] font-semibold border border-border text-foreground hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors text-left"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Report header strip */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{reportType}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {fromDate} — {toDate}
                {partyId && ` · ${MOCK_PARTIES.find((p) => p.id === partyId)?.name}`}
                {` · ${reportData.length} records`}
              </p>
            </div>
            <button
              onClick={() => toast.info("Printing report…")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border text-foreground bg-white hover:bg-secondary transition-colors"
            >
              Print
            </button>
          </div>

          <ReportTable
            columns={columns}
            data={reportData}
            reportType={reportType}
          />
        </div>
      )}
    </div>
  );
}
