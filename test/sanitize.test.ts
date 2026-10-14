import { expect, test } from "bun:test";
import { redactSecrets, toMrkdwn } from "../src/sanitize";

test("gitleaks で検出した秘密情報を伏せる", async () => {
  const out = await redactSecrets("key is AKIAQYLPMN5HHHFPZAM2 ok"); // gitleaks:allow (ダミー)
  expect(out).toBe("key is [REDACTED:aws-access-token] ok");
});

test("秘密情報がなければそのまま", async () => {
  expect(await redactSecrets("普通の文章")).toBe("普通の文章");
});

test("Markdown を Slack mrkdwn に寄せる", () => {
  expect(toMrkdwn("## 見出し\n**太字** [リンク](https://example.com)")).toBe(
    "*見出し*\n*太字* <https://example.com|リンク>",
  );
});
