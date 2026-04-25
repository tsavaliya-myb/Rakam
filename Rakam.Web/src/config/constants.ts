import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",    label: "Dashboard",        href: "/dashboard",        icon: "LayoutDashboard" },
  { id: "bill",         label: "Sales Bill",        href: "/bill",             icon: "FileText" },
  { id: "purchase",     label: "Purchase Bill",     href: "/purchase-bill",    icon: "ShoppingCart" },
  { id: "challan",      label: "Delivery Challan",  href: "/delivery-challan", icon: "Truck" },
  // { id: "eway",         label: "E-Way Bill",        href: "/eway-bill",        icon: "Zap" },
  { id: "firm",         label: "Manage Firm",       href: "/manage-firm",      icon: "Building2" },
  { id: "party",        label: "Party",             href: "/party",            icon: "Users" },
  { id: "product",      label: "Products",          href: "/product",          icon: "Package" },
  { id: "expense",      label: "Expense Tracker",   href: "/expense-tracker",  icon: "Receipt" },
  { id: "transactions", label: "Transactions",      href: "/transactions",     icon: "ArrowLeftRight" },
  { id: "reports",      label: "Reports",           href: "/reports",          icon: "BarChart3" },
  { id: "settings",     label: "Settings",          href: "/setting",          icon: "Settings" },
];

export const UNIT_OPTIONS = [
  "Pcs", "KG", "Mtr", "Ltr.", "Gm", "Page", "Bag", "Gross", "BOX",
  "Yard", "Packet", "TON", "Room", "Roll", "Day", "Trip", "CM",
  "Carat", "Visit", "TP", "BRASS", "SQFT", "Milestone",
] as const;

export const GST_OPTIONS = [
  "0%", "0.25%", "1%", "1.50%", "3%", "5%", "6%",
  "7.5%", "12%", "18%", "28%",
] as const;

export const PAYMENT_MODES = ["Cash", "Cheque", "Online", "Other"] as const;

export const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
  "Puducherry",
] as const;

export const REPORT_TYPES = [
  "Payment", "Transaction", "Product", "Expense", "Income",
  "Purchase Bill With GST", "Purchase Bill Without GST",
  "Sales Bill with GST", "Sales Bill without GST",
  "TDS Payable", "TDS Receivable", "TCS Payable", "TCS Receivable",
  "Sales Bill (GST) Report with Items", "Sales Bill (W/O GST) Report with Items",
  "Purchase Bill (GST) Report with Items", "Purchase Bill (W/O GST) Report with Items",
  "Sales Outstanding Report", "Purchase Outstanding Report",
  "Delivery Challan Report", "Credit Note Report", "Profit & Loss Report",
] as const;

export const RECORDS_PER_PAGE_OPTIONS = [10, 20, 30, 40, 50, 100] as const;
