// 画像付きの発言を流す(user-prompt.ts が裏で起動する)。
// transcript に発言が書かれるのを待って画像を取り出す。待ちきれなければ本文だけ流す
import { imagesOf } from "../attachments";
import { relay } from "../relay";
import type { PromptInput } from "./input";

const job = JSON.parse(process.argv[2]!) as PromptInput & { since: number };

const images = await imagesOf(job.transcript_path, job.prompt, { since: job.since, waitMs: 30_000 }).catch(
  (e: unknown) => {
    console.error(`[${new Date().toISOString()}] 画像なしで流します: ${e}`);
    return [];
  },
);
await relay(job, images);
