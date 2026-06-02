import { getActivePolls, createPoll } from "@/lib/polls";

export async function GET() {
  try {
    const polls = await getActivePolls();
    return Response.json({ polls, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { question, description, options } = await req.json();

    if (!question || !options || options.length < 2) {
      return Response.json(
        { error: "Question and at least 2 options are required" },
        { status: 400 }
      );
    }

    const pollId = await createPoll(question, description, options);
    return Response.json({ id: pollId, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
