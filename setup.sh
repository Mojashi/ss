#!/usr/bin/env bash
# ss のセットアップ(各メンバー1回だけ)。Claude Code と Codex のうち入っている方に入れる
# usage: curl -fsSL https://raw.githubusercontent.com/Mojashi/ss/master/setup.sh | bash -s -- <SLACK_CHANNEL_ID>
set -euo pipefail

CHANNEL_ID="${1:?usage: setup.sh <SLACK_CHANNEL_ID>}"
ENV_FILE="$HOME/.config/ss/env"

step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
ask() { local v; read -r "$@" v </dev/tty; printf '%s' "$v"; }

step "必要なツール"
command -v gitleaks >/dev/null || brew install gitleaks
if ! command -v bun >/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi
has() { command -v "$1" >/dev/null; }
has claude || has codex || { echo "claude (Claude Code) か codex が必要です" >&2; exit 1; }
echo "gitleaks, bun OK / claude: $(has claude && echo あり || echo なし) / codex: $(has codex && echo あり || echo なし)"

step "Slack bot token"
token=$(ask -s -p "SS_SLACK_BOT_TOKEN (xoxb-...): "); echo
curl -fsS -X POST https://slack.com/api/auth.test -H "Authorization: Bearer $token" | grep -q '"ok":true' \
  || { echo "token が無効です" >&2; exit 1; }
echo "token OK"

step "投稿者の名前とアイコン"
name=$(ask -p "Slack に出す名前: ")
[ -n "$name" ] || { echo "名前は必須です" >&2; exit 1; }
icon=""
command -v gh >/dev/null && icon=$(gh api user --jq .avatar_url 2>/dev/null || true)
if [ -n "$icon" ]; then
  echo "アイコン: GitHub のアバター ($icon)"
else
  icon=$(ask -p "アイコン画像の URL: ")
  [ -n "$icon" ] || { echo "アイコン URL は必須です" >&2; exit 1; }
fi

mkdir -p "$(dirname "$ENV_FILE")" && chmod 700 "$(dirname "$ENV_FILE")"
umask 077
cat >"$ENV_FILE" <<EOF
SS_SLACK_BOT_TOKEN=$token
SS_AUTHOR_NAME=$name
SS_AUTHOR_ICON_URL=$icon
SS_SLACK_CHANNEL_ID=$CHANNEL_ID
EOF
echo "書き込み: $ENV_FILE"

if has claude; then
  step "Claude Code に plugin をインストール"
  claude plugin marketplace add Mojashi/ss || claude plugin marketplace update ss
  claude plugin install ss@ss
fi

if has codex; then
  step "Codex に plugin をインストール"
  codex plugin marketplace add Mojashi/ss || codex plugin marketplace upgrade ss
  codex plugin add ss@ss
fi

step "完了"
echo "Claude Code / Codex を再起動すると、発言が Slack に投稿されます。"
echo "(Codex は初回に hook の信頼確認が出るので許可してください)"
echo "止めるとき: Claude Code は /plugin disable ss@ss、Codex は codex plugin remove ss@ss"
