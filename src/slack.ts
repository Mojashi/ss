import type { Image } from "./attachments";
import { requireEnv } from "./config";

// section ブロックの text 上限(3000)に収まる、読める長さで分割する
const CHUNK = 3000;

// 本文の上に小さいグレーの文字で添える補足(リポジトリ名など)
export type Note = string;

// 誰の発言として見せるか(投稿者名とアイコンを上書きする。chat:write.customize が必要)
export type Author = { name: string; iconUrl: string };

// アップロード済みの画像(チャンネルにはまだ共有していない)
export type FileId = string;

export class SlackChannel {
  constructor(
    private readonly token: string,
    private readonly channel: string,
    private readonly author: Author,
  ) {}

  static fromEnv(): SlackChannel {
    const personal = "個人の ~/.config/ss/env に書く";
    return new SlackChannel(
      requireEnv("SS_SLACK_BOT_TOKEN", personal),
      requireEnv("SS_SLACK_CHANNEL_ID", "~/.config/ss/env か .claude/settings.json の env に書く"),
      { name: requireEnv("SS_AUTHOR_NAME", personal), iconUrl: requireEnv("SS_AUTHOR_ICON_URL", personal) },
    );
  }

  // チャンネルに直接投稿する。長文は分割して順に投稿し、どれにも note を添える。画像は最後の投稿に付ける
  async post(text: string, opts: { note?: Note; images?: FileId[] } = {}): Promise<void> {
    const parts = chunks(text);
    for (const [i, c] of parts.entries()) {
      const images = i === parts.length - 1 ? (opts.images ?? []) : [];
      await this.postOne(c, opts.note, images);
    }
  }

  // 画像をアップロードする(files:write が必要)。チャンネルへの共有は post の image ブロックで行う
  async upload(image: Image, name: string): Promise<FileId> {
    const filename = `${name}.${image.mediaType.split("/")[1] ?? "png"}`;
    const { upload_url, file_id } = await this.call<{ upload_url: string; file_id: string }>(
      "files.getUploadURLExternal",
      new URLSearchParams({ filename, length: String(image.bytes.length) }),
    );
    const res = await fetch(upload_url, { method: "POST", body: image.bytes });
    if (!res.ok) throw new Error(`Slack file upload failed: HTTP ${res.status}`);
    await this.call("files.completeUploadExternal", JSON.stringify({ files: [{ id: file_id, title: filename }] }));
    return file_id;
  }

  private async postOne(text: string, note: Note | undefined, images: FileId[]): Promise<void> {
    const message = JSON.stringify({
      channel: this.channel,
      text: note ? `${note}\n${text}` : text, // 通知・検索用のフォールバック
      blocks: note || images.length ? blocks(note, text, images) : undefined,
      username: this.author.name,
      icon_url: this.author.iconUrl,
      unfurl_links: false,
      unfurl_media: false,
    });
    // アップロード直後の画像は Slack 側の処理待ちで invalid_blocks になることがあるので少し待って再送する
    for (let attempt = 1; ; attempt++) {
      try {
        await this.call("chat.postMessage", message);
        return;
      } catch (e) {
        if (!images.length || attempt >= 5 || !String(e).includes("invalid_blocks")) throw e;
        await Bun.sleep(1000 * attempt);
      }
    }
  }

  private async call<T = object>(method: string, body: string | URLSearchParams): Promise<T> {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type":
          typeof body === "string" ? "application/json; charset=utf-8" : "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as { ok: boolean; error?: string } & T;
    if (!json.ok) throw new Error(`Slack ${method} failed: ${json.error}`);
    return json;
  }
}

function blocks(note: Note | undefined, text: string, images: FileId[]) {
  return [
    ...(note ? [{ type: "context", elements: [{ type: "mrkdwn", text: note }] }] : []),
    { type: "section", text: { type: "mrkdwn", text } },
    ...images.map((id) => ({ type: "image", slack_file: { id }, alt_text: "添付画像" })),
  ];
}

function chunks(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if (cur && cur.length + line.length + 1 > CHUNK) {
      out.push(cur);
      cur = "";
    }
    // 1行だけで上限を超える場合は強制的に切る
    let l = line;
    while (l.length > CHUNK) {
      if (cur) out.push(cur);
      out.push(l.slice(0, CHUNK));
      cur = "";
      l = l.slice(CHUNK);
    }
    cur = cur ? `${cur}\n${l}` : l;
  }
  if (cur) out.push(cur);
  return out;
}
