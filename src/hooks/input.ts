// UserPromptSubmit hook が stdin に渡してくる発言を、ツールによらない形にそろえる。
//   Claude Code / Codex: prompt は文字列
//   Kimi Code:           prompt はパーツの配列。テキストのパーツだけ拾う
export type Prompt = { text: string; cwd: string };

type Part = { type: string; [k: string]: unknown };
type Raw = { prompt: string | Part[]; cwd: string };

export async function readPrompt(): Promise<Prompt> {
  return toPrompt((await Bun.stdin.json()) as Raw);
}

export function toPrompt(raw: Raw): Prompt {
  const parts: Part[] = typeof raw.prompt === "string" ? [{ type: "text", text: raw.prompt }] : raw.prompt;
  return {
    text: parts.flatMap((p) => (p.type === "text" && typeof p.text === "string" ? [p.text] : [])).join("\n"),
    cwd: raw.cwd,
  };
}
