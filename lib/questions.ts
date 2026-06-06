import { supabase } from "@/lib/supabase";

type QuestionRow = {
  id: string;
  body: string;
  author: string | null;
  created_at: string;
  votes: number;
  pinned: boolean;
};

export async function getQuestionsPage(
  offset: number,
  limit: number
) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at, votes, pinned")
    .order("pinned", { ascending: false })
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  const rows: QuestionRow[] = data ?? [];

  const questions = rows.map((q) => ({
    id: q.id,
    body: q.body,
    author: q.author,
    created_at: q.created_at,
    votes: q.votes ?? 0,
    pinned: q.pinned,
  }));

  const hasMore = rows.length === limit;

  return {
    questions,
    hasMore,
  };
}

export async function searchQuestions(
  q: string,
  limit: number
) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at, votes, pinned")
    .textSearch("body", q, {
      type: "websearch",
      config: "english",
    })
    .order("pinned", { ascending: false })
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows: QuestionRow[] = data ?? [];

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    author: row.author,
    created_at: row.created_at,
    votes: row.votes ?? 0,
    pinned: row.pinned,
  }));
}