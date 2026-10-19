import { expect, test } from "bun:test";
import { isWorthRelaying } from "../src/relay-policy";

test("普通の日本語の発言は流す", () => {
  expect(isWorthRelaying("これ使い始めたい　セットアップして")).toBe(true);
});

test("短い英語の発言は流す", () => {
  expect(isWorthRelaying("fix the build please")).toBe(true);
});

test("システムが差し込むタグ付きメッセージは流さない", () => {
  expect(isWorthRelaying("<task-notification>\n<task-id>abc</task-id>\n</task-notification>")).toBe(false);
  expect(isWorthRelaying("  <local-command-caveat>Caveat: ...</local-command-caveat>")).toBe(false);
});

test("Orca が差し込む受信通知は流さない", () => {
  expect(isWorthRelaying("You have 1 orchestration message. Run orca orchestration check --run run_396561c5f011.")).toBe(false);
  expect(isWorthRelaying("You have 3 orchestration messages. Run orca orchestration check --run run_abc.")).toBe(false);
});

test("ほとんど英語の長文は、日本語が少し混ざっていても流さない", () => {
  expect(isWorthRelaying("Error: something failed at line 1. ".repeat(10))).toBe(false);
  expect(isWorthRelaying("このエラーなに？ " + "Error: something failed. ".repeat(10))).toBe(false);
});

test("英語が混ざっていても日本語が主の長文は流す", () => {
  const prompt = "src/hooks/user-prompt.ts の relay を呼ぶ前に isWorthRelaying で判定して、流さない発言はスキップするようにしたい。".repeat(3);
  expect(prompt.length).toBeGreaterThanOrEqual(200);
  expect(isWorthRelaying(prompt)).toBe(true);
});

test("日本語でも 2000 文字を超える発言は流さない", () => {
  expect(isWorthRelaying("あ".repeat(2000))).toBe(true);
  expect(isWorthRelaying("あ".repeat(2001))).toBe(false);
});
