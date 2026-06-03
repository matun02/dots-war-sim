> truth source: コード。食い違いはユーザーに確認。

# Wiki メンテナンス共通ルール

wiki 更新スキル (`skill-wiki-sync.md`, `skill-wiki-audit.md`) が参照する共通定義。

---

## ソース→wiki マッピングテーブル

| 変更元 | 影響する wiki |
|---|---|
| `core/src/sim/constants.ts` | `game-rules/*` (units, cities, combat, capture, mvp-params) |
| `core/src/sim/steps/*.ts` | `sim/tick-steps.md` |
| `core/src/sim/tick.ts` | `sim/tick-steps.md` |
| `core/src/sim/rng.ts` | `sim/rng.md` |
| `core/src/pathfinding/` | `pathfinding/*` |
| 地形ルール: `pathfinding/astar.ts`(コスト)・`sim/types.ts` TERRAIN_INDEX(値)・`sim/steps/move-units.ts`(速度) | `game-rules/units.md`「地形ルール」節 ＋ `pathfinding/astar.md` |
| `web/src/game/ai/` | `ai/*` |
| `web/src/game/render/` | `ui/layout.md` |
| `web/src/game/input/` | `ui/input-*.md` |
| `.claude/` 構造変更 | `conventions/directory-tree.md` |

---

## Truth source 優先度

矛盾発見時の判断基準:

```
最新のログ > 最新のソース >>>>> それ以外
```

1. 自分で判断しない（CLAUDE.md §6 wiki整合性ルール）
2. ユーザーに「コード: X, wiki: Y, どちらが正？」と確認

---

## 共通注意事項

- ★MUST NOT: wiki更新のために実装を遅延させない（MVP最優先）
- ★MUST NOT: 全wikiページを一度に読み込まない（影響範囲のページのみ）
- ★MUST: 矛盾発見時は自分で判断せずユーザーに確認
- wiki ページ新規作成時は必ず冒頭に `> truth source: {パス}` を記載
- 未実装の将来仕様は「{TASK_ID}で実装予定」と明記
