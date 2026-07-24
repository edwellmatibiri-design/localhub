"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorOnboardPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Garden",
    "Moving",
  ];
  const areaOptions = [
    "Cape Town",
    "Johannesburg",
    "Durban",
    "Pretoria",
    "Port Elizabeth",
  ];

  function toggleSelection(
    value: string,
    selected: string[],
    onChange: (next: string[]) => void,
  ) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }

    onChange([...selected, value]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vendor/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          ownerName,
          email,
          phone,
          serviceCategories,
          serviceAreas,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(String(payload?.error ?? "Failed to onboard vendor"));
      }

      router.push("/vendors/onboard/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to onboard vendor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Vendor Onboarding</h1>
        <p className="text-lh-muted text-sm">
          Complete your profile so LocalHub can start matching you with local
          leads.
        </p>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid gap-3">
            <label className="text-sm font-medium">Business Name</label>
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="border-lh-border rounded-lg border px-3 py-2"
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-3">
              <label className="text-sm font-medium">Owner Name</label>
              <input
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                className="border-lh-border rounded-lg border px-3 py-2"
                required
              />
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="border-lh-border rounded-lg border px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium">Phone</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="border-lh-border rounded-lg border px-3 py-2"
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-3">
              <label className="text-sm font-medium">Service Categories</label>
              <div className="border-lh-border grid gap-2 rounded-lg border p-3">
                {categoryOptions.map((option) => (
                  <label
                    key={option}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={serviceCategories.includes(option)}
                      onChange={() =>
                        toggleSelection(
                          option,
                          serviceCategories,
                          setServiceCategories,
                        )
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium">Service Areas</label>
              <div className="border-lh-border grid gap-2 rounded-lg border p-3">
                {areaOptions.map((option) => (
                  <label
                    key={option}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={serviceAreas.includes(option)}
                      onChange={() =>
                        toggleSelection(option, serviceAreas, setServiceAreas)
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-lh-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Complete Onboarding"}
          </button>
        </form>
      </div>
    </section>
  );
}
