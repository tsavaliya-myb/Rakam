import type { ReportRow } from "@/types";

// Generic report rows keyed by report type slug
export const MOCK_REPORT_DATA: Record<string, ReportRow[]> = {
  "Payment": [
    { id: "r1", date: "2026-04-01", party: "Mehta Co.",         amount: 100300, mode: "Online",  note: "Online Ref#BZ4859WH", type: "Credit" },
    { id: "r2", date: "2026-04-03", party: "Patel Enterprises", amount: 135700, mode: "Cheque",  note: "Chq#0478596",         type: "Credit" },
    { id: "r3", date: "2026-04-05", party: "Sharma Traders",    amount: 20000,  mode: "Cash",    note: "",                    type: "Debit"  },
    { id: "r4", date: "2026-04-10", party: "Gupta & Co.",       amount: 45000,  mode: "Cheque",  note: "Chq#0001234",         type: "Debit"  },
    { id: "r5", date: "2026-04-15", party: "Reddy Brothers",    amount: 82600,  mode: "Online",  note: "UPI#RB8765432",       type: "Credit" },
  ],
  "Transaction": [
    { id: "t1", date: "2026-04-01", party: "Mehta Co.",         ref: "TXN-001", amount: 100300, type: "Credit", for: "Sale/INV#001" },
    { id: "t2", date: "2026-04-03", party: "Patel Enterprises", ref: "TXN-002", amount: 135700, type: "Credit", for: "Sale/INV#002" },
    { id: "t3", date: "2026-04-05", party: "Sharma Traders",    ref: "TXN-003", amount: 20000,  type: "Debit",  for: "Purchase#01"  },
  ],
  "Product": [
    { id: "p1", name: "Steel Plates",   itemCode: "SP-001", hsnCode: "7208", unit: "KG",  qty: 500, rate: 85,   amount: 42500  },
    { id: "p2", name: "Copper Wire",    itemCode: "CW-002", hsnCode: "7408", unit: "Mtr", qty: 200, rate: 120,  amount: 24000  },
    { id: "p3", name: "PVC Pipe 2in",   itemCode: "PP-003", hsnCode: "3917", unit: "Mtr", qty: 150, rate: 45,   amount: 6750   },
    { id: "p4", name: "Cement 50kg",    itemCode: "CM-004", hsnCode: "2523", unit: "Bag", qty: 80,  rate: 350,  amount: 28000  },
  ],
  "Expense": [
    { id: "e1", date: "2026-04-02", category: "Fuel",           supplier: "Reliance Industries", amount: 2500  },
    { id: "e2", date: "2026-04-05", category: "Salary",         supplier: "",                    amount: 18000 },
    { id: "e3", date: "2026-04-08", category: "Bill",           supplier: "Local Vendor",        amount: 3450  },
    { id: "e4", date: "2026-04-10", category: "Raw Material",   supplier: "Tata Motors",         amount: 42000 },
  ],
  "Income": [
    { id: "i1", date: "2026-04-01", category: "Sales",          source: "Mehta Co.",             amount: 100300 },
    { id: "i2", date: "2026-04-03", category: "Sales",          source: "Patel Enterprises",     amount: 135700 },
    { id: "i3", date: "2026-04-07", category: "Commission",     source: "Joshi Limited",         amount: 5000   },
  ],
  "Sales Bill with GST": [
    { id: "sb1", date: "2026-04-01", billNo: "INV-001", party: "Mehta Co.",         taxable: 85000, gst: 15300, total: 100300, pending: 100300, status: "UNPAID" },
    { id: "sb2", date: "2026-04-03", billNo: "INV-002", party: "Patel Enterprises", taxable: 115000,gst: 20700, total: 135700, pending: 0,      status: "PAID"   },
    { id: "sb3", date: "2026-04-07", billNo: "INV-003", party: "Joshi Limited",     taxable: 67000, gst: 12060, total: 79060,  pending: 79060,  status: "UNPAID" },
  ],
  "Sales Bill without GST": [
    { id: "sb4", date: "2026-04-05", billNo: "JC-001", party: "Sharma Traders",  total: 35000,  pending: 35000, status: "UNPAID" },
    { id: "sb5", date: "2026-04-12", billNo: "JC-002", party: "Singh Fabrics",   total: 48000,  pending: 0,     status: "PAID"   },
  ],
  "Purchase Bill With GST": [
    { id: "pb1", date: "2026-04-04", billNo: "PUR-001", party: "Sharma Traders",     taxable: 16949, gst: 3051,  total: 20000,  pending: 20000,  status: "UNPAID" },
    { id: "pb2", date: "2026-04-10", billNo: "PUR-002", party: "Gupta & Co.",        taxable: 38136, gst: 6864,  total: 45000,  pending: 0,      status: "PAID"   },
  ],
  "Purchase Bill Without GST": [
    { id: "pb3", date: "2026-04-18", billNo: "PUR-003", party: "Singh Fabrics",  total: 15000, pending: 15000, status: "UNPAID" },
  ],
  "Sales Outstanding Report": [
    { id: "so1", party: "Mehta Co.",         totalBilled: 100300, received: 0,      outstanding: 100300 },
    { id: "so2", party: "Patel Enterprises", totalBilled: 135700, received: 135700, outstanding: 0      },
    { id: "so3", party: "Joshi Limited",     totalBilled: 79060,  received: 0,      outstanding: 79060  },
    { id: "so4", party: "Reddy Brothers",    totalBilled: 82600,  received: 0,      outstanding: 82600  },
  ],
  "Purchase Outstanding Report": [
    { id: "po1", party: "Sharma Traders",  totalBilled: 20000, paid: 0,     outstanding: 20000 },
    { id: "po2", party: "Gupta & Co.",     totalBilled: 45000, paid: 45000, outstanding: 0     },
    { id: "po3", party: "Singh Fabrics",   totalBilled: 15000, paid: 0,     outstanding: 15000 },
  ],
  "Delivery Challan Report": [
    { id: "dc1", date: "2026-04-06", dcNo: "DC-001", party: "Sharma Traders",    totalQty: 50, salesBill: "JC-001" },
    { id: "dc2", date: "2026-04-09", dcNo: "DC-002", party: "Desai Manufacturing",totalQty: 30, salesBill: ""       },
  ],
  "Profit & Loss Report": [
    { id: "pl1", label: "Total Sales",     amount: 397560 },
    { id: "pl2", label: "Total Purchases", amount: 80000  },
    { id: "pl3", label: "Total Expenses",  amount: 87300  },
    { id: "pl4", label: "Gross Profit",    amount: 317560 },
    { id: "pl5", label: "Net Profit",      amount: 230260 },
  ],
};

// Column definitions per report type
export const REPORT_COLUMNS: Record<string, { key: string; label: string }[]> = {
  "Payment": [
    { key: "date", label: "Date" }, { key: "party", label: "Party" },
    { key: "amount", label: "Amount (₹)" }, { key: "mode", label: "Mode" },
    { key: "type", label: "Type" }, { key: "note", label: "Note" },
  ],
  "Transaction": [
    { key: "date", label: "Date" }, { key: "ref", label: "Ref. No." },
    { key: "party", label: "Party" }, { key: "for", label: "For" },
    { key: "amount", label: "Amount (₹)" }, { key: "type", label: "Type" },
  ],
  "Product": [
    { key: "name", label: "Product" }, { key: "itemCode", label: "Item Code" },
    { key: "hsnCode", label: "HSN Code" }, { key: "unit", label: "Unit" },
    { key: "qty", label: "Qty" }, { key: "rate", label: "Rate (₹)" },
    { key: "amount", label: "Amount (₹)" },
  ],
  "Expense": [
    { key: "date", label: "Date" }, { key: "category", label: "Category" },
    { key: "supplier", label: "Supplier" }, { key: "amount", label: "Amount (₹)" },
  ],
  "Income": [
    { key: "date", label: "Date" }, { key: "category", label: "Category" },
    { key: "source", label: "Source" }, { key: "amount", label: "Amount (₹)" },
  ],
  "Sales Bill with GST": [
    { key: "date", label: "Date" }, { key: "billNo", label: "Bill No." },
    { key: "party", label: "Party" }, { key: "taxable", label: "Taxable (₹)" },
    { key: "gst", label: "GST (₹)" }, { key: "total", label: "Total (₹)" },
    { key: "pending", label: "Pending (₹)" }, { key: "status", label: "Status" },
  ],
  "Sales Bill without GST": [
    { key: "date", label: "Date" }, { key: "billNo", label: "Bill No." },
    { key: "party", label: "Party" }, { key: "total", label: "Total (₹)" },
    { key: "pending", label: "Pending (₹)" }, { key: "status", label: "Status" },
  ],
  "Purchase Bill With GST": [
    { key: "date", label: "Date" }, { key: "billNo", label: "Bill No." },
    { key: "party", label: "Party" }, { key: "taxable", label: "Taxable (₹)" },
    { key: "gst", label: "GST (₹)" }, { key: "total", label: "Total (₹)" },
    { key: "pending", label: "Pending (₹)" }, { key: "status", label: "Status" },
  ],
  "Purchase Bill Without GST": [
    { key: "date", label: "Date" }, { key: "billNo", label: "Bill No." },
    { key: "party", label: "Party" }, { key: "total", label: "Total (₹)" },
    { key: "pending", label: "Pending (₹)" }, { key: "status", label: "Status" },
  ],
  "Sales Outstanding Report": [
    { key: "party", label: "Party" }, { key: "totalBilled", label: "Total Billed (₹)" },
    { key: "received", label: "Received (₹)" }, { key: "outstanding", label: "Outstanding (₹)" },
  ],
  "Purchase Outstanding Report": [
    { key: "party", label: "Party" }, { key: "totalBilled", label: "Total Billed (₹)" },
    { key: "paid", label: "Paid (₹)" }, { key: "outstanding", label: "Outstanding (₹)" },
  ],
  "Delivery Challan Report": [
    { key: "date", label: "Date" }, { key: "dcNo", label: "D.Ch. No." },
    { key: "party", label: "Party" }, { key: "totalQty", label: "Total Qty" },
    { key: "salesBill", label: "Sales Bill No." },
  ],
  "Profit & Loss Report": [
    { key: "label", label: "Description" }, { key: "amount", label: "Amount (₹)" },
  ],
};
