import { appOk } from "@/lib/api";

export async function GET() {
  return appOk([
    { id: "msg-1", content: "Hi, is this still available?", seen: true },
    { id: "msg-2", content: "Yes, still available.", seen: false },
  ]);
}
