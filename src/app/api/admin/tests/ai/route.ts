import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { apiKey, subjectName, count, customPrompt, type, model } = await req.json();

    if (!apiKey || !subjectName) {
      return NextResponse.json({ error: "API Key and Subject Name are required" }, { status: 400 });
    }

    const selectedModel = model || "gemini-1.5-flash";
    const cleanApiKey = apiKey.trim();

    const systemInstruction = `
      You are a specialized GATE Exam Question Generator. 
      Generate exactly ${count || 5} questions for the subject "${subjectName}".
      Type: ${type || 'mixed'} (MCQ, MSQ, NAT).
      Difficulty/Instructions: ${customPrompt || 'Standard GATE level'}.

      Output MUST be ONLY a valid raw JSON array of objects. 
      IMPORTANT: DO NOT include any markdown code blocks (like \`\`\`json), NO backticks, and no text before or after the JSON.
      
      Schema:
      - MCQ: { type: "MCQ", question, option1, option2, option3, option4, correctAns: "option1"|"option2"|"option3"|"option4", marks, negativeMarks, explanation }
      - MSQ: { type: "MSQ", question, option1, option2, option3, option4, correctAnswers: ["option1",...], marks, explanation }
      - NAT: { type: "NAT", question, correctAnsMin, correctAnsMax, marks, explanation }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${cleanApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemInstruction }] }]
      })
    }).catch(err => {
      if (err.code === 'EAI_AGAIN' || err.message.includes('getaddrinfo')) {
        throw new Error("DNS Lookup failed. Please check your internet connection or DNS settings.");
      }
      throw err;
    });

    const data = await response.json();
    
    if (data.error) {
        console.error("Gemini API Error Body:", JSON.stringify(data, null, 2));
        return NextResponse.json({ 
          error: data.error.message,
          details: data.error
        }, { status: data.error.code || 500 });
    }

    const generatedContent = data.candidates[0].content.parts[0].text;
    const questions = JSON.parse(generatedContent);

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
