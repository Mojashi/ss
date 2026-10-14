import { spawn } from "node:child_process";
import { mkdirSync, openSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// hook を待たせずに処理を続ける。hook のプロセスグループから切り離して起動し、
// 失敗(stderr)は ~/.local/state/ss/background.log に残す
const LOG = join(homedir(), ".local", "state", "ss", "background.log");

export function inBackground(script: string, arg: unknown): void {
  mkdirSync(join(LOG, ".."), { recursive: true });
  const child = spawn(process.execPath, [script, JSON.stringify(arg)], {
    detached: true,
    stdio: ["ignore", "ignore", openSync(LOG, "a")],
  });
  child.unref();
}
