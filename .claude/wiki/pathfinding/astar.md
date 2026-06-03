> truth source: `packages/core/src/pathfinding/astar.ts`

- 8方向+対角コスト(整数: 直進10/対角14)
- ヒューリスティック: オクタイル
- 通行コスト:

| 地形 | light | heavy |
|---|---|---|
| plain | 1 | 1 |
| mountain | ∞ | ∞ |
| forest | 1 | 2 |
| water | 2 | 2 |
| city | 1 | 1 |

（∞=通行不可。**mountain は全員不可＝壁**。water・forest は両者通行可で、heavy は森が高コスト）

※ ここでの「コスト」は**経路選択(routing)用**。実移動速度は地形で別途補正される（`TERRAIN_SPEED_PCT`／`sim/steps/move-units.ts`。water 50%・forest heavy 75% 等）。

- 優先度キュー: binary heap(自前実装)
- tie-break: `(y * width + x)` 昇順(決定論)
- 対角移動時は隣接2セルチェック必須
