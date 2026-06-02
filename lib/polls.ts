import { supabase } from "@/lib/supabase";

export type Poll = {
  id: string;
  question: string;
  description: string | null;
  created_at: string;
  closed_at: string | null;
};

export type PollOption = {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
};

export type PollWithOptions = Poll & {
  options: PollOption[];
};

export async function getActivePolls(): Promise<PollWithOptions[]> {
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("*")
    .is("closed_at", null)
    .order("created_at", { ascending: false });

  if (pollsError) throw new Error(pollsError.message);

  const pollsWithOptions = await Promise.all(
    (polls ?? []).map(async (poll) => {
      const { data: options, error: optionsError } = await supabase
        .from("poll_options")
        .select("id, poll_id, option_text, poll_votes(count)")
        .eq("poll_id", poll.id);

      if (optionsError) throw new Error(optionsError.message);

      return {
        ...poll,
        options: (options ?? []).map((opt) => ({
          id: opt.id,
          poll_id: opt.poll_id,
          option_text: opt.option_text,
          vote_count: opt.poll_votes?.[0]?.count ?? 0,
        })),
      };
    })
  );

  return pollsWithOptions;
}

export async function getPollById(pollId: string): Promise<PollWithOptions> {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (pollError) throw new Error(pollError.message);

  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, poll_id, option_text, poll_votes(count)")
    .eq("poll_id", pollId);

  if (optionsError) throw new Error(optionsError.message);

  return {
    ...poll,
    options: (options ?? []).map((opt) => ({
      id: opt.id,
      poll_id: opt.poll_id,
      option_text: opt.option_text,
      vote_count: opt.poll_votes?.[0]?.count ?? 0,
    })),
  };
}

export async function votePoll(
  pollOptionId: string,
  voterId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("poll_votes")
    .insert({ poll_option_id: pollOptionId, voter_id: voterId });

  if (error) {
    // Check if it's a unique constraint violation (user already voted)
    if (error.code === "23505" || error.message?.includes("unique")) {
      console.log("User already voted on this option");
      return false;
    }
    console.error("Vote error:", error);
    throw new Error(error.message);
  }
  return true;
}

export async function createPoll(
  question: string,
  description: string | null,
  options: string[]
): Promise<string> {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({ question, description })
    .select()
    .single();

  if (pollError) throw new Error(pollError.message);

  const pollId = poll.id;

  for (const option of options) {
    const { error: optError } = await supabase
      .from("poll_options")
      .insert({ poll_id: pollId, option_text: option });

    if (optError) throw new Error(optError.message);
  }

  return pollId;
}
