"use client";

import { useTransition } from "react";
import { updateFreshness } from "@/app/admin/freshness/actions";
import { Button } from "@/components/ui/Button";

export function FreshnessActions({ vendorId = "" }: { vendorId?: string }) {
  const [pending, startTransition] = useTransition();

  function handleUpdate() {
    startTransition(async () => {
      await updateFreshness(vendorId);
    });
  }

  return (
    <Button variant="secondary" disabled={pending} onClick={handleUpdate}>
      {pending ? "Updating..." : "Update Freshness"}
    </Button>
  );
}

export default FreshnessActions;
