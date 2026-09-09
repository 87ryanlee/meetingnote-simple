import { NextResponse } from "next/server";
import { processWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;

const AUDIO_TYPES = new Set(["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/ogg"]);
const TEXT_TYPES = new Set(["text/plain", "text/markdown"]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "파일을 선택해 주세요." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "파일은 25MB 이하만 업로드할 수 있습니다." }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const isAudio = AUDIO_TYPES.has(file.type) || file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i);
    const isText = TEXT_TYPES.has(file.type) || file.name.match(/\.(txt|md)$/i);
    if (!isAudio && !isText) return NextResponse.json({ error: "지원하지 않는 파일 형식입니다. 오디오, TXT, MD 파일을 사용해 주세요." }, { status: 400 });

    const result = isAudio
      ? await processWithGemini({ bytes, mimeType: file.type || "audio/mpeg" })
      : await processWithGemini({ text: bytes.toString("utf-8") });

    return NextResponse.json({ filename: file.name, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.";
    console.error(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
