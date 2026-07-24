import { appFail, appOk, parseBody } from "@/lib/api";

type DeleteListingBody = {
  id?: string;
};

async function remove(request: Request) {
  const body = await parseBody<DeleteListingBody>(request);
  const id = String(body?.id ?? "");
  if (!id) {
    return appFail(400, "Listing id is required");
  }

  return appOk({ id, deleted: true });
}

export async function POST(request: Request) {
  return remove(request);
}

export async function DELETE(request: Request) {
  return remove(request);
}
