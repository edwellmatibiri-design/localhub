"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type ApproveRejectActionsProps = {
  onApprove: () => Promise<unknown>;
  onReject: () => Promise<unknown>;
};

type FlagActionProps = {
  onFlag: (reason: string) => Promise<unknown>;
};

type RescheduleActionProps = {
  onReschedule: (newDate: string) => Promise<unknown>;
};

type ClearEventActionProps = {
  onClear: () => Promise<unknown>;
};

export function ApproveRejectActions({
  onApprove,
  onReject,
}: ApproveRejectActionsProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);

  function handle(nextMode: "approve" | "reject") {
    setMode(nextMode);
    setOpen(true);
  }

  async function confirm() {
    if (mode === "approve") await onApprove();
    if (mode === "reject") await onReject();
    setOpen(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="success" onClick={() => handle("approve")}>
          Approve
        </Button>
        <Button variant="danger" onClick={() => handle("reject")}>
          Reject
        </Button>
      </div>

      <Modal
        open={open}
        title={mode === "approve" ? "Approve Item" : "Reject Item"}
        onClose={() => setOpen(false)}
      >
        <p className="mb-4 text-sm">
          Confirm {mode === "approve" ? "approval" : "rejection"}?
        </p>
        <Button variant="primary" onClick={confirm}>
          Confirm
        </Button>
      </Modal>
    </>
  );
}

export function FlagAction({ onFlag }: FlagActionProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function confirm() {
    await onFlag(reason);
    setOpen(false);
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Flag
      </Button>

      <Modal open={open} title="Flag Vendor" onClose={() => setOpen(false)}>
        <p className="mb-2 text-sm">Reason for flagging:</p>
        <input
          className="border-lh-border bg-lh-surface-soft w-full rounded-xl border px-3 py-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button variant="danger" className="mt-4" onClick={confirm}>
          Confirm Flag
        </Button>
      </Modal>
    </>
  );
}

export function RescheduleAction({ onReschedule }: RescheduleActionProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");

  async function confirm() {
    await onReschedule(date);
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Reschedule
      </Button>

      <Modal
        open={open}
        title="Reschedule Booking"
        onClose={() => setOpen(false)}
      >
        <p className="mb-2 text-sm">New date/time:</p>
        <input
          type="datetime-local"
          className="border-lh-border bg-lh-surface-soft w-full rounded-xl border px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button variant="primary" className="mt-4" onClick={confirm}>
          Confirm Reschedule
        </Button>
      </Modal>
    </>
  );
}

export function ClearEventAction({ onClear }: ClearEventActionProps) {
  const [open, setOpen] = useState(false);

  async function confirm() {
    await onClear();
    setOpen(false);
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Clear Event
      </Button>

      <Modal open={open} title="Clear Event" onClose={() => setOpen(false)}>
        <p className="mb-4 text-sm">
          Are you sure you want to clear this event?
        </p>
        <Button variant="danger" onClick={confirm}>
          Confirm Clear
        </Button>
      </Modal>
    </>
  );
}
