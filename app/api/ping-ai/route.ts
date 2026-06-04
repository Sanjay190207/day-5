import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(req:Request) {
  const body = await req.json();

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
Correct the grammar and make this question concise.
Return only the improved question.

Question:
${body.question}
`
  });

  return Response.json({
    refined: res.text
  });
}