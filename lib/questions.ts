import { supabase } from "@/lib/supabase";

type QuestionRow = {
  id: string;
  body: string;
  author: string | null;
  created_at: string;
  votes:
    | {
        count: number;
      }[]
    | null;
};

export async function getQuestionsPage(
  offset: number,
  limit: number
) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at, votes(count)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit-1);

  if (error) {
    throw new Error(error.message);
  }

  const rows: QuestionRow[] = data ?? [];

  const questions = rows
    .slice(0, limit)
    .map((q) => ({
      id: q.id,
      body: q.body,
      author: q.author,
      votes: q.votes?.[0]?.count ?? 0,
    }));

  const hasMore = rows.length == limit;

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
    .select("id, body, author, created_at, votes(count)")
    .textSearch("body", q, {
      type: "websearch",
      config: "english",
    })
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
    votes: row.votes?.[0]?.count ?? 0,
  }));
}