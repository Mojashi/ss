// UserPromptSubmit: ユーザーの発言を、秘密情報を伏せてチャンネルに流す。
// 本人の名前・アイコンで投稿し、どのリポジトリ・ブランチでの発言かを薄い文字で添える。
import { promptOrigin, publishUserText } from "../messages";
import { SlackChannel } from "../slack";
import { readHookInput, type HookInput } from "./input";

const input = await readHookInput<HookInput & { prompt: string }>();
const message = await publishUserText(input.prompt);

await SlackChannel.fromEnv().post(message, { note: await promptOrigin(input.cwd) });
