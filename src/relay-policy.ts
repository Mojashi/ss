// どの発言を Slack に流すか。人が書いた発言だけを流す。

// <task-notification> など、システムが発言として差し込んでくるもの
const isSystemInjected = (prompt: string) => /^\s*<[A-Za-z][\w-]*[\s>]/.test(prompt);

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

export function isWorthRelaying(prompt: string): boolean {
  return !isSystemInjected(prompt) && !isLongEnglish(prompt);
}
