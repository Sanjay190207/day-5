"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type PollOption = {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
};

type Poll = {
  id: string;
  question: string;
  description: string | null;
  created_at: string;
  closed_at: string | null;
  options: PollOption[];
};

export default function PollsList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  //const [hydrated, setHydrated] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);
  // useEffect(() => setHydrated(true), []);

  useEffect(() => {
    fetchPolls();
  }, []);

  async function fetchPolls() {
    try {
      setLoading(true);
      const res = await fetch("/api/polls");
      const data = await res.json();
      if (res.ok) {
        setPolls(data.polls || []);
      } else {
        console.error("Poll error:", data.error);
        setPolls([]);
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  async function handleCreatePoll() {
    try {
      setCreating(true);

      const filteredOptions = options.filter(
        (opt) => opt.trim() !== ""
      );

      if (!question.trim() || filteredOptions.length < 2) {
        alert("Enter question and at least 2 options");
        return;
      }

      const res = await fetch("/api/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          description,
          options: filteredOptions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create poll");
      }

      setQuestion("");
      setDescription("");
      setOptions(["", ""]);

      await fetchPolls();
    } catch (error) {
      console.error(error);
      alert("Failed to create poll");
    } finally {
      setCreating(false);
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    try {
      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollOptionId: optionId,
          voterId: getVoterId(),
        }),
      });

      if (res.status === 409) {
        alert("You have already voted on this poll");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        throw new Error(data.error || "Vote failed");
      }

      setVotedPolls((prev) => new Set([...prev, pollId]));
      await fetchPolls();
    } catch (error) {
      console.error("Vote error:", error);
    }
  }

  //if (!hydrated) return <div className="p-4">Loading polls...</div>;

  if (loading) return <div className="p-4">Loading polls...</div>;

  if (polls.length === 0) {
    return <div className="p-4 text-gray-500">No active polls</div>;
  }

  const totalVotes = (options: PollOption[]) =>
    options.reduce((sum, opt) => sum + opt.vote_count, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_30%),radial-gradient(circle_at_bottom_right,_#c7d2fe,_transparent_30%),linear-gradient(to_bottom_right,_#f8fafc,_#e0f2fe,_#eef2ff)] p-6">

      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-300 opacity-20 blur-3xl rounded-full -z-10"></div>

      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-300 opacity-20 blur-3xl rounded-full -z-10"></div>
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-3">
          Live Polls
        </h1>

        <p className="text-gray-600 text-lg">
          Create interactive polls and collect real-time audience feedback
        </p>

        {/* Polls */}
        <div className="space-y-8">
          {polls.map((poll) => {
            const total = totalVotes(poll.options);
            const hasVoted = votedPolls.has(poll.id);

            return (
              <div
                key={poll.id}
                className="backdrop-blur-lg bg-white/70 border border-white/40 shadow-xl rounded-3xl p-6 transition hover:shadow-2xl"
              >
                {/* Poll Header */}
                <div className="mb-5">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {poll.question}
                  </h3>

                  {poll.description && (
                    <p className="text-gray-600">
                      {poll.description}
                    </p>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {poll.options.map((option) => {
                    const percentage =
                      total > 0
                        ? Math.round(
                          (option.vote_count / total) * 100
                        )
                        : 0;

                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          !hasVoted &&
                          handleVote(poll.id, option.id)
                        }
                        disabled={hasVoted}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${hasVoted
                          ? "bg-gray-50 border-gray-200"
                          : "bg-white hover:scale-[1.02] hover:border-blue-400 border-gray-300"
                          }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-800">
                            {option.option_text}
                          </span>

                          <span className="text-sm text-gray-600">
                            {option.vote_count} votes • {percentage}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Total votes: {total}
                  </p>

                  {hasVoted && (
                    <div className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
                      ✓ You voted
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Create Poll Card */}
        <div className="backdrop-blur-lg bg-white/70 border border-white/40 shadow-xl rounded-3xl p-6 mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            Create New Poll
          </h2>

          <input
            type="text"
            placeholder="Enter your poll question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-400"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="space-y-3 mb-5">
            {options.map((option, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) =>
                  updateOption(index, e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addOption}
              className="rounded-xl border border-gray-300 px-5 py-3 font-medium hover:bg-gray-100 transition"
            >
              + Add Option
            </button>

            <button
              onClick={handleCreatePoll}
              disabled={creating}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-white font-semibold shadow-lg hover:scale-105 transition disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}
