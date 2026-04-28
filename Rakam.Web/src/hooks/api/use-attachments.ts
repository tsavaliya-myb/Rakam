"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { attachmentsService } from "@/services/attachments";
import { useAppStore } from "@/store/useAppStore";

export function useUploadFile() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({
      file,
      entityType,
      entityId,
    }: {
      file: File;
      entityType: string;
      entityId: string;
    }) => attachmentsService.uploadFile(firmId!, file, entityType, entityId),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteFile() {
  return useMutation({
    mutationFn: (id: string) => attachmentsService.deleteFile(id),
    onError: (err: Error) => toast.error(err.message),
  });
}
