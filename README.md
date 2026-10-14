# ss — Claude Code / Codex での発言を Slack に流す plugin

ユーザーの発言を、発言ごとにチャンネルへそのまま投稿する(スレッドにはしない)。

- 全文を載せる。gitleaks で秘密情報を `[REDACTED:rule]` に置換する(画像の中身は検査できない)
- 貼った画像も一緒に載せる(Claude Code のみ。Slack App に `files:write` が必要)
- `<task-notification>` などシステムが差し込む発言と、ほとんど英語の長文(200文字以上で、文字のうち日本語が1割未満)は流さない
- 投稿者名・アイコンは本人のものにする(Slack App に `chat:write.customize` が必要)
- 本文の上に、リポジトリ・ブランチを薄い文字で添える
- AI の応答は載せない
- gitleaks が失敗したら投稿しない

## セットアップ(各メンバー1回だけ)

Claude Code と Codex のうち、入っている方に入れる。

```sh
curl -fsSL https://raw.githubusercontent.com/Mojashi/ss/master/setup.sh | bash -s -- <SLACK_CHANNEL_ID>
```

やること:

1. gitleaks・bun がなければ入れる
2. bot token・表示名・アイコン URL を聞いて `~/.config/ss/env` に保存する(アイコンは `gh` があれば GitHub のアバター)
3. Claude Code / Codex に plugin を入れる

再起動すると発言が投稿される。Codex は初回に hook の信頼確認が出るので許可する。

止めるとき: Claude Code は `/plugin disable ss@ss`、Codex は `codex plugin remove ss@ss`。

### 手動で入れる場合

`~/.config/ss/env`(chmod 600):

```
SS_SLACK_BOT_TOKEN=xoxb-...
SS_AUTHOR_NAME=表示名
SS_AUTHOR_ICON_URL=https://avatars.githubusercontent.com/u/...
SS_SLACK_CHANNEL_ID=C0XXXX
```

```sh
# Claude Code
claude plugin marketplace add Mojashi/ss && claude plugin install ss@ss
# Codex
codex plugin marketplace add Mojashi/ss && codex plugin add ss@ss
```

### 特定リポジトリだけで有効にする(Claude Code)

`<repo>/.claude/settings.json` にコミットすると、開いたメンバーにインストールが促される。`env` はリポジトリごとに投稿先を変えたいときだけ(`~/.config/ss/env` より優先)。

```json
{
  "extraKnownMarketplaces": {
    "ss": { "source": { "source": "github", "repo": "Mojashi/ss" } }
  },
  "enabledPlugins": { "ss@ss": true },
  "env": { "SS_SLACK_CHANNEL_ID": "C0XXXX" }
}
```

## 投稿前に見え方を確認

```sh
bun run preview ~/.claude/projects/<project>/<session>.jsonl
```

## 開発

```sh
bun install && bun run typecheck && bun test
```
