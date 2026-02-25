import { NextResponse, NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from "@google/generative-ai";

/* -------------------------------------------------------------------------- */
/* SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const questionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["MCQ", "MSQ", "NAT"],
            description: "The category of the GATE question.",
          },
          question: { 
            type: SchemaType.STRING,
            description: "Detailed technical question stem including context and constraints. 30-60 words.",
          },
          option1: { 
            type: SchemaType.STRING,
            description: "Technically descriptive option. Balanced length with other options.",
          },
          option2: { 
            type: SchemaType.STRING,
            description: "Technically descriptive option. Balanced length with other options.",
          },
          option3: { 
            type: SchemaType.STRING,
            description: "Technically descriptive option. Balanced length with other options.",
          },
          option4: { 
            type: SchemaType.STRING,
            description: "Technically descriptive option. Must NOT be significantly longer than option1-3.",
          },
          correctAns: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["option1", "option2", "option3", "option4"],
          },
          correctAnswers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "For MSQ types, list of correct option keys.",
          },
          correctAnsMin: { type: SchemaType.NUMBER },
          correctAnsMax: { type: SchemaType.NUMBER },
          marks: { type: SchemaType.NUMBER },
          negativeMarks: { type: SchemaType.NUMBER },
          explanation: { 
            type: SchemaType.STRING,
            description: "Thorough 3-5 sentence explanation of the logic or derivation.",
          },
        },
        required: ["type", "question", "marks", "explanation"],
      },
    },
  },
  required: ["questions"],
};

/* -------------------------------------------------------------------------- */
/* MODEL NORMALIZER                             */
/* -------------------------------------------------------------------------- */

/**
 * Updated to use gemini-2.0-flash as the working hardcoded model.
 * This model is stable on the v1beta endpoint and supports JSON Schema.
 */
function normalizeModel(input?: string) {
  if (!input) return "gemini-2.0-flash";
  const m = input.toLowerCase();
  
  if (m.includes("pro")) return "gemini-1.5-pro";
  // Defaulting everything else to 2.0-flash for stability
  return "gemini-2.0-flash";
}

/* -------------------------------------------------------------------------- */
/* JSON SAFETY EXTRACTOR                           */
/* -------------------------------------------------------------------------- */

function extractJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in AI response");
  return match[0];
}

/* -------------------------------------------------------------------------- */
/* ROUTE                                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      apiKey,
      subjectName,
      count = 5,
      customPrompt,
      type = "mixed",
      model,
    } = body;

    if (!apiKey || !subjectName) {
      return NextResponse.json(
        { error: "API key and subject are required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const modelId = normalizeModel(model);
    
    /**
     * Using gemini-2.0-flash ensures compatibility with the v1beta endpoint 
     * which the SDK uses for systemInstruction and responseSchema.
     */
    const generativeModel = genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: `
You are a Professor specializing in generating GATE (Graduate Aptitude Test in Engineering) questions.

SUBJECT: ${subjectName}
DIFFICULTY: Standard GATE Level.

QUALITY RULES FOR CONTENT LENGTH:
1. **Balanced Options**: All 4 options must be of roughly equal length and technical complexity. Do not let option4 become a "dump" for extra text.
2. **Descriptive Stems**: The 'question' field must provide full technical context (30-60 words). No one-liners.
3. **Thorough Explanations**: The 'explanation' field must be a clear 3-5 sentence breakdown of the concept or step-by-step numerical derivation.
4. **Logic Patterns**: Incorporate complex logic like Functional Programming (Closures), Dynamic Programming (Non-adjacent sums), or Optimized Array Scans O(n).

OUTPUT FORMAT:
- Return ONLY valid JSON matching the schema.
- For MCQ, correctAns is mandatory.
- For MSQ, correctAnswers is mandatory.
- For NAT, correctAnsMin/Max are mandatory.
`
    });

    const maxTokens = Math.min(8192, count * 1000);

    const userQuery = `
Generate exactly ${count} ${type} questions for ${subjectName}.
${customPrompt || "Focus on algorithmic complexity and system-level constraints."}

Ensure "good length" for all fields—neither too short (one-liners) nor excessively long (rambling). 
Keep all 4 options technically consistent in length.
`;

    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: userQuery }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
      },
    });

    const response = await result.response;
    const text = response.text();

    try {
      const cleanJSON = extractJSON(text);
      const data = JSON.parse(cleanJSON);

      if (!data?.questions?.length) {
        throw new Error("No questions generated");
      }

      return NextResponse.json(data.questions);
    } catch (err) {
      console.error("Invalid JSON from AI:", text);
      return NextResponse.json(
        { error: "AI returned invalid JSON format" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const message = error.message || "AI generation failed";
    const status = message.includes("429") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}