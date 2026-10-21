import { promptOrigin, publishUserText } from "./messages";
import { SlackChannel } from "./slack";

// 発言をチャンネルに流す: 秘密情報を伏せた本文に、出どころ(リポジトリ・ブランチ)を添えて本人名義で投稿する
export async function relay(prompt: { text: string; cwd: string }): Promise<void> {
  const slack = SlackChannel.fromEnv();
  await slack.post(await publishUserText(prompt.text), { note: await promptOrigin(prompt.cwd) });
}
