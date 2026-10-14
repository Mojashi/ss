export function requireEnv(name: string, hint: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`環境変数 ${name} が未設定です (${hint})`);
  return v;
}
