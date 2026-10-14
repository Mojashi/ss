import { $ } from "bun";
import { basename } from "node:path";
import { pipe, redactSecrets, toMrkdwn } from "./sanitize";

// Slack に載せるメッセージの形と公開ポリシー。AI の応答は載せない。

// ユーザーの発言: 全文。秘密情報だけ伏せる
export const publishUserText = pipe(redactSecrets, toMrkdwn);

// 発言に添える出どころ: どのリポジトリ・ブランチか(誰かは投稿者名とアイコンで示す)
export async function promptOrigin(cwd: string): Promise<string> {
  const git = (cmd: string[]) =>
    $`git ${cmd}`.cwd(cwd).quiet().nothrow().text().then((s) => s.trim());

  const remote = await git(["remote", "get-url", "origin"]);
  const toplevel = await git(["rev-parse", "--show-toplevel"]);
  const branch = await git(["branch", "--show-current"]);

  const repo = remote ? repoName(remote) : basename(toplevel || cwd);
  return `${repo}${branch ? ` · \`${branch}\`` : ""}`;
}

// git@github.com:org/repo.git / https://github.com/org/repo -> org/repo
function repoName(remote: string): string {
  return remote
    .replace(/\.git$/, "")
    .replace(/^.*[:/]([^/:]+\/[^/:]+)$/, "$1");
}
