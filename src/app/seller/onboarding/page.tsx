import { ensureSellerProfile } from "@/app/hooks/createSellerProfile";
import { createClient } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerOnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureSellerProfile(user.id, user.email ?? null);

  redirect("/seller");
}
