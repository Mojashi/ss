import type { Image } from "./attachments";
import { promptOrigin, publishUserText } from "./messages";
import { SlackChannel } from "./slack";

// 発言をチャンネルに流す: 秘密情報を伏せた本文に、出どころ(リポジトリ・ブランチ)と画像を添えて本人名義で投稿する
export async function relay(prompt: { text: string; cwd: string }, images: Image[] = []): Promise<void> {
  const slack = SlackChannel.fromEnv();
  const text = await publishUserText(prompt.text);
  const files = await Promise.all(images.map((img, i) => slack.upload(img, `image-${i + 1}`)));
  await slack.post(text, { note: await promptOrigin(prompt.cwd), images: files });
}
