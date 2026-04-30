"use client";

import { useEffect } from "react";
import { useFirms } from "@/hooks/api/use-firms";
import { useAppStore } from "@/store/useAppStore";

export function FirmBootstrapper() {
  const { data: firms } = useFirms();
  const activeFirmId = useAppStore((s) => s.activeFirmId);
  const setActiveFirm = useAppStore((s) => s.setActiveFirm);

  useEffect(() => {
    if (!firms) return;
    const isValid = activeFirmId && firms.some((f) => f.id === activeFirmId);
    if (!isValid) {
      const defaultFirm = firms.find((f) => f.isDefault) ?? firms[0];
      if (defaultFirm) setActiveFirm(defaultFirm.id, defaultFirm.name);
    }
  }, [firms, activeFirmId, setActiveFirm]);

  return null;
}
