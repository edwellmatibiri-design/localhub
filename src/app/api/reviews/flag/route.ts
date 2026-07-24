import { appFail, appOk, parseBody, requireAdmin } from "@/lib/api";
import { flagReview } from "@/lib/reviewTrust";

type Body = {
  id?: string;
  flagged?: boolean;
  admin_notes?: string | null;
};

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await parseBody<Body>(request);
  const id = String(body?.id ?? "");
  if (!id) {
    return appFail(400, "Review id is required");
  }

  const updated = flagReview(
    id,
    Boolean(body?.flagged ?? true),
    body?.admin_notes ?? null,
  );
  if (!updated) {
    return appFail(404, "Review not found");
  }

  return appOk(updated);
}
