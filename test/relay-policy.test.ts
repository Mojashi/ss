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

test("日本語を含まない長文は流さない", () => {
  expect(isWorthRelaying("Error: something failed at line 1. ".repeat(10))).toBe(false);
});

test("日本語が混ざった長文は流す", () => {
  expect(isWorthRelaying("このエラーなに？ " + "Error: something failed. ".repeat(10))).toBe(true);
});
