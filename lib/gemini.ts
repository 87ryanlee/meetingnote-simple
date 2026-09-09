import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

export type MeetingNotes = {
  summary: string;
  decisions: string[];
  actionItems: string[];
};

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    transcript: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    decisions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    actionItems: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["transcript", "summary", "decisions", "actionItems"],
};

export async function processWithGemini(input: { text?: string; bytes?: Buffer; mimeType?: string }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");

  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", responseSchema },
  });

  const prompt = `당신은 한국어 회의록 편집자입니다. 제공된 녹취 또는 텍스트를 정확하고 간결한 회의록으로 정리하세요.
- transcript: 오디오라면 들리는 내용을 한국어로 받아쓰고, 텍스트라면 원문을 그대로 정리하세요.
- summary: 회의 목적과 핵심 논의를 3~5문장으로 요약하세요.
- decisions: 회의에서 확정된 사항만 배열로 작성하세요. 없으면 빈 배열입니다.
- actionItems: 해야 할 일을 '담당자 - 할 일 - 기한' 형식으로 작성하세요. 확인되지 않은 담당자나 기한은 '미정'으로 표시하세요.
추측하지 말고 불확실한 내용은 표현을 완화하세요.`;

  const content = input.bytes
    ? [{ text: prompt }, { inlineData: { data: input.bytes.toString("base64"), mimeType: input.mimeType || "audio/mpeg" } }]
    : `${prompt}\n\n원문:\n${input.text || ""}`;

  const result = await model.generateContent(content);
  const parsed = JSON.parse(result.response.text()) as MeetingNotes & { transcript: string };
  return parsed;
}
