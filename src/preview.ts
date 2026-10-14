// 既存の transcript を「Slack にこう載る」形で標準出力に出す。投稿はしない。
// usage: bun run preview <transcript.jsonl>
import { publishUserText } from "./messages";
import { isWorthRelaying } from "./relay-policy";

const path = process.argv[2];
if (!path) throw new Error("usage: bun run preview <transcript.jsonl>");

type Entry = {
  type: string;
  isMeta?: boolean;
  isSidechain?: boolean;
  message?: { content?: unknown };
};

const entries = (await Bun.file(path).text())
  .split("\n")
  .filter((l) => l.trim() !== "")
  .map((l) => JSON.parse(l) as Entry);

for (const e of entries) {
  const content = e.message?.content;
  if (e.type === "user" && typeof content === "string" && !e.isMeta && !e.isSidechain && isWorthRelaying(content)) {
    console.log(`${await publishUserText(content)}\n---`);
  }
}
