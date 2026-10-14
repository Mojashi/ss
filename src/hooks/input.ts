// Claude Code の hook は stdin に JSON を渡してくる
export type HookInput = {
  cwd: string;
};

export async function readHookInput<T extends HookInput>(): Promise<T> {
  return (await Bun.stdin.json()) as T;
}
