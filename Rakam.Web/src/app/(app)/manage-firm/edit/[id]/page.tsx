"use client";

import { use, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { EditFirmForm } from "@/components/firm/EditFirmForm";
import type { EditFirmFormValues } from "@/lib/schemas/firm.schema";
import type { FirmDetails, DispatchAddress as MockDispatchAddress } from "@/lib/mock/firms";
import type { DispatchAddress } from "@/types";
import { toast } from "sonner";
import {
  useFirm,
  useUpdateFirm,
  useFirmBankDetails,
  useUpdateBankDetails,
  useDispatchAddresses,
  useCreateDispatchAddress,
  useUpdateDispatchAddress,
  useDeleteDispatchAddress,
} from "@/hooks/api/use-firms";

interface Props {
  params: Promise<{ id: string }>;
}

function toMockDispatchAddress(da: DispatchAddress): MockDispatchAddress {
  return {
    id: da.id,
    dispatchName: da.label,
    address: da.address,
    city: da.city,
    state: da.state ?? "",
    pin: da.pincode,
  };
}

export default function EditFirmPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: firm, isLoading: firmLoading } = useFirm(id);
  const { data: bankDetails, isLoading: bankLoading } = useFirmBankDetails(id);
  const { data: dispatchAddresses, isLoading: daLoading } = useDispatchAddresses(id);

  const updateFirm            = useUpdateFirm();
  const updateBankDetails     = useUpdateBankDetails();
  const createDispatchAddress = useCreateDispatchAddress();
  const updateDispatchAddress = useUpdateDispatchAddress();
  const deleteDispatchAddress = useDeleteDispatchAddress();

  // Keep a stable snapshot of the original dispatch address IDs for diff on submit
  const originalDaIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (dispatchAddresses) {
      originalDaIds.current = new Set(dispatchAddresses.map((da) => da.id));
    }
  }, [dispatchAddresses]);

  const isLoading = firmLoading || bankLoading || daLoading;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  // Adapt API types into the flat FirmDetails shape EditFirmForm expects
  const firmDetails: FirmDetails = {
    id: firm.id,
    name: firm.name,
    gstNo: firm.gstNo,
    panNo: firm.panNo,
    fullAddress: firm.address ?? "",
    state: firm.state ?? "",
    city: firm.city,
    pincode: firm.pincode,
    mobilePrimary: firm.phone,
    isDefault: firm.isDefault,
    watermark: false,
    logo: firm.pdfOptions?.showLogo ?? false,
    signature: firm.pdfOptions?.showSign ?? false,
    bankName: bankDetails?.bankName,
    branchName: bankDetails?.branch,
    accountHolderName: bankDetails?.accountHolderName,
    accountNo: bankDetails?.accountNo,
    ifscCode: bankDetails?.ifscCode,
    dispatchAddresses: (dispatchAddresses ?? []).map(toMockDispatchAddress),
  };

  async function handleSubmit(data: EditFirmFormValues) {
    try {
      // 1. Update core firm details
      await updateFirm.mutateAsync({
        id,
        dto: {
          name: data.name,
          gstNo: data.gstNo || undefined,
          panNo: data.panNo || undefined,
          address: data.fullAddress,
          state: data.state,
          city: data.city || undefined,
          pincode: data.pincode || undefined,
          phone: data.mobilePrimary || undefined,
        },
      });

      // 2. Update bank details if any field is filled
      if (data.bankName || data.accountNo || data.ifscCode) {
        await updateBankDetails.mutateAsync({
          firmId: id,
          dto: {
            bankName: data.bankName ?? "",
            accountNo: data.accountNo ?? "",
            ifscCode: data.ifscCode ?? "",
            accountHolderName: data.accountHolderName ?? "",
            branch: data.branchName || undefined,
          },
        });
      }

      // 3. Sync dispatch addresses via diff
      const originalIds = originalDaIds.current;

      // Delete addresses removed from the form
      for (const origId of originalIds) {
        if (!data.dispatchAddresses.find((da) => da.id === origId)) {
          await deleteDispatchAddress.mutateAsync({ firmId: id, addressId: origId });
        }
      }

      for (const da of data.dispatchAddresses) {
        const daDto = {
          label: da.dispatchName,
          address: da.address,
          city: da.city || undefined,
          state: da.state || undefined,
          pincode: da.pin || undefined,
        };

        if (originalIds.has(da.id)) {
          // Existing — update it
          await updateDispatchAddress.mutateAsync({ firmId: id, addressId: da.id, dto: daDto });
        } else {
          // New (temp id from addDispatch) — create it
          await createDispatchAddress.mutateAsync({ firmId: id, dto: daDto });
        }
      }

      toast.success(`"${data.name}" updated successfully`);
      router.push("/manage-firm");
    } catch {
      // Individual mutation errors are already toasted by the hooks
    }
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
        firm={firmDetails}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/manage-firm")}
      />
    </div>
  );
}
