-- CreateEnum
CREATE TYPE "bill_type_enum" AS ENUM ('TAX_INVOICE', 'JOB_CHALLAN');

-- CreateEnum
CREATE TYPE "purchase_bill_type" AS ENUM ('WITH_TAX', 'WITHOUT_TAX');

-- CreateEnum
CREATE TYPE "bill_status_enum" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "payment_mode_enum" AS ENUM ('CASH', 'CHEQUE', 'ONLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "txn_type_enum" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "txn_for_enum" AS ENUM ('SALES', 'PURCHASE', 'EXPENSE', 'INCOME', 'OTHER');

-- CreateEnum
CREATE TYPE "unit_enum" AS ENUM ('PCS', 'KG', 'MTR', 'LTR', 'GM', 'PAGE', 'BAG', 'GROSS', 'BOX', 'YARD', 'PACKET', 'TON', 'ROOM', 'ROLL', 'DAY', 'TRIP', 'CM', 'CARAT', 'VISIT', 'TP', 'BRASS', 'SQFT', 'MILESTONE');

-- CreateEnum
CREATE TYPE "gst_pct_enum" AS ENUM ('0', '0.25', '1', '1.5', '3', '5', '6', '7.5', '12', '18', '28');

-- CreateEnum
CREATE TYPE "discount_scope_enum" AS ENUM ('BILL', 'ITEM');

-- CreateEnum
CREATE TYPE "print_type_enum" AS ENUM ('ORIGINAL', 'DUPLICATE', 'TRIPLICATE');

-- CreateEnum
CREATE TYPE "pdf_template_enum" AS ENUM ('STANDARD', 'MODERN');

-- CreateEnum
CREATE TYPE "expense_mode_enum" AS ENUM ('AMOUNT', 'ITEM');

-- CreateTable
CREATE TABLE "accounts" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "business_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_firm_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "first_name" VARCHAR(80),
    "last_name" VARCHAR(80),
    "profile_photo_key" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firms" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "owner_name" VARCHAR(120),
    "gst_no" VARCHAR(15),
    "pan_no" VARCHAR(10),
    "msme_no" VARCHAR(30),
    "default_gst_pct" "gst_pct_enum",
    "mobile_primary" VARCHAR(15),
    "mobile_secondary" VARCHAR(15),
    "address" TEXT,
    "state" VARCHAR(60),
    "city" VARCHAR(80),
    "pincode" VARCHAR(10),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "show_watermark" BOOLEAN NOT NULL DEFAULT true,
    "show_logo" BOOLEAN NOT NULL DEFAULT true,
    "show_signature" BOOLEAN NOT NULL DEFAULT true,
    "logo_key" TEXT,
    "watermark_key" TEXT,
    "signature_key" TEXT,
    "udhyam_cert_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firm_bank_details" (
    "firm_id" BIGINT NOT NULL,
    "bank_name" VARCHAR(120),
    "branch_name" VARCHAR(120),
    "account_holder_name" VARCHAR(120),
    "account_type" VARCHAR(40),
    "account_no" VARCHAR(30),
    "ifsc_code" VARCHAR(11),

    CONSTRAINT "firm_bank_details_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "dispatch_addresses" (
    "id" BIGSERIAL NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "dispatch_name" VARCHAR(120) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(80),
    "state" VARCHAR(60) NOT NULL,
    "pincode" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eway_gsp_credentials" (
    "firm_id" BIGINT NOT NULL,
    "gsp_username" VARCHAR(120) NOT NULL,
    "gsp_password_enc" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eway_gsp_credentials_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "firm_delivery_challan_settings" (
    "firm_id" BIGINT NOT NULL,
    "show_rate" BOOLEAN NOT NULL DEFAULT true,
    "show_gst_no" BOOLEAN NOT NULL DEFAULT true,
    "default_print_type" "print_type_enum" NOT NULL DEFAULT 'DUPLICATE',
    "show_challan_section" BOOLEAN NOT NULL DEFAULT true,
    "terms_and_conditions" TEXT,
    "pdf_custom_heading" VARCHAR(30),
    "pdf_template" "pdf_template_enum" NOT NULL DEFAULT 'STANDARD',

    CONSTRAINT "firm_delivery_challan_settings_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "firm_other_settings" (
    "firm_id" BIGINT NOT NULL,
    "enable_inventory" BOOLEAN NOT NULL DEFAULT false,
    "allow_sales_without_stock" BOOLEAN NOT NULL DEFAULT false,
    "enable_shortcuts" BOOLEAN NOT NULL DEFAULT true,
    "enable_decimal_values" BOOLEAN NOT NULL DEFAULT true,
    "enable_party_wise_product_rate" BOOLEAN NOT NULL DEFAULT false,
    "enable_shipment_address" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "firm_other_settings_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "firm_sales_bill_settings" (
    "firm_id" BIGINT NOT NULL,
    "show_due_details_in_invoice" BOOLEAN NOT NULL DEFAULT false,
    "show_gst_in_job_challan" BOOLEAN NOT NULL DEFAULT true,
    "default_print_type" "print_type_enum" NOT NULL DEFAULT 'ORIGINAL',
    "show_challan_section" BOOLEAN NOT NULL DEFAULT true,
    "bill_no_label" VARCHAR(20) NOT NULL DEFAULT 'Bill No.',
    "show_loss_product_option" BOOLEAN NOT NULL DEFAULT false,
    "show_delivery_to_sales_option" BOOLEAN NOT NULL DEFAULT false,
    "show_withholding_tax" BOOLEAN NOT NULL DEFAULT false,
    "enable_direct_payment" BOOLEAN NOT NULL DEFAULT false,
    "discount_scope" "discount_scope_enum" NOT NULL DEFAULT 'BILL',
    "gst_scope" "discount_scope_enum" NOT NULL DEFAULT 'BILL',
    "bill_prefix" VARCHAR(20),
    "terms_and_conditions" TEXT,
    "job_challan_title" VARCHAR(20),
    "tax_invoice_title" VARCHAR(20),
    "pdf_custom_heading" VARCHAR(30),
    "pdf_template" "pdf_template_enum" NOT NULL DEFAULT 'STANDARD',

    CONSTRAINT "firm_sales_bill_settings_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "owner_name" VARCHAR(120),
    "gst_no" VARCHAR(15),
    "pan_no" VARCHAR(10),
    "address" TEXT,
    "state" VARCHAR(60),
    "city" VARCHAR(80),
    "pincode" VARCHAR(10),
    "contact_number" VARCHAR(15),
    "default_discount_pct" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "default_due_days" INTEGER NOT NULL DEFAULT 45,
    "broker_name" VARCHAR(120),
    "broker_mobile" VARCHAR(15),
    "balance_cached" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_shipment_addresses" (
    "id" BIGSERIAL NOT NULL,
    "party_id" BIGINT NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "address" TEXT NOT NULL,
    "state" VARCHAR(60),
    "city" VARCHAR(80),
    "pincode" VARCHAR(10),

    CONSTRAINT "party_shipment_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_product_rates" (
    "id" BIGSERIAL NOT NULL,
    "party_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "party_product_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "rate" DECIMAL(14,2),
    "unit" "unit_enum" NOT NULL,
    "gst_pct" "gst_pct_enum",
    "item_code" VARCHAR(60),
    "hsn_code" VARCHAR(15),
    "description" VARCHAR(250),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_challans" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "party_id" BIGINT NOT NULL,
    "dc_no_seq" INTEGER NOT NULL,
    "dc_no_display" VARCHAR(40),
    "dc_date" DATE NOT NULL,
    "party_challan_no" VARCHAR(60),
    "party_challan_date" DATE,
    "no_challan" BOOLEAN NOT NULL DEFAULT false,
    "remarks" VARCHAR(200),
    "total_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sales_bill_id" BIGINT,
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "delivery_challans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_challan_items" (
    "id" BIGSERIAL NOT NULL,
    "delivery_challan_id" BIGINT NOT NULL,
    "product_id" BIGINT,
    "product_name_snapshot" VARCHAR(160),
    "item_code" VARCHAR(60),
    "hsn_code" VARCHAR(15),
    "qty" DECIMAL(14,3) NOT NULL,
    "unit" "unit_enum" NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "line_no" SMALLINT NOT NULL,

    CONSTRAINT "delivery_challan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_bills" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "party_id" BIGINT NOT NULL,
    "bill_type" "bill_type_enum" NOT NULL,
    "bill_no_prefix" VARCHAR(20),
    "bill_no_seq" INTEGER NOT NULL,
    "bill_no_display" VARCHAR(40),
    "bill_date" DATE NOT NULL,
    "due_days" INTEGER,
    "due_date" DATE,
    "apply_gst" BOOLEAN NOT NULL DEFAULT false,
    "discount_scope" "discount_scope_enum" NOT NULL DEFAULT 'BILL',
    "gst_scope" "discount_scope_enum" NOT NULL DEFAULT 'BILL',
    "discount_pct" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxable_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tds_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tcs_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pending_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "bill_status_enum" NOT NULL DEFAULT 'UNPAID',
    "remarks" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sales_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_bill_challans" (
    "id" BIGSERIAL NOT NULL,
    "sales_bill_id" BIGINT NOT NULL,
    "delivery_challan_id" BIGINT,
    "challan_number" VARCHAR(60),
    "challan_date" DATE,
    "no_challan" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sales_bill_challans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_bill_items" (
    "id" BIGSERIAL NOT NULL,
    "sales_bill_id" BIGINT NOT NULL,
    "challan_id" BIGINT,
    "product_id" BIGINT,
    "product_name_snapshot" VARCHAR(160),
    "item_code" VARCHAR(60),
    "hsn_code" VARCHAR(15),
    "qty" DECIMAL(14,3) NOT NULL,
    "unit" "unit_enum" NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "discount_pct" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gst_pct" "gst_pct_enum",
    "cgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL,
    "is_loss_product" BOOLEAN NOT NULL DEFAULT false,
    "line_no" SMALLINT NOT NULL,

    CONSTRAINT "sales_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eway_bills" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "sales_bill_id" BIGINT NOT NULL,
    "eway_bill_no" VARCHAR(20),
    "generated_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "distance_km" INTEGER,
    "transport_mode" VARCHAR(30),
    "vehicle_no" VARCHAR(20),
    "transporter_name" VARCHAR(120),
    "transporter_doc_no" VARCHAR(60),
    "gsp_response" JSONB,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eway_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "sales_bill_id" BIGINT NOT NULL,
    "note_no_seq" INTEGER NOT NULL,
    "note_date" DATE NOT NULL,
    "reason" TEXT,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_note_items" (
    "id" BIGSERIAL NOT NULL,
    "credit_note_id" BIGINT NOT NULL,
    "product_id" BIGINT,
    "product_name_snapshot" VARCHAR(160),
    "item_code" VARCHAR(60),
    "hsn_code" VARCHAR(15),
    "qty" DECIMAL(14,3) NOT NULL,
    "unit" "unit_enum" NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "gst_pct" "gst_pct_enum",
    "amount" DECIMAL(14,2) NOT NULL,
    "line_no" SMALLINT NOT NULL,

    CONSTRAINT "credit_note_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "ref_number" VARCHAR(40),
    "txn_date" DATE NOT NULL,
    "party_id" BIGINT,
    "txn_type" "txn_type_enum" NOT NULL,
    "txn_for" "txn_for_enum" NOT NULL,
    "source_table" VARCHAR(40),
    "source_id" BIGINT,
    "payment_mode" "payment_mode_enum" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "settlement_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "note" VARCHAR(250),
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_payment_allocations" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "bill_table" VARCHAR(20) NOT NULL,
    "bill_id" BIGINT NOT NULL,
    "allocated_amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "bill_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firm_purchase_bill_settings" (
    "firm_id" BIGINT NOT NULL,
    "show_withholding_tax" BOOLEAN NOT NULL DEFAULT false,
    "pdf_template" "pdf_template_enum" NOT NULL DEFAULT 'STANDARD',

    CONSTRAINT "firm_purchase_bill_settings_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "purchase_bills" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "party_id" BIGINT NOT NULL,
    "bill_type" "purchase_bill_type" NOT NULL,
    "bill_no" VARCHAR(40) NOT NULL,
    "bill_date" DATE NOT NULL,
    "due_days" INTEGER,
    "due_date" DATE,
    "apply_gst" BOOLEAN NOT NULL DEFAULT false,
    "net_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxable_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tds_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tcs_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pending_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "bill_status_enum" NOT NULL DEFAULT 'UNPAID',
    "remarks" VARCHAR(200),
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_bill_items" (
    "id" BIGSERIAL NOT NULL,
    "purchase_bill_id" BIGINT NOT NULL,
    "product_id" BIGINT,
    "product_name_snapshot" VARCHAR(160),
    "item_code" VARCHAR(60),
    "hsn_code" VARCHAR(15),
    "qty" DECIMAL(14,3) NOT NULL,
    "unit" "unit_enum" NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "discount_pct" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gst_pct" "gst_pct_enum",
    "cgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL,
    "line_no" SMALLINT NOT NULL,

    CONSTRAINT "purchase_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_bill_attachments" (
    "id" BIGSERIAL NOT NULL,
    "purchase_bill_id" BIGINT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "mime_type" VARCHAR(80) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_bill_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" BIGSERIAL NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_suppliers" (
    "id" BIGSERIAL NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "expense_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_items" (
    "id" BIGSERIAL NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "mode" "expense_mode_enum" NOT NULL,
    "expense_date" DATE NOT NULL,
    "category_id" BIGINT NOT NULL,
    "supplier_id" BIGINT,
    "amount" DECIMAL(14,2) NOT NULL,
    "note" VARCHAR(200),
    "attachment_key" TEXT,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_line_items" (
    "id" BIGSERIAL NOT NULL,
    "expense_id" BIGINT NOT NULL,
    "item_id" BIGINT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "expense_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_categories" (
    "id" BIGSERIAL NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "income_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_suppliers" (
    "id" BIGSERIAL NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "income_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incomes" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "firm_id" BIGINT NOT NULL,
    "fy" SMALLINT NOT NULL,
    "income_date" DATE NOT NULL,
    "category_id" BIGINT NOT NULL,
    "supplier_id" BIGINT,
    "amount" DECIMAL(14,2) NOT NULL,
    "note" VARCHAR(200),
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_public_id_key" ON "accounts"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE INDEX "users_account_id_idx" ON "users"("account_id");

-- CreateIndex
CREATE INDEX "firms_account_id_idx" ON "firms"("account_id");

-- CreateIndex
CREATE INDEX "dispatch_addresses_firm_id_idx" ON "dispatch_addresses"("firm_id");

-- CreateIndex
CREATE INDEX "parties_firm_id_name_idx" ON "parties"("firm_id", "name");

-- CreateIndex
CREATE INDEX "parties_firm_id_gst_no_idx" ON "parties"("firm_id", "gst_no");

-- CreateIndex
CREATE UNIQUE INDEX "uq_party_firm_name" ON "parties"("firm_id", "name");

-- CreateIndex
CREATE INDEX "party_shipment_addresses_party_id_idx" ON "party_shipment_addresses"("party_id");

-- CreateIndex
CREATE INDEX "party_product_rates_party_id_idx" ON "party_product_rates"("party_id");

-- CreateIndex
CREATE UNIQUE INDEX "party_product_rates_party_id_product_id_key" ON "party_product_rates"("party_id", "product_id");

-- CreateIndex
CREATE INDEX "products_firm_id_name_idx" ON "products"("firm_id", "name");

-- CreateIndex
CREATE INDEX "products_firm_id_item_code_idx" ON "products"("firm_id", "item_code");

-- CreateIndex
CREATE INDEX "products_firm_id_hsn_code_idx" ON "products"("firm_id", "hsn_code");

-- CreateIndex
CREATE INDEX "delivery_challans_firm_id_fy_dc_date_idx" ON "delivery_challans"("firm_id", "fy", "dc_date" DESC);

-- CreateIndex
CREATE INDEX "delivery_challans_firm_id_fy_sales_bill_id_idx" ON "delivery_challans"("firm_id", "fy", "sales_bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_challans_firm_id_fy_dc_no_seq_key" ON "delivery_challans"("firm_id", "fy", "dc_no_seq");

-- CreateIndex
CREATE INDEX "delivery_challan_items_delivery_challan_id_line_no_idx" ON "delivery_challan_items"("delivery_challan_id", "line_no");

-- CreateIndex
CREATE INDEX "delivery_challan_items_product_id_idx" ON "delivery_challan_items"("product_id");

-- CreateIndex
CREATE INDEX "sales_bills_firm_id_fy_bill_date_idx" ON "sales_bills"("firm_id", "fy", "bill_date" DESC);

-- CreateIndex
CREATE INDEX "sales_bills_firm_id_fy_party_id_idx" ON "sales_bills"("firm_id", "fy", "party_id");

-- CreateIndex
CREATE INDEX "sales_bills_firm_id_fy_status_idx" ON "sales_bills"("firm_id", "fy", "status");

-- CreateIndex
CREATE INDEX "idx_sb_firm_fy_due" ON "sales_bills"("firm_id", "fy", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "sales_bills_firm_id_fy_bill_type_bill_no_seq_key" ON "sales_bills"("firm_id", "fy", "bill_type", "bill_no_seq");

-- CreateIndex
CREATE INDEX "sales_bill_challans_sales_bill_id_idx" ON "sales_bill_challans"("sales_bill_id");

-- CreateIndex
CREATE INDEX "sales_bill_challans_delivery_challan_id_idx" ON "sales_bill_challans"("delivery_challan_id");

-- CreateIndex
CREATE INDEX "sales_bill_items_sales_bill_id_line_no_idx" ON "sales_bill_items"("sales_bill_id", "line_no");

-- CreateIndex
CREATE INDEX "sales_bill_items_product_id_idx" ON "sales_bill_items"("product_id");

-- CreateIndex
CREATE INDEX "eway_bills_firm_id_fy_generated_at_idx" ON "eway_bills"("firm_id", "fy", "generated_at" DESC);

-- CreateIndex
CREATE INDEX "eway_bills_sales_bill_id_idx" ON "eway_bills"("sales_bill_id");

-- CreateIndex
CREATE INDEX "credit_notes_firm_id_fy_note_date_idx" ON "credit_notes"("firm_id", "fy", "note_date" DESC);

-- CreateIndex
CREATE INDEX "credit_notes_sales_bill_id_idx" ON "credit_notes"("sales_bill_id");

-- CreateIndex
CREATE INDEX "credit_note_items_credit_note_id_idx" ON "credit_note_items"("credit_note_id");

-- CreateIndex
CREATE INDEX "transactions_firm_id_fy_txn_date_idx" ON "transactions"("firm_id", "fy", "txn_date" DESC);

-- CreateIndex
CREATE INDEX "transactions_firm_id_fy_party_id_idx" ON "transactions"("firm_id", "fy", "party_id");

-- CreateIndex
CREATE INDEX "transactions_source_table_source_id_idx" ON "transactions"("source_table", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_firm_id_ref_number_key" ON "transactions"("firm_id", "ref_number");

-- CreateIndex
CREATE INDEX "bill_payment_allocations_bill_table_bill_id_idx" ON "bill_payment_allocations"("bill_table", "bill_id");

-- CreateIndex
CREATE INDEX "bill_payment_allocations_transaction_id_idx" ON "bill_payment_allocations"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "bill_payment_allocations_transaction_id_bill_table_bill_id_key" ON "bill_payment_allocations"("transaction_id", "bill_table", "bill_id");

-- CreateIndex
CREATE INDEX "purchase_bills_firm_id_fy_bill_date_idx" ON "purchase_bills"("firm_id", "fy", "bill_date" DESC);

-- CreateIndex
CREATE INDEX "purchase_bills_firm_id_fy_status_idx" ON "purchase_bills"("firm_id", "fy", "status");

-- CreateIndex
CREATE INDEX "idx_pb_firm_fy_due" ON "purchase_bills"("firm_id", "fy", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_bills_firm_id_fy_party_id_bill_no_key" ON "purchase_bills"("firm_id", "fy", "party_id", "bill_no");

-- CreateIndex
CREATE INDEX "purchase_bill_items_purchase_bill_id_line_no_idx" ON "purchase_bill_items"("purchase_bill_id", "line_no");

-- CreateIndex
CREATE INDEX "purchase_bill_items_product_id_idx" ON "purchase_bill_items"("product_id");

-- CreateIndex
CREATE INDEX "purchase_bill_attachments_purchase_bill_id_idx" ON "purchase_bill_attachments"("purchase_bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_firm_id_name_key" ON "expense_categories"("firm_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "expense_suppliers_firm_id_name_key" ON "expense_suppliers"("firm_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "expense_items_firm_id_name_key" ON "expense_items"("firm_id", "name");

-- CreateIndex
CREATE INDEX "expenses_firm_id_fy_expense_date_idx" ON "expenses"("firm_id", "fy", "expense_date" DESC);

-- CreateIndex
CREATE INDEX "expenses_firm_id_fy_category_id_idx" ON "expenses"("firm_id", "fy", "category_id");

-- CreateIndex
CREATE INDEX "expense_line_items_expense_id_idx" ON "expense_line_items"("expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "income_categories_firm_id_name_key" ON "income_categories"("firm_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "income_suppliers_firm_id_name_key" ON "income_suppliers"("firm_id", "name");

-- CreateIndex
CREATE INDEX "incomes_firm_id_fy_income_date_idx" ON "incomes"("firm_id", "fy", "income_date" DESC);

-- CreateIndex
CREATE INDEX "incomes_firm_id_fy_category_id_idx" ON "incomes"("firm_id", "fy", "category_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firms" ADD CONSTRAINT "firms_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_bank_details" ADD CONSTRAINT "firm_bank_details_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_addresses" ADD CONSTRAINT "dispatch_addresses_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eway_gsp_credentials" ADD CONSTRAINT "eway_gsp_credentials_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_delivery_challan_settings" ADD CONSTRAINT "firm_delivery_challan_settings_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_other_settings" ADD CONSTRAINT "firm_other_settings_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_sales_bill_settings" ADD CONSTRAINT "firm_sales_bill_settings_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parties" ADD CONSTRAINT "parties_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_shipment_addresses" ADD CONSTRAINT "party_shipment_addresses_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_product_rates" ADD CONSTRAINT "party_product_rates_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_product_rates" ADD CONSTRAINT "party_product_rates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challans" ADD CONSTRAINT "delivery_challans_sales_bill_id_fkey" FOREIGN KEY ("sales_bill_id") REFERENCES "sales_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challan_items" ADD CONSTRAINT "delivery_challan_items_delivery_challan_id_fkey" FOREIGN KEY ("delivery_challan_id") REFERENCES "delivery_challans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_challan_items" ADD CONSTRAINT "delivery_challan_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bills" ADD CONSTRAINT "sales_bills_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bills" ADD CONSTRAINT "sales_bills_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bills" ADD CONSTRAINT "sales_bills_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bill_challans" ADD CONSTRAINT "sales_bill_challans_sales_bill_id_fkey" FOREIGN KEY ("sales_bill_id") REFERENCES "sales_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bill_challans" ADD CONSTRAINT "sales_bill_challans_delivery_challan_id_fkey" FOREIGN KEY ("delivery_challan_id") REFERENCES "delivery_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bill_items" ADD CONSTRAINT "sales_bill_items_sales_bill_id_fkey" FOREIGN KEY ("sales_bill_id") REFERENCES "sales_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bill_items" ADD CONSTRAINT "sales_bill_items_challan_id_fkey" FOREIGN KEY ("challan_id") REFERENCES "sales_bill_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_bill_items" ADD CONSTRAINT "sales_bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eway_bills" ADD CONSTRAINT "eway_bills_sales_bill_id_fkey" FOREIGN KEY ("sales_bill_id") REFERENCES "sales_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_sales_bill_id_fkey" FOREIGN KEY ("sales_bill_id") REFERENCES "sales_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_credit_note_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_payment_allocations" ADD CONSTRAINT "bill_payment_allocations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_purchase_bill_settings" ADD CONSTRAINT "firm_purchase_bill_settings_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_bills" ADD CONSTRAINT "purchase_bills_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_bills" ADD CONSTRAINT "purchase_bills_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_bills" ADD CONSTRAINT "purchase_bills_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_bill_items" ADD CONSTRAINT "purchase_bill_items_purchase_bill_id_fkey" FOREIGN KEY ("purchase_bill_id") REFERENCES "purchase_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_bill_items" ADD CONSTRAINT "purchase_bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_bill_attachments" ADD CONSTRAINT "purchase_bill_attachments_purchase_bill_id_fkey" FOREIGN KEY ("purchase_bill_id") REFERENCES "purchase_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_suppliers" ADD CONSTRAINT "expense_suppliers_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "expense_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_line_items" ADD CONSTRAINT "expense_line_items_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_line_items" ADD CONSTRAINT "expense_line_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "expense_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_suppliers" ADD CONSTRAINT "income_suppliers_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "income_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "income_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
