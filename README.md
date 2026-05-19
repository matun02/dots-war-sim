# War of Dots クローン

ミニマル RTS ゲーム — Web ブラウザで動作する 2D トップダウンの陣取りゲーム。
TypeScript + Svelte 5 + PixiJS v8 + Cloudflare で構築。

## ドキュメント

- [`.claude/CLAUDE.md`](./.claude/CLAUDE.md) — プロジェクト規約（最初に読む）
- [`.claude/DESIGN.md`](./.claude/DESIGN.md) — 設計書
- [`.claude/TASKS.md`](./.claude/TASKS.md) — 作業手順
- [`.claude/SETUP.md`](./.claude/SETUP.md) — 環境セットアップ（Windows 実録 + トラブルシュート）

## 必要環境

- **Node.js**: 22 以上 (`.nvmrc` 参照)
- **pnpm**: 9.15.0 (corepack または npm から)

## セットアップ

```bash
pnpm install
```

## 開発

```bash
# クライアント (apps/web) を開発サーバで起動
pnpm dev

# 全パッケージで型チェック
pnpm typecheck

# 全パッケージでテスト
pnpm test

# Lint / Format
pnpm lint
pnpm format
```

`pnpm dev` 実行後、`http://localhost:5173` を開く。

## ワークスペース構成

```
war-of-dots/
├── apps/web/         # Svelte 5 + Vite + PixiJS (クライアント)
├── packages/core/    # 純TS の sim/共通ロジック (決定論的)
└── .claude/          # プロジェクト規約・設計・作業手順
```

詳細は [CLAUDE.md §3](./.claude/CLAUDE.md) 参照。

## ライセンス

MIT — `LICENSE` 参照
