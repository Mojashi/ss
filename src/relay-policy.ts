// どの発言を Slack に流すか。人が書いた発言だけを流す。

// <task-notification> など、システムが発言として差し込んでくるもの
const isSystemInjected = (prompt: string) => /^\s*<[A-Za-z][\w-]*[\s>]/.test(prompt);

// Orca が supervised worker のターミナルに差し込む受信通知
const isOrcaNotification = (prompt: string) =>
  /^\s*You have \d+ orchestration messages?\. Run orca orchestration check\b/.test(prompt);

// ほとんど英語の長文は、ログや英語ドキュメントの貼り付けとみなす
const LONG = 200;
const MIN_JAPANESE_RATIO = 0.1;
const count = (s: string, re: RegExp) => s.match(re)?.length ?? 0;
function japaneseRatio(s: string): number {
  const japanese = count(s, /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu);
  const letters = count(s, /[\p{L}]/gu);
  return letters === 0 ? 0 : japanese / letters;
}
const isLongEnglish = (prompt: string) => prompt.length >= LONG && japaneseRatio(prompt) < MIN_JAPANESE_RATIO;

// 日本語でも長すぎる発言は、人が書いたものではない(エージェント同士のやりとりや貼り付け)とみなす
const TOO_LONG = 2000;
const isTooLong = (prompt: string) => prompt.length > TOO_LONG;

export function isWorthRelaying(prompt: string): boolean {
  return !isSystemInjected(prompt) && !isOrcaNotification(prompt) && !isLongEnglish(prompt) && !isTooLong(prompt);
}
