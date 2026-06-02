import { votePoll } from "@/lib/polls";

export async function POST(req: Request) {
  try {
    const { pollOptionId, voterId } = await req.json();

    if (!pollOptionId || !voterId) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const success = await votePoll(pollOptionId, voterId);

    if (!success) {
      return Response.json(
        { error: "You have already voted on this poll" },
        { status: 409 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Poll vote error:", message);

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}