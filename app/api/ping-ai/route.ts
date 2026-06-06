import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Correct the grammar and make this question concise.
Return only the improved question.

Question:
${body.question}
`,
    });

    return Response.json({
      refined: res.text || body.question,
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    return Response.json(
      {
        error:
          "AI service is busy right now. Please try again later.",
      },
      {
        status: 500,
      }
    );
  }
}