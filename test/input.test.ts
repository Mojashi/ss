import { expect, test } from "bun:test";
import { toPrompt } from "../src/hooks/input";

const PNG = "iVBORw0KGgo=";

test("Claude Code / Codex: prompt は文字列", () => {
  const p = toPrompt({ prompt: "こんにちは [Image #1]", cwd: "/r", transcript_path: "/t.jsonl" });
  expect(p).toMatchObject({ text: "こんにちは [Image #1]", cwd: "/r", transcriptPath: "/t.jsonl", images: [] });
});

test("Kimi Code: prompt はパーツの配列で、テキストを連結する", () => {
  const p = toPrompt({ prompt: [{ type: "text", text: "一行目" }, { type: "text", text: "二行目" }], cwd: "/r" });
  expect(p.text).toBe("一行目\n二行目");
  expect(p.transcriptPath).toBeUndefined();
});

test("画像パーツはよくある書き方をどれも受ける", () => {
  const p = toPrompt({
    prompt: [
      { type: "text", text: "これ見て" },
      { type: "image_url", image_url: { url: `data:image/png;base64,${PNG}` } },
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: PNG } },
      { type: "image", data: PNG, mimeType: "image/webp" },
    ],
    cwd: "/r",
  });
  expect(p.images.map((i) => i.mediaType)).toEqual(["image/png", "image/jpeg", "image/webp"]);
  expect(p.images[0]!.bytes.slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
});
