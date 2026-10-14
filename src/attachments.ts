// 発言に貼られた画像。Claude Code は hook の時点ではまだ transcript に発言を書いていないので、
// 書かれるのを待ってから取り出す。

export type Image = { bytes: Uint8Array<ArrayBuffer>; mediaType: string };

// 画像を貼ると発言に [Image #1] のような印が入る
export const mentionsImages = (prompt: string) => /\[Image #\d+\]/.test(prompt);

// transcript の現在の行数。これより後に書かれた発言だけを探す
export async function transcriptLength(path: string): Promise<number> {
  const f = Bun.file(path);
  return (await f.exists()) ? lines(await f.text()).length : 0;
}

// since 行目以降に prompt の発言が書かれるのを待ち、その画像を返す。時間内に現れなければ例外
export async function imagesOf(
  path: string,
  prompt: string,
  opts: { since: number; waitMs: number },
): Promise<Image[]> {
  const deadline = Date.now() + opts.waitMs;
  while (Date.now() < deadline) {
    const entry = await findPrompt(path, prompt, opts.since);
    if (entry) return imagesIn(entry);
    await Bun.sleep(500);
  }
  throw new Error(`transcript に発言が ${opts.waitMs}ms 以内に現れませんでした: ${path}`);
}

type Block =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: string };
type Entry = { type: string; message?: { content?: string | Block[] } };

async function findPrompt(path: string, prompt: string, since: number): Promise<Block[] | undefined> {
  const f = Bun.file(path);
  if (!(await f.exists())) return undefined;
  for (const line of lines(await f.text()).slice(since)) {
    const e = JSON.parse(line) as Entry;
    const content = e.message?.content;
    if (e.type !== "user" || !Array.isArray(content)) continue;
    const text = content.flatMap((b) => (b.type === "text" && "text" in b ? [b.text] : [])).join("\n");
    if (text.trim() === prompt.trim()) return content;
  }
  return undefined;
}

function imagesIn(content: Block[]): Image[] {
  return content.flatMap((b) =>
    b.type === "image" && "source" in b && b.source.type === "base64"
      ? [{ bytes: new Uint8Array(Buffer.from(b.source.data, "base64")), mediaType: b.source.media_type }]
      : [],
  );
}

const lines = (raw: string) => raw.split("\n").filter((l) => l.trim() !== "");
