// UserPromptSubmit: 人が書いた発言を、本人名義でチャンネルに流す。
// 画像は、発言に入っていればそのまま(Kimi Code)、無ければ transcript に書かれるのを裏で待って取り出す(Claude Code)。
import { mentionsImages, transcriptLength } from "../attachments";
import { inBackground } from "../background";
import { relay } from "../relay";
import { isWorthRelaying } from "../relay-policy";
import { readPrompt } from "./input";

const prompt = await readPrompt();

if (isWorthRelaying(prompt.text)) {
  if (prompt.images.length > 0) {
    await relay(prompt, prompt.images);
  } else if (mentionsImages(prompt.text) && prompt.transcriptPath) {
    const since = await transcriptLength(prompt.transcriptPath);
    inBackground(new URL("./relay-with-images.ts", import.meta.url).pathname, {
      text: prompt.text,
      cwd: prompt.cwd,
      transcriptPath: prompt.transcriptPath,
      since,
    });
  } else {
    await relay(prompt);
  }
}
