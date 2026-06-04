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
    <div className="space-y-4">

      {/* Ask Question */}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-md border px-3 py-2"
        />

        <button
          onClick={refineQuestion}
          disabled={improving}
          className="rounded-md border px-4 py-2"
        >
          {improving ? "Improving..." : "AI Refine"}
        </button>

        <button
          onClick={submit}
          className="rounded-md border px-4 py-2"
        >
          Ask
        </button>
      </div>

      {/* Search */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search questions…"
        className="w-full rounded-md border px-3 py-2"
      />

      {/* Questions */}
      <ul className="space-y-3">
        {questions.map((q) => (
          <li
            key={q.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            {/* Votes */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => vote(q.id, "up")}
                className="rounded-md border px-2 py-1"
              >
                ▲
              </button>

              <span>{q.votes}</span>

              <button
                onClick={() => vote(q.id, "down")}
                className="rounded-md border px-2 py-1"
              >
                ▼
              </button>
            </div>

            {/* Question Body */}
            <div className="flex items-center gap-3 flex-1 justify-between">
              <span>{q.body}</span>

              <button
                onClick={() => togglePin(q.id)}
                className="rounded-md border px-2 py-1 text-sm"
              >
                {q.pinned ? "📌 Unpin" : "📌 Pin"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}