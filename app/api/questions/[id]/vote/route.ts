import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;

  const { voterId, type } = await req.json();

  // find existing vote
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("question_id", questionId)
    .eq("voter_id", voterId)
    .maybeSingle();

  // NO EXISTING VOTE
  if (!existingVote) {
    await supabase.from("votes").insert({
      question_id: questionId,
      voter_id: voterId,
      type,
    });
  }

  // SAME VOTE AGAIN → REMOVE
  else if (existingVote.type === type) {
    await supabase
      .from("votes")
      .delete()
      .eq("id", existingVote.id);
  }

  // SWITCH VOTE
  else {
    await supabase
      .from("votes")
      .update({ type })
      .eq("id", existingVote.id);
  }

  // recalculate votes
  const { data: votesData } = await supabase
    .from("votes")
    .select("type")
    .eq("question_id", questionId);

  let votes = 0;

  votesData?.forEach((vote) => {
    if (vote.type === "up") votes += 1;
    else votes -= 1;
  });

  // update question vote count
  await supabase
    .from("questions")
    .update({ votes })
    .eq("id", questionId);

  return Response.json({
    votes,
  });
}