import { NextResponse, NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import {
  GoogleGenerativeAI,
  SchemaType,
  HarmCategory,
  HarmBlockThreshold,
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
            description: "Technical question stem. 30-60 words. No code here.",
          },
          code: {
            type: SchemaType.STRING,
            description: "Code snippet with indentation (\\n). Use only for code-based questions.",
          },
          option1: { 
            type: SchemaType.STRING,
            description: "Technical choice. 5-12 words.",
          },
          option2: { 
            type: SchemaType.STRING,
            description: "Technical choice. 5-12 words.",
          },
          option3: { 
            type: SchemaType.STRING,
            description: "Technical choice. 5-12 words.",
          },
          option4: { 
            type: SchemaType.STRING,
            description: "Technical choice. 5-12 words.",
          },
          correctAns: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["option1", "option2", "option3", "option4"],
            description: "Randomize this across batches. Do not bias towards any specific option.",
          },
          correctAnswers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "For MSQ: list of correct option keys (e.g., ['option1', 'option2']).",
          },
          correctAnsMin: { type: SchemaType.NUMBER },
          correctAnsMax: { type: SchemaType.NUMBER },
          marks: { type: SchemaType.NUMBER, description: "1 or 2" },
          negativeMarks: { type: SchemaType.NUMBER },
          explanation: { 
            type: SchemaType.STRING,
            description: "Numerical/logical derivation. 3-5 sentences. Keep all reasoning here, NOT in options.",
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
      fullMock = false,
    } = body;

    if (!apiKey || (!subjectName && !fullMock)) {
      return NextResponse.json(
        { error: "API key and subject are required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const modelId = normalizeModel(model);
    const targetSubject = fullMock ? "Full GATE CSIT Syllabus (including General Aptitude)" : subjectName;
    
    const generativeModel = genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: `
You are a Professor specializing in generating GATE CSIT mock tests.
SUBJECT: ${targetSubject}
${fullMock ? "FULL MOCK TEST: Balanced distribution across all CSIT subjects and General Aptitude." : ""}

STRICT FORMATTING RULES:
1. **Option Length Equality**: All 4 options MUST be of approximately equal word count (5-12 words). Never put explanations inside options.
2. **Option Randomization**: The correct answer (correctAns) MUST be distributed randomly among option1, option2, option3, and option4. Do NOT favor any single option key.
3. **No Redundancy**: Do not repeat the question or options in the explanation; only provide the derivation.
4. **Code Safety**: Technical terms like "slave", "daemon", "kill" are used in a technical context only.

GATE PATTERN:
- MCQ: 1 mark (-0.33) or 2 marks (-0.66).
- MSQ/NAT: 1 or 2 marks (0 negative).
`,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const batchSize = 5; 
    const totalQuestions = Math.min(65, count);
    const numBatches = Math.ceil(totalQuestions / batchSize);
    let allQuestions: any[] = [];
    
    for (let i = 0; i < numBatches; i++) {
      const currentBatchCount = Math.min(batchSize, totalQuestions - allQuestions.length);
      if (currentBatchCount <= 0) break;

      const userQuery = `
Generate exactly ${currentBatchCount} ${type} questions for ${targetSubject}.
Batch ${i + 1} of ${numBatches}.
${customPrompt || ""}
Ensure randomized correct options and equal length for options 1-4.
`;

      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        try {
          const result = await generativeModel.generateContent({
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
              responseSchema: questionSchema,
            },
          });

          const response = await result.response;
          const text = response.text();
          const cleanJSON = extractJSON(text);
          const data = JSON.parse(cleanJSON);
          
          if (data?.questions?.length > 0) {
            allQuestions = [...allQuestions, ...data.questions];
            success = true;
          } else {
            throw new Error("Empty questions array");
          }
        } catch (err) {
          attempts++;
          console.error(`Batch ${i+1} attempt ${attempts} failed.`);
          if (attempts < maxAttempts) {
            // Wait 2 seconds before retry
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
      
      // Small pause between batches to be safe with rate limits
      if (i < numBatches - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (allQuestions.length === 0) {
      throw new Error("No questions generated. This might be due to API rate limits or safety filters.");
    }

    return NextResponse.json(allQuestions);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const message = error.message || "AI generation failed";
    const status = message.includes("429") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}