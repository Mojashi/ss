import { requireEnv } from "./config";

// section ブロックの text 上限(3000)に収まる、読める長さで分割する
const CHUNK = 3000;

// 本文の上に小さいグレーの文字で添える補足(リポジトリ名など)
export type Note = string;

// 誰の発言として見せるか(投稿者名とアイコンを上書きする。chat:write.customize が必要)
export type Author = { name: string; iconUrl: string };

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

  // チャンネルに直接投稿する。長文は分割して順に投稿し、どれにも note を添える
  async post(text: string, opts: { note?: Note } = {}): Promise<void> {
    for (const c of chunks(text)) await this.postOne(c, opts.note);
  }

  private async postOne(text: string, note: Note | undefined): Promise<void> {
    await this.call(
      "chat.postMessage",
      JSON.stringify({
        channel: this.channel,
        text: note ? `${note}\n${text}` : text, // 通知・検索用のフォールバック
        blocks: note ? blocks(note, text) : undefined,
        username: this.author.name,
        icon_url: this.author.iconUrl,
        unfurl_links: false,
        unfurl_media: false,
      }),
    );
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

function blocks(note: Note, text: string) {
  return [
    { type: "context", elements: [{ type: "mrkdwn", text: note }] },
    { type: "section", text: { type: "mrkdwn", text } },
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
