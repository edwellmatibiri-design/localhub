const tutorials: Record<string, string[]> = {
  "send quote": [
    "Open your Vendor Dashboard",
    "Tap 'Leads'",
    "Select the job",
    "Tap 'Send Quote'",
    "Enter price + notes",
    "Tap 'Submit'",
  ],
  "update profile": [
    "Open your Profile",
    "Tap 'Edit'",
    "Update your details",
    "Save changes",
  ],
};

export function generateTutorial(topic: string) {
  return tutorials[topic] || ["Tutorial not found."];
}
