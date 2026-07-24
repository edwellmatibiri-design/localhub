type DmInput = {
  businessName: string;
  category: string;
  location?: string | null;
};

function setupLink() {
  return "{{LOCALHUB_VENDOR_PROFILE_SETUP_LINK}}";
}

function line(input: DmInput) {
  const location = String(input.location ?? "").trim();
  return location
    ? `${input.category} services in ${location}`
    : `${input.category} services`;
}

export function instagramDmTemplate(input: DmInput) {
  return `Hi ${input.businessName}! LocalHub here. We help businesses offering ${line(input)} get quality local enquiries and convert faster. If useful, here is your quick setup link: ${setupLink()}`;
}

export function facebookDmTemplate(input: DmInput) {
  return `Hi ${input.businessName}, great to connect. LocalHub helps ${line(input)} get discovered by nearby customers and manage leads smoothly. You can set up in minutes: ${setupLink()}`;
}

export function tiktokDmTemplate(input: DmInput) {
  return `Hey ${input.businessName}! We are from LocalHub. We help ${line(input)} turn local interest into real bookings. Want to join? Start here: ${setupLink()}`;
}
