// Claude Code / Codex の UserPromptSubmit hook は stdin に JSON を渡してくる
export type PromptInput = {
  prompt: string;
  cwd: string;
  transcript_path: string;
};

export async function readPromptInput(): Promise<PromptInput> {
  return (await Bun.stdin.json()) as PromptInput;
}
