# Wiki 学び追記スキル

タスク完了時に技術的発見があった場合、適切な lessons/ ファイルに追記するスキル。
`skill-task-completion.md` Step 2d から学びがあれば呼び出される。

---

## 1. カテゴリ判定

| 発見内容 | 追記先 |
|---|---|
| 環境・ツール系 | `lessons/environment.md` |
| TypeScript固有 | `lessons/typescript.md` |
| 決定論関連 | `lessons/determinism.md` |
| PixiJS固有 | `lessons/pixijs.md` |
| テスト手法 | `lessons/testing.md` |
| 設計・アーキテクチャ | `lessons/architecture.md` |

---

## 2. 追記フォーマット

既存の箇条書きスタイルに合わせて末尾に追記:
```markdown
- **{タスクID}: {1行の教訓}** — {詳細(1-2文)}
```
