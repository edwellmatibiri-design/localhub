"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import {
  getNextBestQuestion,
  getQuestionSet,
  type BookingQuestion,
} from "@/lib/booking/questionsEngine";
import { buildAutoScope } from "@/lib/booking/autoScope";
import { buildInstantQuote } from "@/lib/booking/instantQuote";
import { generateBookingSummary } from "@/lib/booking/summary";

type ChatItem = {
  role: "system" | "user";
  text: string;
};

const CATEGORIES = ["tree_felling", "cleaning", "plumbing"] as const;

export default function SmartBookingPage() {
  const [userId, setUserId] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("tree_felling");
  const [location, setLocation] = useState("Cape Town");
  const [questions, setQuestions] = useState<BookingQuestion[]>(() =>
    getQuestionSet("tree_felling"),
  );
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [chat, setChat] = useState<ChatItem[]>([
    {
      role: "system",
      text: "Welcome to Smart Booking Flow v2. I will ask a few quick questions.",
    },
  ]);
  const [currentQuestion, setCurrentQuestion] =
    useState<BookingQuestion | null>(() =>
      getNextBestQuestion({ category: "tree_felling", previousAnswers: {} }),
    );
  const [draft, setDraft] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    vendorsSent: string[];
    quoteMin: number;
    quoteMax: number;
  } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUserId(String(data?.user?.id ?? ""));
      } catch {
        setUserId("");
      }
    }

    void loadUser();
  }, []);

  useEffect(() => {
    const next = getQuestionSet(category);
    setQuestions(next);
    setAnswers({});
    setPhotos([]);
    setChat([
      {
        role: "system",
        text: `Category selected: ${category.replace(/_/g, " ")}.`,
      },
    ]);
    setCurrentQuestion(getNextBestQuestion({ category, previousAnswers: {} }));
    setDraft("");
    setResult(null);
  }, [category]);

  const scope = useMemo(
    () => buildAutoScope({ category, answers }),
    [answers, category],
  );
  const quote = useMemo(
    () =>
      buildInstantQuote({
        job_size: scope.job_size,
        job_complexity: scope.job_complexity,
        estimated_duration: scope.estimated_duration,
      }),
    [scope],
  );
  const summary = useMemo(
    () =>
      generateBookingSummary({
        category,
        answers,
        scope,
        quote,
        photos,
        userNotes,
      }),
    [answers, category, photos, quote, scope, userNotes],
  );

  function recordAnswer(
    question: BookingQuestion,
    value: string | number | string[],
  ) {
    const answerText = Array.isArray(value) ? value.join(", ") : String(value);
    setChat((current) => [
      ...current,
      { role: "system", text: question.question },
      { role: "user", text: answerText },
    ]);

    setAnswers((current) => {
      const nextAnswers = { ...current, [question.key]: value };
      const nextQuestion = getNextBestQuestion({
        category,
        previousAnswers: nextAnswers,
        questions,
      });
      setCurrentQuestion(nextQuestion);
      return nextAnswers;
    });

    setDraft("");
  }

  function onSubmitAnswer() {
    if (!currentQuestion) return;
    const cleaned = draft.trim();
    if (!cleaned && currentQuestion.required) return;

    const value: string | number =
      currentQuestion.type === "number" ? Number(cleaned) || 0 : cleaned;
    recordAnswer(currentQuestion, value);
  }

  function onPhotoUpload(files: FileList | null) {
    if (!currentQuestion || currentQuestion.type !== "photo") return;
    const names = Array.from(files ?? [])
      .map((file) => file.name)
      .filter(Boolean);
    if (names.length === 0) return;

    setPhotos((current) => [...current, ...names]);
    recordAnswer(currentQuestion, names);
  }

  async function submitSmartBooking() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/booking/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          category,
          location,
          answers,
          photos,
          userNotes,
          preferredDate: new Date().toISOString(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(
          String(payload?.error ?? "Failed to submit smart booking"),
        );
      }

      setResult({
        vendorsSent: (payload.vendorsSent ?? []) as string[],
        quoteMin: Number(
          payload?.quote?.price_range_min ?? quote.price_range_min,
        ),
        quoteMax: Number(
          payload?.quote?.price_range_max ?? quote.price_range_max,
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit smart booking",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Smart Booking Flow v2</h1>

      <section className="card grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-lh-muted">Category</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof CATEGORIES)[number])
            }
            className="border-lh-border w-full rounded border px-2 py-1"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-lh-muted">Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="border-lh-border w-full rounded border px-2 py-1"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-lh-muted">User notes</span>
          <input
            value={userNotes}
            onChange={(event) => setUserNotes(event.target.value)}
            className="border-lh-border w-full rounded border px-2 py-1"
          />
        </label>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Chat-style questions</h2>
          <div className="border-lh-border h-80 space-y-2 overflow-y-auto rounded border p-3">
            {chat.map((item, index) => (
              <div
                key={`${index}-${item.role}`}
                className={`rounded p-2 text-sm ${item.role === "system" ? "text-lh-on-accent" : "bg-lh-accent/10"}`}
              >
                <p className="text-lh-muted text-xs uppercase">
                  {item.role === "system" ? "Assistant" : "You"}
                </p>
                <p>{item.text}</p>
              </div>
            ))}
            {currentQuestion && (
              <div className="text-lh-on-accent rounded p-2 text-sm">
                <p className="text-lh-muted text-xs uppercase">Assistant</p>
                <p>{currentQuestion.question}</p>
              </div>
            )}
          </div>

          {currentQuestion ? (
            <div className="space-y-2">
              {currentQuestion.type === "choice" && (
                <div className="flex flex-wrap gap-2">
                  {(currentQuestion.choices ?? []).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => recordAnswer(currentQuestion, choice)}
                      className="border-lh-border rounded border px-3 py-1 text-sm"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "photo" ? (
                <input
                  type="file"
                  multiple
                  onChange={(event) => onPhotoUpload(event.target.files)}
                  className="w-full text-sm"
                />
              ) : currentQuestion.type !== "choice" ? (
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="border-lh-border w-full rounded border px-2 py-1"
                    placeholder="Type your answer"
                  />
                  <button
                    type="button"
                    onClick={onSubmitAnswer}
                    className="bg-lh-accent text-lh-on-accent rounded px-3 py-1 text-sm"
                  >
                    Send
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-lh-emerald text-sm">
              All required questions answered.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <section className="card">
            <h2 className="text-lg font-semibold">Instant quote preview</h2>
            <p className="text-lh-muted text-sm">
              R {quote.price_range_min} - R {quote.price_range_max}
            </p>
            <p className="text-lh-muted text-xs">
              Auto-updates as answers change.
            </p>
          </section>

          <section className="card space-y-1 text-sm">
            <h2 className="text-lg font-semibold">Job summary</h2>
            <p>{summary.job_description}</p>
            <p>Size: {summary.job_size}</p>
            <p>Complexity: {summary.complexity}</p>
            <p>Estimated duration: {summary.estimated_duration}h</p>
            <p>Estimated team size: {scope.estimated_team_size}</p>
            <p>Photos: {summary.photos.length}</p>
          </section>

          <button
            type="button"
            onClick={() => void submitSmartBooking()}
            disabled={submitting || !userId}
            className="bg-lh-accent text-lh-on-accent w-full rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Send Smart Booking to Vendors"}
          </button>
          {!userId && (
            <p className="text-lh-on-accent text-xs">
              Sign in is required to submit smart booking.
            </p>
          )}
          {error && <p className="text-lh-danger text-sm">{error}</p>}
          {result && (
            <p className="text-lh-emerald text-sm">
              Sent to {result.vendorsSent.length} vendor(s). Quote range: R{" "}
              {result.quoteMin} - R {result.quoteMax}.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
