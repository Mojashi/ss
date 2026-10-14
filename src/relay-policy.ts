// どの発言を Slack に流すか。人が書いた発言だけを流す。

// <task-notification> など、システムが発言として差し込んでくるもの
const isSystemInjected = (prompt: string) => /^\s*<[A-Za-z][\w-]*[\s>]/.test(prompt);

// 日本語を含まない長文は、ログや英語ドキュメントの貼り付けとみなす
const LONG = 200;
const hasJapanese = (s: string) => /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(s);
const isLongEnglish = (prompt: string) => prompt.length >= LONG && !hasJapanese(prompt);

export function isWorthRelaying(prompt: string): boolean {
  return !isSystemInjected(prompt) && !isLongEnglish(prompt);
}
