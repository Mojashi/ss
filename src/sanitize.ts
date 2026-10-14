// 公開してよい形に整える部品。どれも string -> string(非同期含む)で、合成して使う。

type Transform = (text: string) => string | Promise<string>;

export const pipe =
  (...steps: Transform[]) =>
  async (text: string): Promise<string> => {
    let out = text;
    for (const step of steps) out = await step(out);
    return out;
  };

type GitleaksFinding = { RuleID: string; Secret: string; Match: string };

// gitleaks で検出した秘密情報を [REDACTED:rule] に置き換える。
// gitleaks が使えない・失敗した場合は例外を投げる(伏せずに流すことはしない)。
export async function redactSecrets(text: string): Promise<string> {
  const proc = Bun.spawn(
    [
      "gitleaks",
      "stdin",
      "--no-banner",
      "--log-level=error",
      "--report-format=json",
      "--report-path=-",
      "--exit-code=0",
    ],
    { stdin: new Blob([text]), stdout: "pipe", stderr: "pipe" },
  );
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(`gitleaks failed (exit ${code}): ${stderr}`);

  const findings = JSON.parse(stdout) as GitleaksFinding[];
  let out = text;
  for (const f of findings) {
    for (const s of [f.Secret, f.Match]) {
      if (s) out = out.replaceAll(s, `[REDACTED:${f.RuleID}]`);
    }
  }
  return out;
}

// Markdown を Slack mrkdwn に寄せる(太字・見出し・リンクだけ)。
export function toMrkdwn(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "<$2|$1>");
}
