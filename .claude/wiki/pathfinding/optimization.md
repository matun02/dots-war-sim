> truth source: `packages/core/src/pathfinding/astar.ts`, `steps/recompute-paths.ts`

**再計算抑制**: Unit.goal未変更→再計算スキップ
**キャッシュ**: 同一(start_cell, goal_cell, kind)をLRU保持(64件)
**1tick上限**: 最大8ユニット/tick

段階導入計画:
| ユニット数 | アルゴリズム |
|---|---|
| 〜100 | A*(現在) |
| 100〜500 | グループA*+ローカル回避 |
| 500〜 | Flow Field |

WebWorker化: `apps/web/src/game/workers/path.worker.ts`(将来)
WASM置換ポイント: 同一インターフェース
