"use client";

import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
  pinned?: boolean;
};

function sortQuestions(list: Question[]) {
  return [...list].sort((a, b) => {
    // pinned questions first
    if (a.pinned !== b.pinned) {
      return Number(b.pinned) - Number(a.pinned);
    }

    // then sort by votes
    return b.votes - a.votes;
  });
}

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState(
    sortQuestions(initialQuestions)
  );

  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const [improving, setImproving] = useState(false);

  // Search with debounce
  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;

      const res = await fetch(url);
      const data = await res.json();

      setQuestions(sortQuestions(data.questions));
      setHasMore(data.hasMore);
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  // AI refine question
  async function refineQuestion() {
    if (!draft.trim()) return;

    try {
      setImproving(true);

      const res = await fetch("/api/ping-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: draft,
        }),
      });

      const data = await res.json();

      setDraft(data.refined);
    } catch (error) {
      console.error("Refine failed:", error);
    } finally {
      setImproving(false);
    }
  }

  // Submit question
  async function submit() {
    if (!draft.trim()) return;

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: draft,
      }),
    });

    const created = await res.json();

    setQuestions((qs) =>
      sortQuestions([
        {
          ...created,
          votes: 0,
          pinned: false,
        },
        ...qs,
      ])
    );

    setDraft("");
  }

  // Upvote / Downvote
  async function vote(id: string, type: "up" | "down") {
    try {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voterId: getVoterId(),
          type,
        }),
      });

      const data = await res.json();

      setQuestions((qs) =>
        sortQuestions(
          qs.map((q) =>
            q.id === id
              ? {
                ...q,
                votes: data.votes,
              }
              : q
          )
        )
      );
    } catch (error) {
      console.error("Vote failed:", error);
    }
  }

  // Pin / Unpin
  async function togglePin(id: string) {
    try {
      const res = await fetch(`/api/questions/${id}/pin`, {
        method: "POST",
      });

      const updated = await res.json();

      setQuestions((qs) =>
        sortQuestions(
          qs.map((q) =>
            q.id === id
              ? {
                ...q,
                pinned: updated.pinned,
              }
              : q
          )
        )
      );
    } catch (error) {
      console.error("Pin failed:", error);
    }
  }

  // Load more questions
  async function loadMore() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/questions?offset=${questions.length}`
      );

      const data = await res.json();

      setQuestions((prev) => {
        const existingIds = new Set(
          prev.map((q) => q.id)
        );

        const newQuestions = data.questions.filter(
          (q: Question) => !existingIds.has(q.id)
        );

        return sortQuestions([
          ...prev,
          ...newQuestions,
        ]);
      });

      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Load more failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-sky-200 to-blue-300">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Live Questions
          </h1>

          <p className="text-gray-500">
            Ask questions, vote for the best ones, and pin important discussions.
          </p>
        </div>

        {/* Ask Question Box */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">

            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask your question..."
              className="flex-1 rounded-xl border px-4 py-3 outline-none transition focus:border-black"
            />

            <div className="flex gap-2">

              <button
                onClick={refineQuestion}
                disabled={improving}
                className="rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-100 disabled:opacity-50"
              >
                {improving ? "Improving..." : "✨ AI Refine"}
              </button>

              <button
                onClick={submit}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                Ask
              </button>

            </div>
          </div>
        </div>

        {/* Search */}
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-2xl border bg-white px-4 py-3 shadow-sm outline-none transition focus:border-black"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-2 shadow-sm backdrop-blur-lg">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Questions
          </h2>

          <div className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
            {questions.length}
          </div>
        </div>
        {/* Questions List */}
        <ul className="space-y-4">

          {questions.map((q) => (
            <li
              key={q.id}
              className={`group flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${q.pinned
                ? "border-yellow-400 bg-yellow-50"
                : "bg-white/60 backdrop-blur-xl border-white/40"
                }`}
            >

              {/* Vote Section */}
              <div className="flex flex-col items-center gap-2">

                <button
                  onClick={() => vote(q.id, "up")}
                  className="rounded-lg border bg-white px-3 py-1 transition-all duration-200 hover:scale-110 hover:bg-green-100 active:scale-95"
                >
                  ▲
                </button>

                <span className="text-lg font-semibold">
                  {q.votes}
                </span>

                <button
                  onClick={() => vote(q.id, "down")}
                  className="rounded-lg border bg-white px-3 py-1 transition-all duration-200 hover:scale-110 hover:bg-red-100 active:scale-95"
                >
                  ▼
                </button>

              </div>

              {/* Question Content */}
              <div className="flex flex-1 items-center justify-between gap-4">

                <div className="space-y-1">
                  <p className="text-lg font-medium text-gray-900">
                    {q.body}
                  </p>

                  {q.author && (
                    <p className="text-sm text-gray-500">
                      by {q.author}
                    </p>
                  )}
                </div>

                {/* Pin Button */}
                <button
                  onClick={() => togglePin(q.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${q.pinned
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "hover:bg-gray-100"
                    }`}
                >
                  {q.pinned ? "📌 Pinned" : "📌 Pin"}
                </button>

              </div>
            </li>
          ))}

        </ul>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="rounded-xl border bg-white px-6 py-3 font-medium shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}