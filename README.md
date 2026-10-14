# ss — Claude Code での発言を Slack に流す plugin

ユーザーの発言を、発言ごとにチャンネルへそのまま投稿する(スレッドにはしない)。

- 全文を載せる。gitleaks で秘密情報を `[REDACTED:rule]` に置換する
- 投稿者名・アイコンは本人のものにする(Slack App に `chat:write.customize` が必要)
- 本文の上に、リポジトリ・ブランチを薄い文字で添える
- AI の応答は載せない
- gitleaks が失敗したら投稿しない

## リポジトリで有効にする(コミットして共有)

`<repo>/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "ss": { "source": { "source": "github", "repo": "Mojashi/ss" } }
  },
  "enabledPlugins": { "ss@ss": true },
  "env": { "SS_SLACK_CHANNEL_ID": "C0XXXX" }
}
```

メンバーはそのリポジトリを開いて信頼すると plugin のインストールを促される。

## 個人で全プロジェクトに入れる

Claude Code の中で:

```
/plugin marketplace add Mojashi/ss
/plugin install ss@ss
```

`~/.claude/settings.json` に `"env": { "SS_SLACK_CHANNEL_ID": "C0XXXX" }` を足す。止めるときは `/plugin disable ss@ss`。

## 各メンバーの準備(1回だけ)

```sh
brew install gitleaks   # bun も必要
mkdir -p ~/.config/ss && chmod 700 ~/.config/ss
cat > ~/.config/ss/env <<'EOF'
SS_SLACK_BOT_TOKEN=xoxb-...
SS_AUTHOR_NAME=表示名
SS_AUTHOR_ICON_URL=https://avatars.githubusercontent.com/u/...
EOF
chmod 600 ~/.config/ss/env
```

`SS_AUTHOR_ICON_URL` は `gh api user --jq .avatar_url` で取れる。

## 投稿前に見え方を確認

```sh
bun run preview ~/.claude/projects/<project>/<session>.jsonl
```

## 開発

```sh
bun install && bun run typecheck && bun test
```
