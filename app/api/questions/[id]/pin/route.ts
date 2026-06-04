import { supabase } from "@/lib/supabase";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // get current question
    const { data: question } = await supabase
        .from("questions")
        .select("pinned")
        .eq("id", id)
        .single();

    if (!question) {
        return Response.json(
            { error: "Question not found" },
            { status: 404 }
        );
    }

    // toggle pin
    const { data, error } = await supabase
        .from("questions")
        .update({
            pinned: !question.pinned,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return Response.json(data);
}