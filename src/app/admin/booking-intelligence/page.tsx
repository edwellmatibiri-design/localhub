"use client";

import { useEffect, useMemo, useState } from "react";

type QuestionRow = {
  id: number;
  category: string;
  question: string;
  type: "text" | "number" | "choice" | "photo";
  choices: string[] | null;
  required: boolean;
  order_index: number;
  created_at: string;
};

type DashboardPayload = {
  metrics: {
    mostCommonQuestions: Array<{
      questionId: number;
      category: string;
      question: string;
      answerCount: number;
    }>;
    dropoffPoints: Array<{
      questionId: number;
      category: string;
      question: string;
      orderIndex: number;
      answerCount: number;
    }>;
    instantQuoteAccuracy: number;
    categoryScopingPerformance: Array<{
      category: string;
      totalScopedJobs: number;
    }>;
  };
  questions: QuestionRow[];
  scopingLogic: Record<string, unknown>;
  pricingLogic: Record<string, unknown>;
};

export default function AdminBookingIntelligencePage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    category: "tree_felling",
    question: "",
    type: "text" as "text" | "number" | "choice" | "photo",
    choices: "",
  });
  const [scopingJson, setScopingJson] = useState("{}");
  const [pricingJson, setPricingJson] = useState("{}");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/booking-intelligence", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok)
        throw new Error(
          String(data?.error ?? "Failed to load booking intelligence"),
        );
      setPayload(data as DashboardPayload);
      setScopingJson(JSON.stringify(data.scopingLogic ?? {}, null, 2));
      setPricingJson(JSON.stringify(data.pricingLogic ?? {}, null, 2));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load booking intelligence",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateAction(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/booking-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(String(data?.error ?? "Action failed"));
    }
    await load();
  }

  async function addQuestion() {
    const choices = newQuestion.choices
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    await updateAction({
      action: "add_question",
      category: newQuestion.category,
      question: newQuestion.question,
      type: newQuestion.type,
      choices: choices.length > 0 ? choices : undefined,
      required: true,
      orderIndex: 99,
    });

    setNewQuestion((current) => ({ ...current, question: "", choices: "" }));
  }

  async function reorderQuestion(questionId: number, orderIndex: number) {
    await updateAction({ action: "reorder_question", questionId, orderIndex });
  }

  async function removeQuestion(questionId: number) {
    await updateAction({ action: "remove_question", questionId });
  }

  async function saveScopingLogic() {
    await updateAction({
      action: "adjust_scoping_logic",
      config: JSON.parse(scopingJson) as Record<string, unknown>,
    });
  }

  async function savePricingLogic() {
    await updateAction({
      action: "adjust_pricing_logic",
      config: JSON.parse(pricingJson) as Record<string, unknown>,
    });
  }

  const questionsByCategory = useMemo(() => {
    const groups = new Map<string, QuestionRow[]>();
    (payload?.questions ?? []).forEach((question) => {
      const list = groups.get(question.category) ?? [];
      list.push(question);
      groups.set(question.category, list);
    });
    return Array.from(groups.entries());
  }, [payload?.questions]);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Booking Intelligence</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">
          Loading booking intelligence...
        </p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {payload && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="card">
              <p className="text-lh-muted text-xs">
                Most common questions tracked
              </p>
              <p className="text-xl font-semibold">
                {payload.metrics.mostCommonQuestions.length}
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Drop-off points</p>
              <p className="text-xl font-semibold">
                {payload.metrics.dropoffPoints.length}
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Instant quote accuracy</p>
              <p className="text-xl font-semibold">
                {(payload.metrics.instantQuoteAccuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Categories tracked</p>
              <p className="text-xl font-semibold">
                {payload.metrics.categoryScopingPerformance.length}
              </p>
            </div>
          </div>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Most common questions</h2>
              {payload.metrics.mostCommonQuestions.map((item) => (
                <p key={item.questionId} className="text-sm">
                  {item.question} ({item.answerCount})
                </p>
              ))}
            </div>
            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Drop-off points</h2>
              {payload.metrics.dropoffPoints.map((item) => (
                <p key={item.questionId} className="text-sm">
                  {item.question} ({item.answerCount})
                </p>
              ))}
            </div>
          </section>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">
              Category scoping performance
            </h2>
            {payload.metrics.categoryScopingPerformance.map((item) => (
              <p key={item.category} className="text-sm">
                {item.category}: {item.totalScopedJobs} scoped jobs
              </p>
            ))}
          </section>

          <section className="card space-y-3">
            <h2 className="text-lg font-semibold">Manage questions</h2>
            <div className="grid gap-2 md:grid-cols-4">
              <input
                value={newQuestion.category}
                onChange={(event) =>
                  setNewQuestion((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="border-lh-border rounded border px-2 py-1 text-sm"
                placeholder="category"
              />
              <input
                value={newQuestion.question}
                onChange={(event) =>
                  setNewQuestion((current) => ({
                    ...current,
                    question: event.target.value,
                  }))
                }
                className="border-lh-border rounded border px-2 py-1 text-sm"
                placeholder="question"
              />
              <select
                value={newQuestion.type}
                onChange={(event) =>
                  setNewQuestion((current) => ({
                    ...current,
                    type: event.target.value as
                      | "text"
                      | "number"
                      | "choice"
                      | "photo",
                  }))
                }
                className="border-lh-border rounded border px-2 py-1 text-sm"
              >
                <option value="text">text</option>
                <option value="number">number</option>
                <option value="choice">choice</option>
                <option value="photo">photo</option>
              </select>
              <input
                value={newQuestion.choices}
                onChange={(event) =>
                  setNewQuestion((current) => ({
                    ...current,
                    choices: event.target.value,
                  }))
                }
                className="border-lh-border rounded border px-2 py-1 text-sm"
                placeholder="choices comma-separated"
              />
            </div>
            <button
              type="button"
              onClick={() => void addQuestion()}
              className="border-lh-border rounded border px-3 py-1 text-sm"
            >
              Add question
            </button>

            <div className="space-y-2">
              {questionsByCategory.map(([category, rows]) => (
                <div
                  key={category}
                  className="border-lh-border space-y-1 rounded border p-2"
                >
                  <p className="text-sm font-medium">{category}</p>
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center gap-2 text-xs"
                    >
                      <span>{row.order_index}</span>
                      <span>{row.question}</span>
                      <button
                        type="button"
                        onClick={() =>
                          void reorderQuestion(row.id, row.order_index - 1)
                        }
                        className="border-lh-border rounded border px-2 py-0.5"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void reorderQuestion(row.id, row.order_index + 1)
                        }
                        className="border-lh-border rounded border px-2 py-0.5"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeQuestion(row.id)}
                        className="border-lh-danger text-lh-danger rounded border px-2 py-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Adjust scoping logic</h2>
              <textarea
                value={scopingJson}
                onChange={(event) => setScopingJson(event.target.value)}
                className="border-lh-border min-h-40 w-full rounded border px-2 py-1 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => void saveScopingLogic()}
                className="border-lh-border rounded border px-3 py-1 text-sm"
              >
                Save scoping logic
              </button>
            </div>

            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Adjust pricing logic</h2>
              <textarea
                value={pricingJson}
                onChange={(event) => setPricingJson(event.target.value)}
                className="border-lh-border min-h-40 w-full rounded border px-2 py-1 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => void savePricingLogic()}
                className="border-lh-border rounded border px-3 py-1 text-sm"
              >
                Save pricing logic
              </button>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
