"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/db";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const role = user.app_metadata?.role;
      const isSeller = role === "seller" || role === "admin";

      if (!isSeller) {
        router.push("/");
      }
    });
  }, [router]);

  return <>{children}</>;
}
