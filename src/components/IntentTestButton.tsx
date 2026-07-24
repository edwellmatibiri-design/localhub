"use client";

export default function IntentTestButton() {
  async function handleTestIntentCluster() {
    try {
      const response = await fetch("/api/test-intent-cluster", {
        method: "POST",
      });

      const data = await response.json();
      console.log("Intent cluster response:", data);
    } catch (error) {
      console.error("Intent cluster test failed:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleTestIntentCluster}
      className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
    >
      Test Intent Cluster
    </button>
  );
}
