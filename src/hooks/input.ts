import type { Image } from "../attachments";

// UserPromptSubmit hook が stdin に渡してくる発言を、ツールによらない形にそろえる。
//   Claude Code / Codex: prompt は文字列。画像は transcript にしか無い
//   Kimi Code:           prompt はパーツの配列。画像もパーツとして入っている
export type Prompt = {
  text: string;
  cwd: string;
  images: Image[];
  transcriptPath?: string;
};

type Part = { type: string; [k: string]: unknown };
type Raw = { prompt: string | Part[]; cwd: string; transcript_path?: string };

export async function readPrompt(): Promise<Prompt> {
  return toPrompt((await Bun.stdin.json()) as Raw);
}

export function toPrompt(raw: Raw): Prompt {
  const parts: Part[] = typeof raw.prompt === "string" ? [{ type: "text", text: raw.prompt }] : raw.prompt;
  return {
    text: parts.flatMap((p) => (p.type === "text" && typeof p.text === "string" ? [p.text] : [])).join("\n"),
    cwd: raw.cwd,
    images: parts.flatMap((p) => imageIn(p) ?? []),
    transcriptPath: raw.transcript_path,
  };
}

// 画像パーツの書き方はツールによって違うので、よくある形をどれも受ける
function imageIn(p: Part): Image | undefined {
  const url = typeof p.image_url === "string" ? p.image_url : (p.image_url as { url?: unknown } | undefined)?.url;
  if (typeof url === "string") return fromDataUrl(url);
  const source = p.source as { type?: string; media_type?: string; data?: string } | undefined;
  if (source?.type === "base64" && source.data && source.media_type) return decode(source.data, source.media_type);
  if (typeof p.data === "string" && typeof p.mimeType === "string") return decode(p.data, p.mimeType);
  return undefined;
}

function fromDataUrl(url: string): Image | undefined {
  const m = url.match(/^data:([^;]+);base64,(.*)$/s);
  return m ? decode(m[2]!, m[1]!) : undefined;
}

const decode = (base64: string, mediaType: string): Image => ({
  bytes: new Uint8Array(Buffer.from(base64, "base64")),
  mediaType,
});
