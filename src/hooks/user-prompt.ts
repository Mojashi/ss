// UserPromptSubmit: 人が書いた発言を、本人名義でチャンネルに流す。
import { relay } from "../relay";
import { isWorthRelaying } from "../relay-policy";
import { readPrompt } from "./input";

const prompt = await readPrompt();

if (isWorthRelaying(prompt.text)) await relay(prompt);
