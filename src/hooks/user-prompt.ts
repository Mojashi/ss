// UserPromptSubmit: 人が書いた発言を、本人名義でチャンネルに流す。
// 画像付きなら、画像が transcript に書かれるのを裏で待ってから流す(hook は待たせない)。
import { mentionsImages, transcriptLength } from "../attachments";
import { inBackground } from "../background";
import { relay } from "../relay";
import { isWorthRelaying } from "../relay-policy";
import { readPromptInput } from "./input";

const input = await readPromptInput();

if (isWorthRelaying(input.prompt)) {
  if (mentionsImages(input.prompt)) {
    const since = await transcriptLength(input.transcript_path);
    inBackground(new URL("./relay-with-images.ts", import.meta.url).pathname, { ...input, since });
  } else {
    await relay(input);
  }
}
