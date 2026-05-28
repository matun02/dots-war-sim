# Wiki 更新スキル

wiki をソースコードと同期させるスキル。3つのモードがある。
「wiki更新して」「wikiを同期して」等と指示されたとき、または skill-task-completion.md Step 2d から呼び出されたときに使う。

---

## モード判定

| 状況 | モード |
|---|---|
| タスク完了後（skill-task-completion.md 経由） | **A. 差分同期** |
| 「wikiを監査して」「wiki棚卸し」と指示 | **B. 定期監査** |
| タスク完了時の「学び」記録 | **C. 学び追記** |

---

## A. 差分同期モード（タスク完了時）

### A1. 影響範囲を特定する

```bash
git diff --name-only HEAD~1
```

変更ファイルから影響する wiki を特定:

| 変更元 | wiki |
|---|---|
| `core/src/sim/constants.ts` | `game-rules/*` (units, cities, combat, capture, mvp-params) |
| `core/src/sim/steps/*.ts` | `sim/tick-steps.md` |
| `core/src/sim/tick.ts` | `sim/tick-steps.md` |
| `core/src/sim/rng.ts` | `sim/rng.md` |
| `core/src/pathfinding/` | `pathfinding/*` |
| `web/src/game/ai/` | `ai/*` |
| `web/src/game/render/` | `ui/layout.md` |
| `web/src/game/input/` | `ui/input-*.md` |
| `.claude/` 構造変更 | `conventions/directory-tree.md` |

影響する wiki がない → 完了。

### A2. 対象ページを Read して比較

各対象ページについて:
1. 冒頭の `> truth source: ...` のパスが正しいか確認
2. ページ内の定数値・処理フロー記述を、コードの現在値と比較
3. 差異があれば修正候補をリストアップ

### A3. 更新を適用

- 定数値変更 → 新しい値に書き換え（単位・tick換算も更新）
- ステップ順変更 → 番号振り直し + 責務テーブル更新
- 新機能追加 → 該当ページに追記。ページ新規作成時は index.md にも追加
- 機能削除 → 該当記述を削除。ページが空になったら削除 + index.md 更新

### A4. 検証

- [ ] 更新した全数値がコード上の値と一致
- [ ] 全 `> truth source` パスが実在する
- [ ] index.md にリンク切れがない

### A5. 判断に迷う場合

wiki とコードで矛盾を発見し、どちらが正しいか不明な場合:
1. 自分で判断しない（CLAUDE.md §6 wiki整合性ルール）
2. ユーザーに「コード: X, wiki: Y, どちらが正？」と確認
3. 優先度: 最新のログ > 最新のソース >>>>> それ以外

---

## B. 定期監査モード

「wikiを監査して」「wiki棚卸し」と指示されたときに実行。

### B1. truth source パス検証

全 wiki ページの冒頭 `> truth source: ...` を抽出し、記載パスが実在するか確認:
```bash
grep -r "truth source:" .claude/wiki/ --include="*.md"
```
存在しないパスがあれば報告。

### B2. 定数値スポットチェック

`constants.ts` の全定数を読み、以下の wiki ページの数値と照合:
- `game-rules/units.md` — UNIT_STATS の speed, attack, hp, intervals
- `game-rules/cities.md` — SUPPLY_MAX, POST_CAPTURE_COOLDOWN_TICKS
- `game-rules/capture.md` — CAPTURE_TICKS
- `game-rules/combat.md` — ATTACK_RANGE, ENGAGE_DISTANCE
- `game-rules/mvp-params.md` — TICK_RATE, GAME_TIME_LIMIT_TICKS
- `sim/tick-steps.md` — tick.ts のステップ順序

### B3. index.md リンク検証

全 index.md のリンク先ファイルが実在するか確認。
wiki/ 配下にファイルがあるのに index.md から参照されていないものがないか確認。

### B4. 不整合レポート

発見した不整合を以下の形式でユーザーに報告:
```
| # | wiki | 現在値 | コード値 | 推奨 |
|---|------|--------|----------|------|
| 1 | cities.md L6 | クールダウン100tick | 150tick | コード正→wiki修正 |
```

ユーザーの承認後に一括修正。

---

## C. 学び追記モード

タスク完了時に技術的発見があった場合に実行。

### C1. カテゴリ判定

| 発見内容 | 追記先 |
|---|---|
| 環境・ツール系 | `lessons/environment.md` |
| TypeScript固有 | `lessons/typescript.md` |
| 決定論関連 | `lessons/determinism.md` |
| PixiJS固有 | `lessons/pixijs.md` |
| テスト手法 | `lessons/testing.md` |
| 設計・アーキテクチャ | `lessons/architecture.md` |

### C2. 追記フォーマット

既存の箇条書きスタイルに合わせて末尾に追記:
```markdown
- **{タスクID}: {1行の教訓}** — {詳細(1-2文)}
```

---

## 注意事項

- ★MUST NOT: wiki更新のために実装を遅延させない（MVP最優先）
- ★MUST NOT: 全wikiページを一度に読み込まない（影響範囲のページのみ）
- ★MUST: 矛盾発見時は自分で判断せずユーザーに確認
- wiki ページ新規作成時は必ず冒頭に `> truth source: {パス}` を記載
