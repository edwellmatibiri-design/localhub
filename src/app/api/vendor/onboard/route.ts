import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  serviceCategories?: string[];
  serviceAreas?: string[];
};

function normalizeList(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const businessName = String(body.businessName ?? "").trim();
  const ownerName = String(body.ownerName ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const serviceCategories = normalizeList(body.serviceCategories);
  const serviceAreas = normalizeList(body.serviceAreas);

  if (
    !businessName ||
    !ownerName ||
    !email ||
    !phone ||
    serviceCategories.length === 0 ||
    serviceAreas.length === 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "businessName, ownerName, email, phone, serviceCategories, and serviceAreas are required",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    let userId: string;

    const { data: existingUser, error: userLookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (userLookupError) {
      return NextResponse.json(
        { ok: false, error: userLookupError.message },
        { status: 500 },
      );
    }

    if (existingUser?.id) {
      userId = existingUser.id;
    } else {
      const { data: createdUser, error: createUserError } = await supabase
        .from("users")
        .insert({
          email,
          phone,
          full_name: ownerName,
          role: "seller",
        })
        .select("id")
        .single();

      if (createUserError) {
        return NextResponse.json(
          { ok: false, error: createUserError.message },
          { status: 500 },
        );
      }

      userId = createdUser.id;
    }

    const profileDescription = [
      `Service categories: ${serviceCategories.join(", ")}`,
      `Service areas: ${serviceAreas.join(", ")}`,
      `Owner: ${ownerName}`,
    ].join("\n");

    const { data: sellerProfile, error: sellerError } = await supabase
      .from("seller_profiles")
      .insert({
        user_id: userId,
        business_name: businessName,
        contact_email: email,
        contact_phone: phone,
        description: profileDescription,
      })
      .select("id")
      .single();

    if (sellerError) {
      return NextResponse.json(
        { ok: false, error: sellerError.message },
        { status: 500 },
      );
    }

    const { error: trustError } = await supabase
      .from("vendor_trust_scores")
      .upsert(
        {
          vendor_id: sellerProfile.id,
          trust_score: 40,
          signals: {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "vendor_id" },
      );

    if (trustError) {
      return NextResponse.json(
        { ok: false, error: trustError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      vendorId: sellerProfile.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to onboard vendor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
