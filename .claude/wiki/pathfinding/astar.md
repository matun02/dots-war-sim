> truth source: `packages/core/src/pathfinding/astar.ts`

- 8方向+対角コスト(整数: 直進10/対角14)
- ヒューリスティック: オクタイル
- 通行コスト:

| 地形 | light | heavy |
|---|---|---|
| plain | 1 | 1 |
| forest | 2 | ∞ |
| mountain | 3 | ∞ |
| water | ∞ | ∞ |
| city | 1 | 1 |

- 優先度キュー: binary heap(自前実装)
- tie-break: `(y * width + x)` 昇順(決定論)
- 対角移動時は隣接2セルチェック必須
