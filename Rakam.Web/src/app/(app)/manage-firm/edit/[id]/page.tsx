"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditFirmForm } from "@/components/firm/EditFirmForm";
import { MOCK_FIRMS } from "@/lib/mock/firms";
import type { EditFirmFormValues } from "@/lib/schemas/firm.schema";
import { toast } from "sonner";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditFirmPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const firm = MOCK_FIRMS.find((f) => f.id === id);

  if (!firm) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-sm text-muted-foreground">Firm not found.</p>
        <button
          onClick={() => router.push("/manage-firm")}
          className="flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-900"
        >
          <ArrowLeft size={14} /> Back to Manage Firm
        </button>
      </div>
    );
  }

  function handleSubmit(data: EditFirmFormValues) {
    // In production: PATCH /api/firms/:id
    console.info("Firm update payload:", data);
    toast.success(`"${data.name}" updated successfully`);
    router.push("/manage-firm");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Back + Title ── */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/manage-firm")}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to Manage Firm
        </button>
        <h1 className="text-2xl font-bold text-foreground leading-tight">Edit Firm</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {firm.name} — update firm details, bank info, dispatch addresses, and assets.
        </p>
      </div>

      <EditFirmForm
        firm={firm}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/manage-firm")}
      />
    </div>
  );
}
