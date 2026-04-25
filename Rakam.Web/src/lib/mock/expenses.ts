import type { Expense } from "@/types";

export const MOCK_EXPENSE_CATEGORIES = [
  { id: "ec1", name: "Other",          example: "Tea" },
  { id: "ec2", name: "Service",        example: "Machine Repairing" },
  { id: "ec3", name: "Raw Material",   example: "Material" },
  { id: "ec4", name: "Transportation", example: "Rickshaw Charge" },
  { id: "ec5", name: "Rent",           example: "Office Rent" },
  { id: "ec6", name: "Fuel",           example: "Petrol" },
  { id: "ec7", name: "Bill",           example: "Electricity Bill" },
  { id: "ec8", name: "Salary",         example: "Employee Salary" },
];

export const MOCK_EXPENSE_SUPPLIERS = [
  { id: "es1", name: "Reliance Industries" },
  { id: "es2", name: "Tata Motors" },
  { id: "es3", name: "Local Vendor" },
  { id: "es4", name: "Office Supplies Co." },
];

export const MOCK_EXPENSE_ITEMS = [
  { id: "ei1", name: "Diesel" },
  { id: "ei2", name: "Office Paper" },
  { id: "ei3", name: "Printer Cartridge" },
  { id: "ei4", name: "Tea & Snacks" },
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: "exp1",
    date: "2026-04-02",
    category: "Fuel",
    supplierName: "Reliance Industries",
    amount: 2500,
    note: "Petrol for delivery vehicle",
    mode: "AMOUNT",
  },
  {
    id: "exp2",
    date: "2026-04-05",
    category: "Salary",
    supplierName: undefined,
    amount: 18000,
    note: "April salary - Rohan",
    mode: "AMOUNT",
  },
  {
    id: "exp3",
    date: "2026-04-08",
    category: "Bill",
    supplierName: "Local Vendor",
    amount: 3450,
    note: "Electricity bill - March",
    mode: "AMOUNT",
  },
  {
    id: "exp4",
    date: "2026-04-10",
    category: "Raw Material",
    supplierName: "Tata Motors",
    amount: 42000,
    note: "Steel plates",
    mode: "ITEM",
    expenseItem: "Steel",
    qty: 20,
    rate: 2100,
  },
  {
    id: "exp5",
    date: "2026-04-12",
    category: "Transportation",
    amount: 800,
    note: "Rickshaw charge",
    mode: "AMOUNT",
  },
  {
    id: "exp6",
    date: "2026-04-15",
    category: "Other",
    amount: 350,
    note: "Tea & snacks for clients",
    mode: "AMOUNT",
  },
  {
    id: "exp7",
    date: "2026-04-18",
    category: "Service",
    supplierName: "Office Supplies Co.",
    amount: 5500,
    note: "Machine repairing",
    mode: "AMOUNT",
  },
  {
    id: "exp8",
    date: "2026-04-20",
    category: "Rent",
    amount: 15000,
    note: "Office rent - April",
    mode: "AMOUNT",
  },
];
