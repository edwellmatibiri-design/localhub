export type OutreachMessageInput = {
  businessName: string;
  category: string;
  location?: string | null;
  website?: string | null;
};

export type OutreachMessages = {
  email: string;
  whatsapp: string;
  sms: string;
  instagram: string;
  facebook: string;
  tiktok: string;
};

function profileSetupLink() {
  return "{{LOCALHUB_VENDOR_PROFILE_SETUP_LINK}}";
}

function businessDescriptor(input: OutreachMessageInput) {
  const location = String(input.location ?? "").trim();
  const website = String(input.website ?? "").trim();
  const bits: string[] = [];
  if (location) bits.push(`in ${location}`);
  if (website) bits.push(`(${website})`);
  return bits.length ? ` ${bits.join(" ")}` : "";
}

export function generateOutreachMessages(
  input: OutreachMessageInput,
): OutreachMessages {
  const businessName = String(input.businessName ?? "").trim() || "there";
  const category =
    String(input.category ?? "local services").trim() || "local services";
  const descriptor = businessDescriptor(input);
  const link = profileSetupLink();

  const greeting = `Hi ${businessName},`;
  const intro = `I am reaching out from LocalHub. We help trusted ${category} businesses get qualified local leads with less admin overhead.${descriptor}`;
  const value =
    "Our platform handles discovery, request capture, smart booking support, and streamlined lead follow-up in one workflow.";
  const benefits =
    "You get faster response opportunities, better visibility to nearby customers, and practical tools to convert enquiries into bookings.";
  const cta = `If this sounds useful, set up your profile here: ${link}`;

  const email = [
    greeting,
    "",
    intro,
    value,
    benefits,
    "",
    cta,
    "",
    "If you want, I can also share a quick walkthrough tailored to your service category.",
    "",
    "Warm regards,",
    "LocalHub Vendor Growth Team",
  ].join("\n");

  const whatsapp = [
    `Hi ${businessName}, this is LocalHub.`,
    `We help ${category} providers get quality local job requests and convert them faster.`,
    `You can create your profile in a few minutes: ${link}`,
    "Reply here if you want a quick setup checklist.",
  ].join(" ");

  const sms = `Hi ${businessName}, LocalHub here. We help ${category} businesses win local leads faster. Start profile setup: ${link} Reply YES for setup help.`;

  const instagram = [
    `Hi ${businessName}! We are from LocalHub.`,
    `We help ${category} businesses attract nearby clients, respond faster, and close more jobs.`,
    `If you are open, here is your setup link: ${link}`,
  ].join(" ");

  const facebook = [
    `Hi ${businessName}, LocalHub here.`,
    `We built a simple system for ${category} businesses to get verified local enquiries and convert them with less back-and-forth.`,
    `Quick profile setup: ${link}`,
  ].join(" ");

  const tiktok = [
    `Hey ${businessName}! LocalHub reaching out.`,
    `We help ${category} teams turn local interest into real bookings with guided lead flow and smart follow-up support.`,
    `Join here: ${link}`,
  ].join(" ");

  return { email, whatsapp, sms, instagram, facebook, tiktok };
}
