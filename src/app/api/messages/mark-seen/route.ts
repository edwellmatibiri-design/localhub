import { appFail, appOk, parseBody } from "@/lib/api";

type MarkSeenBody = {
  id?: string;
};

async function markSeen(request: Request) {
  const body = await parseBody<MarkSeenBody>(request);
  const id = String(body?.id ?? "");
  if (!id) {
    return appFail(400, "message id is required");
  }

  return appOk({ id, seen: true });
}

export async function POST(request: Request) {
  return markSeen(request);
}

export async function PATCH(request: Request) {
  return markSeen(request);
}
