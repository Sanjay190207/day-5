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
  const [hydrated, setHydrated] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);
  useEffect(() => setHydrated(true), []);

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

  if (!hydrated) return <div className="p-4">Loading polls...</div>;

  if (loading) return <div className="p-4">Loading polls...</div>;

  if (polls.length === 0) {
    return <div className="p-4 text-gray-500">No active polls</div>;
  }

  const totalVotes = (options: PollOption[]) =>
    options.reduce((sum, opt) => sum + opt.vote_count, 0);

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Active Polls</h2>
      <div className="space-y-6">
        {polls.map((poll) => {
          const total = totalVotes(poll.options);
          const hasVoted = votedPolls.has(poll.id);

          return (
            <div
              key={poll.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <h3 className="text-lg font-semibold mb-2">{poll.question}</h3>
              {poll.description && (
                <p className="text-gray-600 text-sm mb-4">{poll.description}</p>
              )}

              <div className="space-y-3">
                {poll.options.map((option) => {
                  const percentage =
                    total > 0 ? Math.round((option.vote_count / total) * 100) : 0;

                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        !hasVoted && handleVote(poll.id, option.id)
                      }
                      disabled={hasVoted}
                      className={`w-full text-left p-3 rounded-lg border transition ${hasVoted
                        ? "bg-gray-50 border-gray-200 cursor-default"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{option.option_text}</span>
                        <span className="text-sm text-gray-600">
                          {option.vote_count} ({percentage}%)
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasVoted && (
                <p className="text-sm text-green-600 mt-3">✓ You voted</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="border rounded-lg p-4 mb-8 bg-white">
        <h2 className="text-xl font-bold mb-4">Create New Poll</h2>

        <input
          type="text"
          placeholder="Poll question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border rounded p-2 mb-3"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded p-2 mb-3"
        />

        <div className="space-y-2 mb-3">
          {options.map((option, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) =>
                updateOption(index, e.target.value)
              }
              className="w-full border rounded p-2"
            />
          ))}
        </div>

        <button
          onClick={addOption}
          className="px-3 py-2 border rounded mr-3"
        >
          Add Option
        </button>

        <button
          onClick={handleCreatePoll}
          disabled={creating}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {creating ? "Creating..." : "Create Poll"}
        </button>
      </div>
    </div>
  );
}
