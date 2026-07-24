import { leads } from "@/lib/mockData";
import { appOk } from "@/lib/api";

export async function GET() {
  return appOk(leads);
}
