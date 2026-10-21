import { expect, test } from "bun:test";
import { toPrompt } from "../src/hooks/input";

test("Claude Code / Codex: prompt は文字列", () => {
  const p = toPrompt({ prompt: "こんにちは", cwd: "/r" });
  expect(p).toEqual({ text: "こんにちは", cwd: "/r" });
});

test("Kimi Code: prompt はパーツの配列で、テキストだけ連結する", () => {
  const p = toPrompt({
    prompt: [
      { type: "text", text: "一行目" },
      { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgo=" } },
      { type: "text", text: "二行目" },
    ],
    cwd: "/r",
  });
  expect(p.text).toBe("一行目\n二行目");
});
