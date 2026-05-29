# タスク完了ワークフロー

タスク完了時に TASKS.md / CLAUDE.md を更新し、commit & push するスキル。
旧 `skill-update-tasks.md` + `skill-update-claude.md` + `skill-doc-commit.md` を統合。

---

## 0. 受け入れ基準を確認する

TASKS.md の当該タスクの受け入れ基準を全て満たしていることを確認する。
テスト結果、typecheck、lint の出力を根拠として記録しておく。

---

## 1. 情報を収集する

| 項目 | 取得方法 | 例 |
|------|---------|-----|
| タスク ID | 会話コンテキスト | `P1-T12` |
| 完了日 | 今日の日付 | `2026-05-22` |
| コミットハッシュ | `git log --oneline -1` の先頭 7 文字 | `abc1234` |
| テスト件数 | `pnpm -r test` の出力 | `累計 120` |
| 成果の要約 | 1 行で | 勝敗判定 + 結果画面 + タイトル画面 |
| 実績（所要時間） | ユーザーに確認 or 会話から推定 | `45 分` |
| 学び | 技術的発見・注意点 | IEEE 754 対策が必要だった等 |

---

## 2. TASKS.md を更新する

### 2a. 完了済みタスク表に行を追加

```markdown
| P1-T12 | 勝敗判定 + 結果画面 | 2026-05-22 | `abc1234` | 15 件 (累計 118) |
```

### 2b. ★次タスクを繰り上げ

- 完了した「★次タスク」セクションを削除
- 「次々タスク」の内容を「★次タスク」に昇格
- 新しい「次々タスク」を残タスク一覧から詳細化して記載

### 2c. マイルストーンを更新

該当マイルストーンの進捗を更新（「進行中」→「完了」等）。

### 2d. wiki を同期更新する

`skill-wiki-sync.md` を実行する。
アルゴリズムや定数を変更した場合は必ず実行すること。
学びがあれば `skill-wiki-lessons.md` も実行する。

### 2e. archive/completed-tasks.md に詳細を追加

既存フォーマットに合わせて以下を追記:
- 目的、作業内容、成果物
- **実績**: 所要時間
- **学び**: 技術的発見・注意点（将来の同種タスクで役立つ知見）

---

## 3. CLAUDE.md §8 変更履歴を更新する

テーブルは **最新 3 件のみ保持**。4 件目以降は `archive/changelog.md` へ移動。

```markdown
| 2026-05-22 | 1.0.12 | P1-T12 完了（勝敗判定 + 結果画面）。テスト 15 件追加（合計 118 件） |
```

- バージョン: 前回の patch +1
- 内容: `{タスクID} 完了（{タスク名}）。{主要成果}`
- 最古の行を `archive/changelog.md` の末尾に移動してから新行を追加

---

## 4. commit & push する

```bash
git add .claude/TASKS.md .claude/CLAUDE.md .claude/archive/changelog.md .claude/archive/completed-tasks.md .claude/wiki/
git commit -m "docs(claude): update project docs for {TASK_ID} completion

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push
```

- ソースコードの変更と混ぜない（ドキュメント更新は独立コミット）
- force push 禁止
- conflict がある場合は push せずユーザーに報告

---

## 5. 次タスクプロンプトを生成する

push 完了後、`skill-next-task-prompt.md` に従い次タスク向けプロンプトを生成する。

---

## 注意事項

- 既に完了表に記載済みのタスクは二重更新しない
- TASKS.md と CLAUDE.md で同じバージョン番号を使う
- 変更履歴の要約には**主要ファイルパス**と**テスト件数**を含める
